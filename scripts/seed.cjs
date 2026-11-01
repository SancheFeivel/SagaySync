// One-time seeding with the Admin SDK (bypasses security rules).
// Usage: node scripts/seed.cjs   (needs serviceAccountKey.json in the project root)
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const path = require("path");

initializeApp({
  credential: cert(require(path.join(__dirname, "..", "serviceAccountKey.json"))),
});
const db = getFirestore();

const pad = (n) => String(n).padStart(2, "0");
const dayStr = (offset) => {
  const d = new Date(); d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const iso = (hoursAgo) => new Date(Date.now() - hoursAgo * 3600e3).toISOString();

const orgs = {
  sslg: { name: "SSLG", fullName: "Supreme Secondary Learner Government",
    description: "The student government of Sagay National High School.",
    adviser: "TBA", president: "TBA", office: "TBA", facebook: "https://facebook.com/" },
  "ang-sigay": { name: "Ang Sigay", fullName: "Ang Sigay (Filipino Publication)",
    description: "The Filipino-language school publication.",
    adviser: "TBA", president: "TBA", office: "TBA", facebook: "https://facebook.com/" },
  "the-shell": { name: "The Shell", fullName: "The Shell (English Publication)",
    description: "The English-language school publication.",
    adviser: "TBA", president: "TBA", office: "TBA", facebook: "https://facebook.com/" },
  spc: { name: "SPC", fullName: "Special Program Committee",
    description: "Coordinates the school's special curricular programs.",
    adviser: "TBA", president: "TBA", office: "TBA", facebook: "https://facebook.com/" },
};

const announcements = [
  { orgId: "sslg", title: "Class suspension: Monday", body: "Classes are suspended on Monday. Watch for further updates.",
    category: "Announcement", pinned: true, status: "published", createdAt: iso(2), publishAt: iso(2) },
  { orgId: "sslg", title: "Reminder: Bring your ID", body: "Students must wear their school ID inside the campus.",
    category: "Reminder", pinned: false, status: "published", createdAt: iso(20), publishAt: iso(20) },
  { orgId: "ang-sigay", title: "Deadline: Feature article submissions", body: "Send your entries to the publication office before Friday.",
    category: "Deadline", pinned: false, status: "published", createdAt: iso(30), publishAt: iso(30) },
  { orgId: "the-shell", title: "New issue is out", body: "The latest issue of The Shell is now available.",
    category: "Announcement", pinned: false, status: "published", createdAt: iso(50), publishAt: iso(50) },
  { orgId: "spc", title: "Program orientation", body: "All SPC students are invited to the orientation.",
    category: "Announcement", pinned: false, status: "published", createdAt: iso(70), publishAt: iso(70) },
];

const events = [
  { orgId: "sslg", title: "Intramurals opening", date: dayStr(3), start: "08:00", end: "11:00",
    venue: "School grounds", audience: "All students", body: "Opening program and parade of teams.",
    status: "published", tag: "none", createdAt: iso(10) },
  { orgId: "the-shell", title: "Campus journalism workshop", date: dayStr(6), start: "13:00", end: "16:00",
    venue: "AVR", audience: "All students", body: "Writing and layout basics.",
    status: "published", tag: "none", createdAt: iso(12) },
  { orgId: "spc", title: "Science fair", date: dayStr(9), start: "09:00",
    venue: "Gymnasium", audience: "All students", body: "Project exhibits and judging.",
    status: "published", tag: "postponed", createdAt: iso(14) },
  { orgId: "ang-sigay", title: "Buwan ng Wika program", date: dayStr(12), start: "10:00", end: "12:00",
    venue: "Covered court", audience: "All students", body: "Cultural presentations.",
    status: "published", tag: "none", createdAt: iso(16) },
];

(async () => {
  const batch = db.batch();
  for (const [id, o] of Object.entries(orgs)) batch.set(db.collection("orgs").doc(id), o);
  for (const a of announcements) batch.set(db.collection("announcements").doc(), a);
  for (const e of events) batch.set(db.collection("events").doc(), e);
  await batch.commit();
  console.log(`Seeded ${Object.keys(orgs).length} orgs, ${announcements.length} announcements, ${events.length} events.`);
})().catch((e) => { console.error(e); process.exit(1); });
