// Student-facing reads (no login). Uses YOUR types.ts shapes.
// Dates are ISO strings / YYYY-MM-DD, which sort correctly as plain strings in Firestore.
import {
  collection, doc, getDoc, getDocs, query, where, orderBy, limit,
  startAfter, QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Announcement, EventItem, Org } from "./types";

const withId = <T,>(d: QueryDocumentSnapshot) => ({ ...d.data(), id: d.id } as T);
const todayStr = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const LIVE = ["published", "scheduled"]; // a scheduled post goes live once publishAt has passed

/** "scheduled" in the DB becomes "published" for display once its time has passed. */
export const effectiveStatus = (a: Announcement) =>
  a.status === "scheduled" && a.publishAt && a.publishAt > new Date().toISOString()
    ? "scheduled" : a.status === "draft" ? "draft" : "published";

/* ---------- Organizations ---------- */
export async function getOrgs(): Promise<Org[]> {
  const snap = await getDocs(query(collection(db, "orgs"), orderBy("name")));
  return snap.docs.map(d => withId<Org>(d));
}
export async function getOrg(id: string): Promise<Org | null> {
  const s = await getDoc(doc(db, "orgs", id));
  return s.exists() ? ({ ...s.data(), id: s.id } as Org) : null;
}

/* ---------- Announcements ---------- */
const PAGE = 15;

export async function getFeed(opts: { orgIds?: string[]; after?: QueryDocumentSnapshot } = {}) {
  const c: any[] = [
    where("status", "in", LIVE),
    where("publishAt", "<=", new Date().toISOString()),
    orderBy("publishAt", "desc"),
    limit(PAGE),
  ];
  if (opts.orgIds?.length) c.unshift(where("orgId", "in", opts.orgIds.slice(0, 30)));
  if (opts.after) c.push(startAfter(opts.after));
  const snap = await getDocs(query(collection(db, "announcements"), ...c));
  return {
    items: snap.docs.map(d => withId<Announcement>(d)),
    last: snap.docs[snap.docs.length - 1] as QueryDocumentSnapshot | undefined,
    done: snap.docs.length < PAGE, // true -> "You're all caught up."
  };
}

/** Most urgent pinned post for Home's navy card; null = hide the card. */
export async function getPinned(): Promise<Announcement | null> {
  const snap = await getDocs(query(
    collection(db, "announcements"),
    where("status", "in", LIVE),
    where("pinned", "==", true),
    where("publishAt", "<=", new Date().toISOString()),
    orderBy("publishAt", "desc"),
    limit(1),
  ));
  return snap.empty ? null : withId<Announcement>(snap.docs[0]);
}

export async function getAnnouncement(id: string): Promise<Announcement | null> {
  const s = await getDoc(doc(db, "announcements", id));
  return s.exists() ? ({ ...s.data(), id: s.id } as Announcement) : null;
}

export async function getOrgPosts(orgId: string): Promise<Announcement[]> {
  const snap = await getDocs(query(
    collection(db, "announcements"),
    where("orgId", "==", orgId),
    where("status", "in", LIVE),
    where("publishAt", "<=", new Date().toISOString()),
    orderBy("publishAt", "desc"),
    limit(30),
  ));
  return snap.docs.map(d => withId<Announcement>(d)); // put pinned first in the UI
}

/* ---------- Events ---------- */
export async function getUpcomingEvents(max = 10): Promise<EventItem[]> {
  const snap = await getDocs(query(
    collection(db, "events"),
    where("status", "==", "published"),
    where("date", ">=", todayStr()),
    orderBy("date", "asc"),
    limit(max),
  ));
  return snap.docs.map(d => withId<EventItem>(d)); // cancelled/postponed stay, with their tag
}

/** month is 0-11. Sorted by date then start time. */
export async function getEventsInMonth(year: number, month: number): Promise<EventItem[]> {
  const p = (n: number) => String(n).padStart(2, "0");
  const start = `${year}-${p(month + 1)}-01`;
  const next = month === 11 ? `${year + 1}-01-01` : `${year}-${p(month + 2)}-01`;
  const snap = await getDocs(query(
    collection(db, "events"),
    where("status", "==", "published"),
    where("date", ">=", start),
    where("date", "<", next),
    orderBy("date", "asc"),
  ));
  return snap.docs.map(d => withId<EventItem>(d))
    .sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start));
}

export async function getEvent(id: string): Promise<EventItem | null> {
  const s = await getDoc(doc(db, "events", id));
  return s.exists() ? ({ ...s.data(), id: s.id } as EventItem) : null;
}

export async function getOrgEvents(orgId: string): Promise<EventItem[]> {
  const snap = await getDocs(query(
    collection(db, "events"),
    where("orgId", "==", orgId),
    where("status", "==", "published"),
    orderBy("date", "asc"),
  ));
  return snap.docs.map(d => withId<EventItem>(d));
}
