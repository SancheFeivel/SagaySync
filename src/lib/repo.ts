// Firestore-backed data layer. store.tsx calls everything through `repo`.
import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signOut as fbSignOut,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type DocumentReference,
} from "firebase/firestore";
import { auth, createAccount, db } from "../firebase";
import type { Admin, Announcement, Data, EventItem, Officer, OfficerRecord, Org } from "./types";

/** Who is signed in. At most one is set; an admin is never also treated as an officer. */
export type Session = { admin: Admin | null; officer: Officer | null };

export class OfflineError extends Error {
  constructor(msg = "No connection") {
    super(msg);
    Object.setPrototypeOf(this, OfflineError.prototype);
  }
}

/**
 * publishAt is a Firestore Timestamp in the database (so the rules can compare it to the
 * server clock) but an ISO string everywhere in the app. Conversion happens only here.
 */
const withId = <T>(d: { id: string; data: () => any }) => {
  const data = d.data();
  if (data.publishAt instanceof Timestamp) data.publishAt = data.publishAt.toDate().toISOString();
  return { ...data, id: d.id } as T;
};

/** Firestore rejects `undefined` fields. */
const clean = <T extends object>(o: T) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));

const guard = async <T>(fn: () => Promise<T>): Promise<T> => {
  try {
    return await fn();
  } catch (e: any) {
    if (e?.code === "unavailable" || e?.code === "auth/network-request-failed")
      throw new OfflineError();
    throw e;
  }
};

/**
 * Guests see a scheduled post a couple of minutes after its time. The rules check
 * publishAt against the server clock, so a phone clock running slightly fast would
 * otherwise ask for posts the server still considers future and be refused.
 */
const CLOCK_SLACK_MS = 2 * 60_000;

/**
 * The signed-in admin or officer, from the live Firebase login plus admins/{uid} and
 * officers/{uid}, never a saved copy. An officer an admin switched off counts as nobody.
 */
async function me(): Promise<Session> {
  await auth.authStateReady(); // wait for the saved login to be restored on app start
  const u = auth.currentUser;
  if (!u) return { admin: null, officer: null };
  const [a, o] = await Promise.all([
    // A refused admins read (rules from before the admin role) just means "not an admin",
    // so officers keep working even if the new rules aren't deployed yet.
    getDoc(doc(db, "admins", u.uid)).catch(() => null),
    getDoc(doc(db, "officers", u.uid)),
  ]);
  const email = u.email ?? "";
  if (a?.exists()) return { admin: { email, uid: u.uid }, officer: null };
  if (o.exists() && o.data().active !== false)
    return { admin: null, officer: { email, orgId: o.data().orgId as string } };
  return { admin: null, officer: null };
}

/** Un-pins an older post. Also brings pre-Timestamp publishAt values in line so the update passes the rules. */
const unpinPatch = (d: any) => ({
  pinned: false,
  publishAt:
    d.status !== "scheduled"
      ? deleteField()
      : typeof d.publishAt === "string"
        ? Timestamp.fromDate(new Date(d.publishAt))
        : d.publishAt,
});

export const repo = {
  /**
   * Everything the app shows. Guests get live content only; officers also get their own
   * group's drafts; admins get every post in every group, drafts and scheduled included.
   */
  async fetchAll(): Promise<Data> {
    return guard(async () => {
      const who = await me();
      const orgId = who.officer?.orgId ?? null;

      const [orgSnap, pubSnap, evSnap, liveScheduled] = await Promise.all([
        getDocs(collection(db, "orgs")),
        getDocs(query(collection(db, "announcements"), where("status", "==", "published"))),
        getDocs(query(collection(db, "events"), where("status", "==", "published"))),
        // Scheduled posts whose time has passed. Kept separate so if this one is refused
        // (e.g. a phone clock far ahead of the server) only these drop out, not the whole feed.
        getDocs(
          query(
            collection(db, "announcements"),
            where("status", "==", "scheduled"),
            where("publishAt", "<=", Timestamp.fromMillis(Date.now() - CLOCK_SLACK_MS)),
            orderBy("publishAt", "desc"),
          ),
        )
          .then((s) => s.docs)
          .catch(() => []),
      ]);

      const anns = new Map<string, Announcement>();
      const evs = new Map<string, EventItem>();
      [...pubSnap.docs, ...liveScheduled].forEach((d) => anns.set(d.id, withId<Announcement>(d)));
      evSnap.docs.forEach((d) => evs.set(d.id, withId<EventItem>(d)));

      if (who.admin) {
        const [allAnn, allEv] = await Promise.all([
          getDocs(collection(db, "announcements")),
          getDocs(collection(db, "events")),
        ]);
        allAnn.docs.forEach((d) => anns.set(d.id, withId<Announcement>(d)));
        allEv.docs.forEach((d) => evs.set(d.id, withId<EventItem>(d)));
      } else if (orgId) {
        const [myAnn, myEv] = await Promise.all([
          getDocs(query(collection(db, "announcements"), where("orgId", "==", orgId))),
          getDocs(query(collection(db, "events"), where("orgId", "==", orgId))),
        ]);
        myAnn.docs.forEach((d) => anns.set(d.id, withId<Announcement>(d)));
        myEv.docs.forEach((d) => evs.set(d.id, withId<EventItem>(d)));
      }

      return {
        orgs: orgSnap.docs.map((d) => withId<Org>(d)),
        announcements: [...anns.values()],
        events: [...evs.values()],
      };
    });
  },

  /** The signed-in admin or officer (or neither). Throws OfflineError when it can't be checked. */
  currentSession: () => guard(me),

  /** Runs `cb` whenever Firebase reports no signed-in user (logout, or a revoked session). */
  onSignedOut: (cb: () => void) =>
    onAuthStateChanged(auth, (u) => {
      if (!u) cb();
    }),

  /** Signs in an admin or an active officer. Anyone else is signed straight back out. */
  async signIn(email: string, password: string): Promise<Session> {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      const s = await me();
      if (!s.admin && !s.officer) {
        await fbSignOut(auth);
        throw new Error("no-role");
      }
      return s;
    } catch (e: any) {
      if (e?.code === "auth/network-request-failed")
        throw new Error("No connection. Try again.");
      throw new Error("Incorrect email or password"); // never say which part was wrong
    }
  },

  async signOut() {
    await fbSignOut(auth);
  },

  /** Emails a reset link. Never reveals whether the address belongs to an account. */
  async sendReset(email: string) {
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (e: any) {
      if (e?.code === "auth/user-not-found") return;
      if (e?.code === "auth/network-request-failed") throw new OfflineError();
      throw e;
    }
  },

  /** Open to guests. Write-only: feedback is read in the Firebase Console. */
  async sendFeedback(rating: number, comment: string) {
    await guard(() =>
      addDoc(collection(db, "feedback"), {
        rating,
        comment,
        createdAt: serverTimestamp(),
      }),
    );
  },

  /**
   * One doc per device, keyed by its Expo push token, holding the groups it follows.
   * Written by guests (no login), so it is deliberately small and self-describing.
   */
  async saveDevice(token: string, follows: string[], enabled: boolean) {
    await guard(() =>
      setDoc(doc(db, "devices", token), {
        token,
        follows,
        enabled,
        updatedAt: serverTimestamp(),
      }),
    );
  },

  /** Push tokens of devices following this group that still want alerts. Officers only. */
  async tokensFollowing(orgId: string): Promise<string[]> {
    return guard(async () => {
      // array-contains alone uses the automatic index; `enabled` is filtered here to
      // avoid needing a composite index deploy.
      const snap = await getDocs(
        query(collection(db, "devices"), where("follows", "array-contains", orgId)),
      );
      return snap.docs
        .filter((d) => d.get("enabled") !== false)
        .map((d) => d.get("token") as string)
        .filter(Boolean);
    });
  },

  /** Drops tokens Expo reported as dead, so the registry doesn't rot. */
  async deleteDevices(tokens: string[]) {
    await Promise.all(tokens.map((t) => deleteDoc(doc(db, "devices", t)).catch(() => {})));
  },

  async saveAnnouncement(a: Announcement) {
    await guard(async () => {
      const ref = doc(db, "announcements", a.id);
      // One pinned post per group: pinning this one un-pins the others.
      if (a.pinned && a.status !== "draft") {
        const snap = await getDocs(
          query(
            collection(db, "announcements"),
            where("orgId", "==", a.orgId),
            where("pinned", "==", true),
          ),
        );
        await Promise.all(
          snap.docs
            .filter((d) => d.id !== ref.id)
            .map((d) => updateDoc(d.ref, unpinPatch(d.data()))),
        );
      }
      const { publishAt, ...rest } = a;
      await setDoc(
        ref,
        clean({
          ...rest,
          // Only scheduled posts carry publishAt; the rules reject it anywhere else.
          publishAt:
            a.status === "scheduled" && publishAt
              ? Timestamp.fromDate(new Date(publishAt))
              : undefined,
        }),
      );
    });
  },
  deleteAnnouncement: (id: string) => guard(() => deleteDoc(doc(db, "announcements", id))),

  async saveEvent(e: EventItem) {
    await guard(() => setDoc(doc(db, "events", e.id), clean(e)));
  },
  deleteEvent: (id: string) => guard(() => deleteDoc(doc(db, "events", id))),

  /* ---------- Admin only (the rules refuse everyone else) ---------- */

  /**
   * Creates or edits a group. Also rewrites meta/groups, the list of group ids a device is
   * allowed to follow, so students can follow a new group straight away.
   */
  async saveOrg(o: Org, existingIds: string[]) {
    await guard(async () => {
      const b = writeBatch(db);
      // Only the known fields: the rules reject anything else.
      b.set(doc(db, "orgs", o.id), {
        name: o.name, fullName: o.fullName, description: o.description,
        adviser: o.adviser, president: o.president, office: o.office, facebook: o.facebook,
      });
      b.set(doc(db, "meta", "groups"), { ids: [...new Set([...existingIds, o.id])] });
      await b.commit();
    });
  },

  /** What removing a group would take with it, for the confirmation message. Counts drafts too. */
  async orgUsage(orgId: string): Promise<{ announcements: number; events: number; officers: number }> {
    return guard(async () => {
      const [a, e, o] = await Promise.all(
        ["announcements", "events", "officers"].map((c) =>
          getDocs(query(collection(db, c), where("orgId", "==", orgId))),
        ),
      );
      return { announcements: a.size, events: e.size, officers: o.size };
    });
  },

  /**
   * Removes a group along with its announcements, events and officer records (their Firebase
   * logins stay but can no longer post), and drops it from meta/groups so devices can't follow it.
   * Small groups go in one batch, so it all happens or nothing does. A batch holds 500 writes, so
   * a very large group's posts are cleared in earlier batches and the group itself goes last.
   */
  async deleteOrg(orgId: string, remainingIds: string[]) {
    await guard(async () => {
      const snaps = await Promise.all(
        ["announcements", "events", "officers"].map((c) =>
          getDocs(query(collection(db, c), where("orgId", "==", orgId))),
        ),
      );
      const refs: DocumentReference[] = snaps.flatMap((s) => s.docs.map((d) => d.ref));
      const LIMIT = 498; // room for the group doc and meta/groups in the last batch
      while (refs.length > LIMIT) {
        const b = writeBatch(db);
        refs.splice(0, LIMIT).forEach((r) => b.delete(r));
        await b.commit();
      }
      const b = writeBatch(db);
      refs.forEach((r) => b.delete(r));
      b.delete(doc(db, "orgs", orgId));
      b.set(doc(db, "meta", "groups"), { ids: remainingIds.filter((id) => id !== orgId) });
      await b.commit();
    });
  },

  async listOfficers(): Promise<OfficerRecord[]> {
    return guard(async () => {
      const snap = await getDocs(collection(db, "officers"));
      return snap.docs
        .map((d) => ({
          uid: d.id,
          email: (d.get("email") as string | undefined) ?? "",
          orgId: (d.get("orgId") as string | undefined) ?? "",
          active: d.get("active") !== false,
        }))
        .sort((x, y) => x.email.localeCompare(y.email));
    });
  },

  /**
   * Makes a login for a new officer and ties it to a group. The admin stays signed in.
   * Throws the Firebase auth error (auth/email-already-in-use, auth/invalid-email,
   * auth/weak-password), OfflineError, or code "link-failed" when the login was made but
   * the officers record could not be written (e.g. the new rules are not deployed yet).
   */
  async createOfficer(email: string, password: string, orgId: string): Promise<string> {
    const addr = email.trim().toLowerCase();
    const uid = await guard(() => createAccount(addr, password));
    try {
      await setDoc(doc(db, "officers", uid), {
        email: addr, orgId, active: true, addedBy: auth.currentUser?.uid ?? "",
      });
    } catch {
      throw Object.assign(new Error("Login made but not linked to a group"), { code: "link-failed" });
    }
    return uid;
  },

  updateOfficer: (uid: string, patch: { orgId?: string; active?: boolean }) =>
    guard(() => updateDoc(doc(db, "officers", uid), patch)),

  /** Removes the officer record. Their Firebase login stays (delete it in the Console) but can no longer post. */
  deleteOfficer: (uid: string) => guard(() => deleteDoc(doc(db, "officers", uid))),
};
