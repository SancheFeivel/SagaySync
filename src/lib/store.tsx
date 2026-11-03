import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Admin, Announcement, Data, EventItem, Officer, Org } from './types';
import { OfflineError, repo, Session } from './repo';
import { onNotificationTap, registerForPush, sendPush } from './push';
import { openAnnouncement } from './nav';
import { cmpEvent, todayStr } from './date';

const K = { cache: 'ss:cache', follows: 'ss:follows', seen: 'ss:seen', notif: 'ss:notif', session: 'ss:session', admin: 'ss:admin' };
const save = (k: string, v: unknown) => AsyncStorage.setItem(k, JSON.stringify(v)).catch(() => {});

type Status = 'loading' | 'ready' | 'error' | 'nocache';
type Load = { status: Status; data: Data | null; at: number | null; cached: boolean };

/** A scheduled post counts as live once its time has passed. No server timer needed for the prototype. */
export const isLive = (a: Announcement) =>
  a.status === 'published' || (a.status === 'scheduled' && !!a.publishAt && a.publishAt <= new Date().toISOString());
export const postTime = (a: Announcement) => a.publishAt ?? a.createdAt;

type Store = {
  state: Load;
  refresh: () => Promise<void>;
  orgs: Org[];
  announcements: Announcement[];
  events: EventItem[];
  feed: Announcement[]; // live, newest first
  liveEvents: EventItem[]; // published, by date
  upcoming: EventItem[]; // published, today onward
  orgById: (id: string) => Org;
  officer: Officer | null;
  admin: Admin | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  follows: string[];
  toggleFollow: (id: string) => void;
  newCount: (orgId: string) => number;
  markSeen: (orgId: string) => void;
  notifOn: boolean;
  setNotifOn: (v: boolean) => void;
  saveAnnouncement: (a: Announcement, okMsg?: string) => Promise<boolean>;
  deleteAnnouncement: (id: string) => Promise<boolean>;
  saveEvent: (e: EventItem, linked?: Announcement, okMsg?: string) => Promise<boolean>;
  deleteEvent: (id: string) => Promise<boolean>;
  saveOrg: (o: Org, okMsg?: string) => Promise<boolean>;
  deleteOrg: (id: string) => Promise<boolean>;
  toast: string | null;
  showToast: (m: string) => void;
};

const Ctx = createContext<Store>(null as unknown as Store);
export const useStore = () => useContext(Ctx);
const UNKNOWN: Org = { id: '?', name: 'Unknown', fullName: '', description: '', adviser: '', president: '', office: '', facebook: '' };

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Load>({ status: 'loading', data: null, at: null, cached: false });
  const [officer, setOfficer] = useState<Officer | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [follows, setFollows] = useState<string[]>([]);
  const [seen, setSeen] = useState<Record<string, string>>({});
  const [notifOn, setNotifOnState] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pushToken = useRef<string | null>(null); // null in Expo Go, on emulators, or if denied

  const load = useCallback(async (silent = false) => {
    if (!silent) setState((s) => (s.data ? s : { ...s, status: 'loading' }));
    try {
      const data = await repo.fetchAll();
      const at = Date.now();
      setState({ status: 'ready', data, at, cached: false });
      save(K.cache, { data, at });
    } catch (e) {
      const raw = await AsyncStorage.getItem(K.cache).catch(() => null);
      if (raw) {
        const c = JSON.parse(raw) as { data: Data; at: number };
        setState({ status: 'ready', data: c.data, at: c.at, cached: true });
      } else {
        setState({ status: e instanceof OfflineError ? 'nocache' : 'error', data: null, at: null, cached: false });
      }
    }
  }, []);

  useEffect(() => {
    (async () => {
      let savedFollows: string[] = [];
      let savedNotif = true;
      try {
        const [f, s, n] = await Promise.all([K.follows, K.seen, K.notif].map((k) => AsyncStorage.getItem(k)));
        if (f) { savedFollows = JSON.parse(f); setFollows(savedFollows); }
        if (s) setSeen(JSON.parse(s));
        if (n) { savedNotif = JSON.parse(n); setNotifOnState(savedNotif); }
      } catch {}
      load();
      // Register this device for push and record which groups it follows.
      const token = await registerForPush();
      pushToken.current = token;
      if (token) repo.saveDevice(token, savedFollows, savedNotif).catch(() => {});
    })();
  }, [load]);

  /** Shows the signed-in role and keeps a copy for offline starts. */
  const applySession = useCallback((s: Session) => {
    setOfficer(s.officer);
    setAdmin(s.admin);
    if (s.officer) save(K.session, s.officer); else AsyncStorage.removeItem(K.session).catch(() => {});
    if (s.admin) save(K.admin, s.admin); else AsyncStorage.removeItem(K.admin).catch(() => {});
  }, []);

  // Officer and admin mode follow the live Firebase login plus officers/{uid} and admins/{uid}, so a
  // disabled account, a switched-off officer or a removed record drops back to student view. The saved
  // copy is used only when the phone is offline and the check can't run (staff stay signed in until they log out).
  useEffect(() => {
    const forget = () => applySession({ admin: null, officer: null });
    (async () => {
      try {
        applySession(await repo.currentSession());
      } catch (e) {
        if (!(e instanceof OfflineError)) return;
        const [o, a] = await Promise.all([K.session, K.admin].map((k) => AsyncStorage.getItem(k).catch(() => null)));
        if (a) setAdmin(JSON.parse(a));
        else if (o) setOfficer(JSON.parse(o));
      }
    })();
    // Firebase signs the user out if their session is revoked while the app is open.
    return repo.onSignedOut(forget);
  }, [applySession]);

  // Tapping an announcement notification opens that post.
  useEffect(
    () => onNotificationTap((d) => {
      if (typeof d.announcementId === 'string') openAnnouncement(d.announcementId);
    }),
    [],
  );

  const data = state.data;
  const orgs = data?.orgs ?? [];
  const announcements = data?.announcements ?? [];
  const events = data?.events ?? [];

  const feed = useMemo(
    () => announcements.filter(isLive).sort((a, b) => postTime(b).localeCompare(postTime(a))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data],
  );
  const liveEvents = useMemo(() => events.filter((e) => e.status === 'published').sort(cmpEvent), [data]); // eslint-disable-line react-hooks/exhaustive-deps
  const upcoming = useMemo(() => liveEvents.filter((e) => e.date >= todayStr()), [liveEvents]);

  const orgById = useCallback((id: string) => orgs.find((o) => o.id === id) ?? UNKNOWN, [orgs]);

  // Follows of a group an admin removed are dropped, so this device's follow list stays within the
  // groups the rules accept (otherwise its push registration would be refused).
  const liveFollows = useMemo(() => {
    if (!data) return follows;
    const ids = new Set(data.orgs.map((o) => o.id));
    return follows.filter((f) => ids.has(f));
  }, [data, follows]);
  const droppedFollow = liveFollows.length !== follows.length;

  const newCount = useCallback(
    (orgId: string) => feed.filter((a) => a.orgId === orgId && postTime(a) > (seen[orgId] ?? '')).length,
    [feed, seen],
  );
  const markSeen = useCallback((orgId: string) => {
    setSeen((s) => {
      const n = { ...s, [orgId]: new Date().toISOString() };
      save(K.seen, n);
      return n;
    });
  }, []);

  /** Keeps this device's row in the push registry in step with what it follows. */
  const syncDevice = useCallback((nextFollows: string[], enabled: boolean) => {
    const t = pushToken.current;
    if (t) repo.saveDevice(t, nextFollows, enabled).catch(() => {});
  }, []);

  // Save the trimmed list and re-register once a removed group has been dropped.
  useEffect(() => {
    if (!droppedFollow) return;
    save(K.follows, liveFollows);
    syncDevice(liveFollows, notifOn);
  }, [droppedFollow, liveFollows, notifOn, syncDevice]);

  const toggleFollow = useCallback((id: string) => {
    const next = liveFollows.includes(id) ? liveFollows.filter((x) => x !== id) : [...liveFollows, id];
    setFollows(next);
    save(K.follows, next);
    syncDevice(next, notifOn);
  }, [liveFollows, notifOn, syncDevice]);

  const setNotifOn = useCallback((v: boolean) => {
    setNotifOnState(v);
    save(K.notif, v);
    // Turning it on for the first time is the moment to ask for permission.
    if (v && !pushToken.current) {
      registerForPush().then((t) => {
        pushToken.current = t;
        if (t) repo.saveDevice(t, liveFollows, true).catch(() => {});
      });
    } else {
      syncDevice(liveFollows, v);
    }
  }, [liveFollows, syncDevice]);

  // Both reload the data: staff see drafts that guests can't, and those must appear (or go) at once.
  const signIn = useCallback(async (email: string, password: string) => {
    applySession(await repo.signIn(email, password));
    load(true);
  }, [applySession, load]);
  const signOut = useCallback(async () => {
    applySession({ admin: null, officer: null });
    await repo.signOut().catch(() => {});
    load(true);
  }, [applySession, load]);

  const showToast = useCallback((m: string) => {
    setToast(m);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  /** Pushes a newly published announcement to everyone following that group. Never throws. */
  const notifyFollowers = useCallback(
    async (a: Announcement) => {
      try {
        const tokens = await repo.tokensFollowing(a.orgId);
        const to = tokens.filter((t) => t !== pushToken.current); // don't buzz the poster's own phone
        if (!to.length) return;
        const dead = await sendPush(to, orgById(a.orgId).name, a.title, { announcementId: a.id });
        if (dead.length) repo.deleteDevices(dead).catch(() => {});
      } catch {
        // A failed notification must never make a successful post look failed.
      }
    },
    [orgById],
  );

  const run = useCallback(
    async (fn: () => Promise<unknown>, okMsg?: string) => {
      try {
        await fn();
        await load(true);
        if (okMsg) showToast(okMsg);
        return true;
      } catch {
        Alert.alert('Something went wrong', 'Your change was not saved. Check your connection and try again.');
        return false;
      }
    },
    [load, showToast],
  );

  const value: Store = {
    state,
    refresh: () => load(true),
    orgs, announcements, events, feed, liveEvents, upcoming, orgById,
    officer, admin, signIn, signOut,
    follows: liveFollows, toggleFollow, newCount, markSeen,
    notifOn, setNotifOn,
    saveAnnouncement: async (a, m) => {
      const before = announcements.find((x) => x.id === a.id);
      const ok = await run(() => repo.saveAnnouncement(a), m);
      // Notify only the first time a post actually goes live, never on a later edit.
      if (ok && a.status === 'published' && before?.status !== 'published') notifyFollowers(a);
      return ok;
    },
    deleteAnnouncement: (id) => run(() => repo.deleteAnnouncement(id), 'Deleted.'),
    saveEvent: async (e, linked, m) => {
      const ok = await run(async () => {
        await repo.saveEvent(e);
        if (linked) await repo.saveAnnouncement(linked);
      }, m);
      // "Also post an announcement" reaches the feed, so it should reach followers too.
      if (ok && linked?.status === 'published') notifyFollowers(linked);
      return ok;
    },
    deleteEvent: (id) => run(() => repo.deleteEvent(id), 'Deleted.'),
    saveOrg: (o, m) => run(() => repo.saveOrg(o, orgs.map((x) => x.id)), m),
    deleteOrg: (id) => run(() => repo.deleteOrg(id, orgs.map((x) => x.id)), 'Group removed.'),
    toast, showToast,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
