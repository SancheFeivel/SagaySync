import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Announcement, Data, EventItem, Officer, Org } from './types';
import { OfflineError, repo } from './repo';
import { cmpEvent, todayStr } from './date';

const K = { cache: 'ss:cache', follows: 'ss:follows', seen: 'ss:seen', notif: 'ss:notif', session: 'ss:session' };
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
  toast: string | null;
  showToast: (m: string) => void;
};

const Ctx = createContext<Store>(null as unknown as Store);
export const useStore = () => useContext(Ctx);
const UNKNOWN: Org = { id: '?', name: 'Unknown', fullName: '', description: '', adviser: '', president: '', office: '', facebook: '' };

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Load>({ status: 'loading', data: null, at: null, cached: false });
  const [officer, setOfficer] = useState<Officer | null>(null);
  const [follows, setFollows] = useState<string[]>([]);
  const [seen, setSeen] = useState<Record<string, string>>({});
  const [notifOn, setNotifOnState] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      try {
        const [f, s, n, o] = await Promise.all([K.follows, K.seen, K.notif, K.session].map((k) => AsyncStorage.getItem(k)));
        if (f) setFollows(JSON.parse(f));
        if (s) setSeen(JSON.parse(s));
        if (n) setNotifOnState(JSON.parse(n));
        if (o) setOfficer(JSON.parse(o)); // officers stay signed in until they log out
      } catch {}
      load();
    })();
  }, [load]);

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

  const toggleFollow = useCallback((id: string) => {
    setFollows((f) => {
      const n = f.includes(id) ? f.filter((x) => x !== id) : [...f, id];
      save(K.follows, n);
      return n;
    });
    // TODO push: subscribe/unsubscribe this device to the org topic (needs a dev build, not Expo Go)
  }, []);
  const setNotifOn = useCallback((v: boolean) => {
    setNotifOnState(v);
    save(K.notif, v);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const o = await repo.signIn(email, password);
    setOfficer(o);
    save(K.session, o);
  }, []);
  const signOut = useCallback(async () => {
    setOfficer(null);
    await repo.signOut().catch(() => {}); 
    await AsyncStorage.removeItem(K.session).catch(() => {});
  }, []);

  const showToast = useCallback((m: string) => {
    setToast(m);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }, []);

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
    officer, signIn, signOut,
    follows, toggleFollow, newCount, markSeen,
    notifOn, setNotifOn,
    saveAnnouncement: (a, m) => run(() => repo.saveAnnouncement(a), m),
    deleteAnnouncement: (id) => run(() => repo.deleteAnnouncement(id), 'Deleted.'),
    saveEvent: (e, linked, m) =>
      run(async () => {
        await repo.saveEvent(e);
        if (linked) await repo.saveAnnouncement(linked);
      }, m),
    deleteEvent: (id) => run(() => repo.deleteEvent(id), 'Deleted.'),
    toast, showToast,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
