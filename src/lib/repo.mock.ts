/**
 * Data layer. Everything the screens need goes through here.
 * Right now it is an in-memory fake so the UI runs without a backend.
 * To go live: re-implement these functions with Firebase (Firestore + Auth)
 * and keep the same signatures. No screen needs to change.
 */
import { Announcement, Data, EventItem, Officer } from './types';
import { seedData } from './mock';

/** Flip `offline` to true while testing to see the cached / "No connection" states. */
export const sim = { offline: false, fail: false, delayMs: 150 };
export class OfflineError extends Error {}

let db: Data = seedData();
const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));

async function gate() {
  await new Promise<void>((r) => setTimeout(r, sim.delayMs));
  if (sim.offline) throw new OfflineError('offline');
  if (sim.fail) throw new Error('boom');
}
const upsert = <T extends { id: string }>(list: T[], item: T) =>
  list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [item, ...list];

// Officer accounts are created by an admin only. No self sign-up.
const ACCOUNTS = [
  { email: 'sslg@sagaysync.test', password: 'sagaysync', orgId: 'sslg' },
  { email: 'angsigay@sagaysync.test', password: 'sagaysync', orgId: 'angsigay' },
  { email: 'theshell@sagaysync.test', password: 'sagaysync', orgId: 'theshell' },
  { email: 'spc@sagaysync.test', password: 'sagaysync', orgId: 'spc' },
];

export const repo = {
  async fetchAll(): Promise<Data> {
    await gate();
    return clone(db);
  },
  async saveAnnouncement(a: Announcement) {
    await gate();
    // one pinned post per group: pinning replaces the current one
    if (a.pinned && a.status !== 'draft') {
      db.announcements = db.announcements.map((x) => (x.orgId === a.orgId && x.id !== a.id ? { ...x, pinned: false } : x));
    }
    db.announcements = upsert(db.announcements, a);
  },
  async deleteAnnouncement(id: string) {
    await gate();
    db.announcements = db.announcements.filter((x) => x.id !== id);
  },
  async saveEvent(e: EventItem) {
    await gate();
    db.events = upsert(db.events, e);
  },
  async deleteEvent(id: string) {
    await gate();
    db.events = db.events.filter((x) => x.id !== id);
  },
  async signIn(email: string, password: string): Promise<Officer> {
    await gate();
    const acc = ACCOUNTS.find((a) => a.email === email.trim().toLowerCase() && a.password === password);
    if (!acc) throw new Error('invalid-credentials');
    return { email: acc.email, orgId: acc.orgId };
  },
  async sendReset(_email: string) {
    await gate();
  },
  async sendFeedback(rating: number, comment: string) {
    await gate();
    console.log('feedback', { rating, comment, at: new Date().toISOString() });
  },
};
