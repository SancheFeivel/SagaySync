// Officer-only: login + writes. Uses YOUR types.ts shapes.
import {
  signInWithEmailAndPassword, signOut, onAuthStateChanged,
  sendPasswordResetEmail, type User,
} from "firebase/auth";
import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, orderBy,
  query, updateDoc, where,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import type { Announcement, EventItem, EventTag, Officer } from "./types";

/* ---------- Auth ---------- */
export async function officerLogin(email: string, password: string): Promise<Officer> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    const s = await getDoc(doc(db, "officers", cred.user.uid));
    if (!s.exists()) { await signOut(auth); throw new Error("not-officer"); }
    return { email: cred.user.email!, orgId: s.data().orgId };
  } catch {
    throw new Error("Incorrect email or password"); // never say which part was wrong
  }
}
export const officerLogout = () => signOut(auth);
export const forgotPassword = (email: string) => sendPasswordResetEmail(auth, email.trim());
export const onUser = (cb: (u: User | null) => void) => onAuthStateChanged(auth, cb);

export async function getMyOrgId(): Promise<string | null> {
  const u = auth.currentUser;
  if (!u) return null;
  const s = await getDoc(doc(db, "officers", u.uid));
  return s.exists() ? (s.data().orgId as string) : null;
}

/* ---------- Announcements ---------- */
export type NewAnnouncement = Omit<Announcement, "id" | "createdAt">;

export async function createAnnouncement(a: NewAnnouncement) {
  const now = new Date().toISOString();
  // Always set publishAt so the student feed query can sort/filter on it.
  const publishAt = a.status === "scheduled" ? (a.publishAt ?? now) : (a.publishAt ?? now);
  if (a.pinned && a.status !== "draft") await unpinOthers(a.orgId);
  const data: Record<string, unknown> = { ...a, publishAt, createdAt: now };
  Object.keys(data).forEach(k => data[k] === undefined && delete data[k]); // Firestore rejects undefined
  return addDoc(collection(db, "announcements"), data);
}

/** One pinned post per group: pinning a new one replaces the old. */
async function unpinOthers(orgId: string) {
  const snap = await getDocs(query(
    collection(db, "announcements"),
    where("orgId", "==", orgId), where("pinned", "==", true)));
  await Promise.all(snap.docs.map(d => updateDoc(d.ref, { pinned: false })));
}

export const updateAnnouncement = (id: string, patch: Partial<Announcement>) =>
  updateDoc(doc(db, "announcements", id), patch as any);
export const unpublishAnnouncement = (id: string) =>
  updateDoc(doc(db, "announcements", id), { status: "draft", pinned: false });
export const deleteAnnouncement = (id: string) => deleteDoc(doc(db, "announcements", id));

/** Officer Home "Your posts" (includes drafts and scheduled). */
export async function getMyAnnouncements(orgId: string): Promise<Announcement[]> {
  const snap = await getDocs(query(
    collection(db, "announcements"),
    where("orgId", "==", orgId), orderBy("publishAt", "desc")));
  return snap.docs.map(d => ({ ...d.data(), id: d.id } as Announcement));
}

/* ---------- Events ---------- */
export type NewEvent = Omit<EventItem, "id" | "createdAt" | "announcementId">;

export async function createEvent(e: NewEvent, alsoAnnounce = false) {
  const now = new Date().toISOString();
  const data: Record<string, unknown> = { ...e, createdAt: now };
  Object.keys(data).forEach(k => data[k] === undefined && delete data[k]);
  const ref = await addDoc(collection(db, "events"), data);
  if (alsoAnnounce && e.status === "published") {
    const ann = await createAnnouncement({
      orgId: e.orgId, title: e.title, body: e.body,
      category: "Announcement", pinned: false, status: "published", eventId: ref.id,
    });
    await updateDoc(ref, { announcementId: ann.id });
  }
  return ref;
}

export const updateEvent = (id: string, patch: Partial<EventItem>) =>
  updateDoc(doc(db, "events", id), patch as any);
export const setEventTag = (id: string, tag: EventTag) =>
  updateDoc(doc(db, "events", id), { tag });
export const deleteEvent = (id: string) => deleteDoc(doc(db, "events", id));
