// Firestore security rules tests for SagaySync.
// Runs against the local emulator only — never touches the real "sagaysync" project.
// Start with: run-rules-tests.bat   (or: npx firebase-tools emulators:exec --only firestore "node --test")
import { test, before, after, beforeEach } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import {
  doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, deleteField, collection, query, where, orderBy,
  serverTimestamp, Timestamp, writeBatch,
} from 'firebase/firestore';

const RULES = fileURLToPath(new URL('../firestore.rules', import.meta.url));
const HOUR = 3600_000;
const past = () => Timestamp.fromMillis(Date.now() - HOUR);
const future = () => Timestamp.fromMillis(Date.now() + 24 * HOUR);
const TOKEN = 'ExponentPushToken[abc123_XYZ-def]';

let env;
const guest = () => env.unauthenticatedContext().firestore();
const sslg = () => env.authenticatedContext('off-sslg').firestore(); // officer of sslg
const spc = () => env.authenticatedContext('off-spc').firestore(); // officer of spc
const stranger = () => env.authenticatedContext('not-an-officer').firestore();
const admin = () => env.authenticatedContext('adm-1').firestore(); // school admin
const offOff = () => env.authenticatedContext('off-off').firestore(); // sslg officer an admin switched off

const ann = (over = {}) => ({
  id: 'x', orgId: 'sslg', title: 'Title', body: 'Body', category: 'Announcement',
  pinned: false, status: 'published', createdAt: new Date().toISOString(), ...over,
});
const org = (over = {}) => ({
  name: 'SSLG', fullName: 'Supreme Secondary Learner Government', description: 'Student government.',
  adviser: 'TBA', president: 'TBA', office: 'TBA', facebook: 'https://facebook.com/', ...over,
});
const ev = (over = {}) => ({
  id: 'e', orgId: 'sslg', title: 'Event', date: '2026-12-01', start: '08:00', end: '10:00',
  venue: 'Gym', audience: 'All students', body: '', status: 'published', tag: 'none',
  createdAt: new Date().toISOString(), ...over,
});

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-sagaysync', // "demo-" prefix: the emulator refuses to reach any real project
    firestore: { rules: readFileSync(RULES, 'utf8') },
  });
});
after(() => env?.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'officers/off-sslg'), { email: 'a@x.test', orgId: 'sslg' });
    await setDoc(doc(db, 'officers/off-spc'), { email: 'b@x.test', orgId: 'spc' });
    await setDoc(doc(db, 'officers/off-off'), { email: 'c@x.test', orgId: 'sslg', active: false });
    await setDoc(doc(db, 'admins/adm-1'), { email: 'admin@x.test' });
    await setDoc(doc(db, 'orgs/sslg'), org());
    await setDoc(doc(db, 'orgs/spc'), org({ name: 'SPC' }));
    await setDoc(doc(db, 'announcements/pub'), ann({ id: 'pub' }));
    await setDoc(doc(db, 'announcements/pinned'), ann({ id: 'pinned', pinned: true }));
    await setDoc(doc(db, 'announcements/schedPast'), ann({ id: 'schedPast', status: 'scheduled', publishAt: past() }));
    await setDoc(doc(db, 'announcements/schedFuture'), ann({ id: 'schedFuture', status: 'scheduled', publishAt: future() }));
    await setDoc(doc(db, 'announcements/draft'), ann({ id: 'draft', status: 'draft' }));
    await setDoc(doc(db, 'events/pubEv'), ev({ id: 'pubEv' }));
    await setDoc(doc(db, 'events/draftEv'), ev({ id: 'draftEv', status: 'draft' }));
    await setDoc(doc(db, `devices/${TOKEN}`), { token: TOKEN, follows: ['sslg'], enabled: true, updatedAt: Timestamp.now() });
  });
});

/* ---------- Fix 1: scheduled posts stay hidden until their time ---------- */

test('guest reads a published post', () => assertSucceeds(getDoc(doc(guest(), 'announcements/pub'))));
test('guest reads a scheduled post whose time has passed', () => assertSucceeds(getDoc(doc(guest(), 'announcements/schedPast'))));
test('guest CANNOT read a scheduled post before its time', () => assertFails(getDoc(doc(guest(), 'announcements/schedFuture'))));
test('guest CANNOT read a draft', () => assertFails(getDoc(doc(guest(), 'announcements/draft'))));
test('guest CANNOT list all scheduled posts', () =>
  assertFails(getDocs(query(collection(guest(), 'announcements'), where('status', '==', 'scheduled')))));
test("guest query used by the app (scheduled AND publishAt <= now) is allowed", () =>
  assertSucceeds(getDocs(query(
    collection(guest(), 'announcements'),
    where('status', '==', 'scheduled'),
    where('publishAt', '<=', Timestamp.fromMillis(Date.now() - 2 * 60_000)),
    orderBy('publishAt', 'desc'),
  ))));
test('guest query for published posts is allowed', () =>
  assertSucceeds(getDocs(query(collection(guest(), 'announcements'), where('status', '==', 'published')))));
test('officer reads own group\'s future scheduled post', () => assertSucceeds(getDoc(doc(sslg(), 'announcements/schedFuture'))));
test('officer reads own group\'s draft', () => assertSucceeds(getDoc(doc(sslg(), 'announcements/draft'))));
test('officer CANNOT read another group\'s draft', () => assertFails(getDoc(doc(spc(), 'announcements/draft'))));
test('officer lists all of own group\'s posts (app query)', () =>
  assertSucceeds(getDocs(query(collection(sslg(), 'announcements'), where('orgId', '==', 'sslg')))));

/* ---------- Fix 4: announcement shape checks ---------- */

test('officer posts a valid announcement', () => assertSucceeds(setDoc(doc(sslg(), 'announcements/n1'), ann({ id: 'n1' }))));
test('officer schedules a post with a Timestamp publishAt', () =>
  assertSucceeds(setDoc(doc(sslg(), 'announcements/n2'), ann({ id: 'n2', status: 'scheduled', publishAt: future() }))));
test('officer saves a draft', () => assertSucceeds(setDoc(doc(sslg(), 'announcements/n3'), ann({ id: 'n3', status: 'draft' }))));
test('REJECT scheduled post with string publishAt', () =>
  assertFails(setDoc(doc(sslg(), 'announcements/n4'), ann({ status: 'scheduled', publishAt: new Date().toISOString() }))));
test('REJECT scheduled post without publishAt', () =>
  assertFails(setDoc(doc(sslg(), 'announcements/n5'), ann({ status: 'scheduled' }))));
test('REJECT published post that carries publishAt (feed-pinning trick)', () =>
  assertFails(setDoc(doc(sslg(), 'announcements/n6'), ann({ publishAt: Timestamp.fromDate(new Date('2099-01-01')) }))));
test('REJECT unknown field', () => assertFails(setDoc(doc(sslg(), 'announcements/n7'), ann({ hacked: true }))));
test('REJECT body over 5000 chars', () => assertFails(setDoc(doc(sslg(), 'announcements/n8'), ann({ body: 'a'.repeat(5001) }))));
test('REJECT title over 150 chars', () => assertFails(setDoc(doc(sslg(), 'announcements/n9'), ann({ title: 'a'.repeat(151) }))));
test('REJECT unknown status', () => assertFails(setDoc(doc(sslg(), 'announcements/n10'), ann({ status: 'live' }))));
test('REJECT unknown category', () => assertFails(setDoc(doc(sslg(), 'announcements/n11'), ann({ category: 'Spam' }))));
test('REJECT pinned as a string', () => assertFails(setDoc(doc(sslg(), 'announcements/n12'), ann({ pinned: 'yes' }))));
test('REJECT posting for another group', () => assertFails(setDoc(doc(spc(), 'announcements/n13'), ann())));
test('REJECT guest posting', () => assertFails(setDoc(doc(guest(), 'announcements/n14'), ann())));
test('REJECT signed-in non-officer posting', () => assertFails(setDoc(doc(stranger(), 'announcements/n15'), ann())));
test('officer un-pins an older post (app unpin patch)', () =>
  assertSucceeds(updateDoc(doc(sslg(), 'announcements/pinned'), { pinned: false, publishAt: deleteField() })));
test('REJECT moving a post to another group', () =>
  assertFails(updateDoc(doc(sslg(), 'announcements/pub'), { orgId: 'spc' })));
test('officer deletes own post', () => assertSucceeds(deleteDoc(doc(sslg(), 'announcements/pub'))));
test('REJECT deleting another group\'s post', () => assertFails(deleteDoc(doc(spc(), 'announcements/pub'))));

/* ---------- Fix 4: event shape checks ---------- */

test('guest reads a published event', () => assertSucceeds(getDoc(doc(guest(), 'events/pubEv'))));
test('guest CANNOT read a draft event', () => assertFails(getDoc(doc(guest(), 'events/draftEv'))));
test('officer creates a valid event', () => assertSucceeds(setDoc(doc(sslg(), 'events/e1'), ev({ id: 'e1' }))));
test('officer creates an event without end time', () => {
  const { end, ...noEnd } = ev({ id: 'e2' });
  return assertSucceeds(setDoc(doc(sslg(), 'events/e2'), noEnd));
});
test('officer creates an event linked to an announcement', () =>
  assertSucceeds(setDoc(doc(sslg(), 'events/e3'), ev({ id: 'e3', announcementId: 'a_123' }))));
test('REJECT bad date format', () => assertFails(setDoc(doc(sslg(), 'events/e4'), ev({ date: 'Dec 1' }))));
test('REJECT bad start time', () => assertFails(setDoc(doc(sslg(), 'events/e5'), ev({ start: '8am' }))));
test('REJECT unknown tag', () => assertFails(setDoc(doc(sslg(), 'events/e6'), ev({ tag: 'moved' }))));
test('REJECT unknown audience', () => assertFails(setDoc(doc(sslg(), 'events/e7'), ev({ audience: 'Teachers' }))));
test('REJECT empty event title', () => assertFails(setDoc(doc(sslg(), 'events/e8'), ev({ title: '' }))));
test('REJECT unknown event field', () => assertFails(setDoc(doc(sslg(), 'events/e9'), ev({ extra: 1 }))));
test('officer cancels own event (tag update)', () =>
  assertSucceeds(updateDoc(doc(sslg(), 'events/pubEv'), { tag: 'cancelled' })));

/* ---------- Fix 2: device registry ---------- */

const device = (token, follows = ['sslg']) => ({ token, follows, enabled: true, updatedAt: serverTimestamp() });
const NEW_TOKEN = 'ExponentPushToken[newPhone_01]';
test('guest registers a real-looking token', () => assertSucceeds(setDoc(doc(guest(), `devices/${NEW_TOKEN}`), device(NEW_TOKEN))));
test('guest follows several real groups', () =>
  assertSucceeds(setDoc(doc(guest(), `devices/${NEW_TOKEN}`), device(NEW_TOKEN, ['sslg', 'spc', 'the-shell', 'ang-sigay']))));
test('guest follows nothing', () => assertSucceeds(setDoc(doc(guest(), `devices/${NEW_TOKEN}`), device(NEW_TOKEN, []))));
test('REJECT junk doc id (flood attempt)', () => assertFails(setDoc(doc(guest(), 'devices/spam-0001'), device('spam-0001'))));
test('REJECT token field not matching doc id', () => assertFails(setDoc(doc(guest(), `devices/${NEW_TOKEN}`), device(TOKEN))));
test('REJECT following a group that does not exist', () =>
  assertFails(setDoc(doc(guest(), `devices/${NEW_TOKEN}`), device(NEW_TOKEN, ['sslg', 'fake-group']))));
test('REJECT old mock group id "angsigay"', () =>
  assertFails(setDoc(doc(guest(), `devices/${NEW_TOKEN}`), device(NEW_TOKEN, ['angsigay']))));
test('REJECT client-chosen updatedAt', () =>
  assertFails(setDoc(doc(guest(), `devices/${NEW_TOKEN}`), { ...device(NEW_TOKEN), updatedAt: Timestamp.now() })));
test('REJECT extra device field', () =>
  assertFails(setDoc(doc(guest(), `devices/${NEW_TOKEN}`), { ...device(NEW_TOKEN), name: 'x' })));
test('guest CANNOT read the device list', () => assertFails(getDoc(doc(guest(), `devices/${TOKEN}`))));
test('officer reads tokens following their group (app query)', () =>
  assertSucceeds(getDocs(query(collection(sslg(), 'devices'), where('follows', 'array-contains', 'sslg')))));

/* ---------- Unchanged areas, checked so nothing regressed ---------- */

test('guest sends valid feedback', () =>
  assertSucceeds(setDoc(doc(guest(), 'feedback/f1'), { rating: 5, comment: 'nice', createdAt: serverTimestamp() })));
test('REJECT feedback rating 6', () =>
  assertFails(setDoc(doc(guest(), 'feedback/f2'), { rating: 6, comment: '', createdAt: serverTimestamp() })));
test('guest CANNOT read feedback', () => assertFails(getDoc(doc(guest(), 'feedback/f1'))));
test('guest reads groups', () => assertSucceeds(getDocs(collection(guest(), 'orgs'))));
test('REJECT officer editing groups', () => assertFails(setDoc(doc(sslg(), 'orgs/sslg'), { name: 'x' })));
test('officer reads own officers doc (login check)', () => assertSucceeds(getDoc(doc(sslg(), 'officers/off-sslg'))));
test('officer CANNOT read another officer doc', () => assertFails(getDoc(doc(sslg(), 'officers/off-spc'))));
test('REJECT officer promoting themself', () => assertFails(setDoc(doc(sslg(), 'officers/off-sslg'), { orgId: 'spc' })));

/* ---------- Admin role ---------- */

// Role check at login
test('admin reads own admins doc (login check)', () => assertSucceeds(getDoc(doc(admin(), 'admins/adm-1'))));
test('officer checks own (missing) admins doc at login', () => assertSucceeds(getDoc(doc(sslg(), 'admins/off-sslg'))));
test('REJECT reading someone else\'s admins doc', () => assertFails(getDoc(doc(sslg(), 'admins/adm-1'))));
test('REJECT anyone creating an admin, even an admin', () => assertFails(setDoc(doc(admin(), 'admins/new-admin'), { email: 'x@x.test' })));
test('REJECT officer making themself admin', () => assertFails(setDoc(doc(sslg(), 'admins/off-sslg'), { email: 'a@x.test' })));

// Posts across every group
test('admin reads another group\'s draft', () => assertSucceeds(getDoc(doc(admin(), 'announcements/draft'))));
test('admin reads a future scheduled post', () => assertSucceeds(getDoc(doc(admin(), 'announcements/schedFuture'))));
test('admin lists every announcement (app query)', () => assertSucceeds(getDocs(collection(admin(), 'announcements'))));
test('admin lists every event (app query)', () => assertSucceeds(getDocs(collection(admin(), 'events'))));
test('admin posts for any group', () => assertSucceeds(setDoc(doc(admin(), 'announcements/ad1'), ann({ id: 'ad1', orgId: 'spc' }))));
test('admin pins another group\'s post', () => assertSucceeds(updateDoc(doc(admin(), 'announcements/pub'), { pinned: true })));
test('admin unpublishes another group\'s post', () =>
  assertSucceeds(updateDoc(doc(admin(), 'announcements/pub'), { status: 'draft', pinned: false })));
test('admin deletes another group\'s post', () => assertSucceeds(deleteDoc(doc(admin(), 'announcements/pub'))));
test('admin creates an event for any group', () => assertSucceeds(setDoc(doc(admin(), 'events/ad2'), ev({ id: 'ad2', orgId: 'spc' }))));
test('admin deletes another group\'s event', () => assertSucceeds(deleteDoc(doc(admin(), 'events/pubEv'))));
test('REJECT admin post with a bad shape (checks still apply)', () =>
  assertFails(setDoc(doc(admin(), 'announcements/ad3'), ann({ status: 'live' }))));
test('REJECT stranger listing every announcement', () => assertFails(getDocs(collection(stranger(), 'announcements'))));

// Groups: add and edit
test('admin creates a group', () => assertSucceeds(setDoc(doc(admin(), 'orgs/math-club'), org({ name: 'Math Club' }))));
test('admin edits a group', () => assertSucceeds(setDoc(doc(admin(), 'orgs/sslg'), org({ president: 'Juan Dela Cruz' }))));
test('REJECT group id with capitals or spaces', () => assertFails(setDoc(doc(admin(), 'orgs/Math Club'), org())));
test('REJECT group with an unknown field', () => assertFails(setDoc(doc(admin(), 'orgs/math-club'), org({ color: 'red' }))));
test('REJECT group with an empty name', () => assertFails(setDoc(doc(admin(), 'orgs/math-club'), org({ name: '' }))));
test('REJECT officer creating a group', () => assertFails(setDoc(doc(sslg(), 'orgs/math-club'), org())));
test('admin updates the followable group list', () =>
  assertSucceeds(setDoc(doc(admin(), 'meta/groups'), { ids: ['sslg', 'ang-sigay', 'the-shell', 'spc', 'math-club'] })));
test('REJECT officer changing the followable group list', () =>
  assertFails(setDoc(doc(sslg(), 'meta/groups'), { ids: ['sslg', 'fake'] })));
test('guest can follow a group once it is in meta/groups', async () => {
  await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'meta/groups'), { ids: ['sslg', 'math-club'] }));
  await assertSucceeds(setDoc(doc(guest(), `devices/${NEW_TOKEN}`), device(NEW_TOKEN, ['math-club'])));
});
test('REJECT following a group missing from meta/groups', async () => {
  await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'meta/groups'), { ids: ['sslg', 'math-club'] }));
  await assertFails(setDoc(doc(guest(), `devices/${NEW_TOKEN}`), device(NEW_TOKEN, ['spc'])));
});

// Groups: remove
test('admin deletes a group', () => assertSucceeds(deleteDoc(doc(admin(), 'orgs/sslg'))));
test('REJECT officer deleting a group', () => assertFails(deleteDoc(doc(sslg(), 'orgs/sslg'))));
test('REJECT guest deleting a group', () => assertFails(deleteDoc(doc(guest(), 'orgs/sslg'))));
test('admin finds a group\'s officers before removing it (app query)', () =>
  assertSucceeds(getDocs(query(collection(admin(), 'officers'), where('orgId', '==', 'sslg')))));
test('admin removes a group with its posts, events and officers in one batch (app flow)', async () => {
  const db = admin();
  const b = writeBatch(db);
  b.delete(doc(db, 'announcements/pub'));
  b.delete(doc(db, 'announcements/draft'));
  b.delete(doc(db, 'events/pubEv'));
  b.delete(doc(db, 'officers/off-sslg'));
  b.delete(doc(db, 'orgs/sslg'));
  b.set(doc(db, 'meta/groups'), { ids: ['ang-sigay', 'the-shell', 'spc'] });
  await assertSucceeds(b.commit());
});
test('REJECT following a group after it was removed', async () => {
  await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'meta/groups'), { ids: ['ang-sigay', 'the-shell', 'spc'] }));
  await assertFails(setDoc(doc(guest(), `devices/${NEW_TOKEN}`), device(NEW_TOKEN, ['sslg'])));
});
test('device that drops a removed group can save its follows again', async () => {
  await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'meta/groups'), { ids: ['ang-sigay', 'the-shell', 'spc'] }));
  await assertSucceeds(setDoc(doc(guest(), `devices/${NEW_TOKEN}`), device(NEW_TOKEN, ['spc'])));
});

// Officer accounts
test('admin lists officers', () => assertSucceeds(getDocs(collection(admin(), 'officers'))));
test('REJECT officer listing officers', () => assertFails(getDocs(collection(sslg(), 'officers'))));
test('admin adds an officer to a real group', () =>
  assertSucceeds(setDoc(doc(admin(), 'officers/new-off'), { email: 'n@x.test', orgId: 'spc', active: true, addedBy: 'adm-1' })));
test('REJECT officer tied to a group that does not exist (mistyped orgId)', () =>
  assertFails(setDoc(doc(admin(), 'officers/new-off'), { email: 'n@x.test', orgId: 'SSLG', active: true })));
test('REJECT officer record with an unknown field', () =>
  assertFails(setDoc(doc(admin(), 'officers/new-off'), { email: 'n@x.test', orgId: 'spc', role: 'admin' })));
test('admin moves an officer to another group', () => assertSucceeds(updateDoc(doc(admin(), 'officers/off-sslg'), { orgId: 'spc' })));
test('admin switches an officer off', () => assertSucceeds(updateDoc(doc(admin(), 'officers/off-sslg'), { active: false })));
test('admin removes an officer record', () => assertSucceeds(deleteDoc(doc(admin(), 'officers/off-sslg'))));
test('switched-off officer can still read own record (so the app can sign them out)', () =>
  assertSucceeds(getDoc(doc(offOff(), 'officers/off-off'))));
test('REJECT switched-off officer posting', () => assertFails(setDoc(doc(offOff(), 'announcements/o1'), ann({ id: 'o1' }))));
test('REJECT switched-off officer reading own group\'s draft', () => assertFails(getDoc(doc(offOff(), 'announcements/draft'))));
test('REJECT switched-off officer deleting a post', () => assertFails(deleteDoc(doc(offOff(), 'announcements/pub'))));
test('REJECT switched-off officer turning themself back on', () =>
  assertFails(updateDoc(doc(offOff(), 'officers/off-off'), { active: true })));

// Push
test('admin reads device tokens to notify followers', () =>
  assertSucceeds(getDocs(query(collection(admin(), 'devices'), where('follows', 'array-contains', 'sslg')))));
