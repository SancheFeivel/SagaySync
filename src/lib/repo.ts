// Firestore-backed repo. Same interface your store.tsx already calls:
//   repo.fetchAll / signIn / signOut / saveAnnouncement / deleteAnnouncement / saveEvent / deleteEvent
// Save the old mock as repo.mock.ts first, then put this at src/lib/repo.ts.
import {
  signOut as fbSignOut,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import type { Announcement, Data, EventItem, Officer, Org } from "./types";

export class OfflineError extends Error {
  constructor(msg = "No connection") {
    super(msg);
    Object.setPrototypeOf(this, OfflineError.prototype);
  }
}

const withId = <T>(d: { id: string; data: () => any }) =>
  ({ ...d.data(), id: d.id }) as T;

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

async function myOrgId(): Promise<string | null> {
  await auth.authStateReady(); // wait for the saved login to be restored on app start
  const u = auth.currentUser;
  if (!u) return null;
  const s = await getDoc(doc(db, "officers", u.uid));
  return s.exists() ? (s.data().orgId as string) : null;
}

export const repo = {
  /** Everything the app shows. Guests get live content only; officers also get their own group's drafts. */
  async fetchAll(): Promise<Data> {
    return guard(async () => {
      const orgId = await myOrgId();

      const [orgSnap, annSnap, evSnap] = await Promise.all([
        getDocs(collection(db, "orgs")),
        getDocs(
          query(
            collection(db, "announcements"),
            where("status", "in", ["published", "scheduled"]),
          ),
        ),
        getDocs(
          query(collection(db, "events"), where("status", "==", "published")),
        ),
      ]);

      const anns = new Map<string, Announcement>();
      const evs = new Map<string, EventItem>();
      annSnap.docs.forEach((d) => anns.set(d.id, withId<Announcement>(d)));
      evSnap.docs.forEach((d) => evs.set(d.id, withId<EventItem>(d)));

      if (orgId) {
        const [myAnn, myEv] = await Promise.all([
          getDocs(
            query(collection(db, "announcements"), where("orgId", "==", orgId)),
          ),
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

  async signIn(email: string, password: string): Promise<Officer> {
    try {
      const cred = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );
      const s = await getDoc(doc(db, "officers", cred.user.uid));
      if (!s.exists()) {
        await fbSignOut(auth);
        throw new Error("not-officer");
      }
      return { email: cred.user.email ?? email.trim(), orgId: s.data().orgId };
    } catch (e: any) {
      console.log("LOGIN ERROR:", e?.code, e?.message);
      if (e?.code === "auth/network-request-failed")
        throw new Error("No connection. Try again.");
      throw new Error("Incorrect email or password"); // never say which part was wrong
    }
  },

  async signOut() {
    await fbSignOut(auth);
  },

  async saveAnnouncement(a: Announcement) {
    await guard(async () => {
      const ref = a.id
        ? doc(db, "announcements", a.id)
        : doc(collection(db, "announcements"));
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
            .map((d) => updateDoc(d.ref, { pinned: false })),
        );
      }
      await setDoc(ref, clean({ ...a, id: ref.id }));
    });
  },
  deleteAnnouncement: (id: string) =>
    guard(() => deleteDoc(doc(db, "announcements", id))),

  async saveEvent(e: EventItem) {
    await guard(async () => {
      const ref = e.id
        ? doc(db, "events", e.id)
        : doc(collection(db, "events"));
      await setDoc(ref, clean({ ...e, id: ref.id }));
    });
  },
  deleteEvent: (id: string) => guard(() => deleteDoc(doc(db, "events", id))),
};
