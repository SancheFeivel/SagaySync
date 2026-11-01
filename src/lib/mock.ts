import { Data } from './types';
import { addDays, toDateStr } from './date';

/** Demo data, always relative to today so the app never looks stale. */
export function seedData(): Data {
  const now = Date.now();
  const ago = (h: number) => new Date(now - h * 3600_000).toISOString();
  const day = (n: number) => toDateStr(addDays(new Date(), n));
  const base = { venue: '', audience: 'All students' as const, body: '', status: 'published' as const, tag: 'none' as const };

  const fillers = Array.from({ length: 8 }, (_, i) => ({
    id: `f${i + 1}`,
    orgId: ['sslg', 'angsigay', 'theshell', 'spc'][i % 4],
    title: `Reminder #${i + 1}: check your class bulletin`,
    body: 'Filler post used to test infinite scroll and the "You\'re all caught up" footer.',
    category: 'Reminder' as const,
    pinned: false,
    status: 'published' as const,
    createdAt: ago(60 + i * 14),
  }));

  return {
    orgs: [
      { id: 'sslg', name: 'SSLG', fullName: 'Supreme Secondary Learner Government', description: 'The student government of Sagay National High School.', adviser: 'TBA', president: 'TBA', office: 'SSLG Office', facebook: 'https://www.facebook.com/' },
      { id: 'angsigay', name: 'Ang Sigay', fullName: 'Ang Sigay – Filipino Publication', description: 'The official Filipino-language school publication.', adviser: 'TBA', president: 'TBA', office: 'Publications Room', facebook: 'https://www.facebook.com/' },
      { id: 'theshell', name: 'The Shell', fullName: 'The Shell – English Publication', description: 'The official English-language school publication.', adviser: 'TBA', president: 'TBA', office: 'Publications Room', facebook: 'https://www.facebook.com/' },
      { id: 'spc', name: 'SPC', fullName: 'Special Program Committee', description: 'Coordinates activities for the school’s special programs.', adviser: 'TBA', president: 'TBA', office: 'SPC Office', facebook: 'https://www.facebook.com/' },
    ],
    events: [
      { ...base, id: 'e1', orgId: 'sslg', title: 'General Assembly', date: day(2), start: '08:00', end: '10:00', venue: 'School Gymnasium', body: 'All students are expected to attend. Wear your complete uniform.', createdAt: ago(30), announcementId: 'a2' },
      { ...base, id: 'e2', orgId: 'spc', title: 'Science Fair', date: day(5), start: '13:00', end: '16:00', venue: 'Science Building', body: 'Showcase of student research projects.', createdAt: ago(20), announcementId: 'a5' },
      { ...base, id: 'e3', orgId: 'theshell', title: 'Photojournalism Workshop', date: day(9), start: '09:00', end: '11:30', venue: 'AVR', audience: 'Members', body: 'Hands-on workshop for staff members.', createdAt: ago(18) },
      { ...base, id: 'e4', orgId: 'angsigay', title: 'Paligsahan sa Pagsulat', date: day(12), start: '14:00', venue: 'Room 204', tag: 'postponed', body: 'New date to be announced.', createdAt: ago(40) },
      { ...base, id: 'e5', orgId: 'sslg', title: 'Intramurals Opening', date: day(16), start: '07:30', venue: 'Oval', tag: 'cancelled', body: 'Cancelled due to scheduling conflicts.', createdAt: ago(44) },
      { ...base, id: 'e6', orgId: 'sslg', title: 'Brigada Eskwela', date: day(-4), start: '07:00', end: '12:00', venue: 'Campus', body: 'Thank you to everyone who helped!', createdAt: ago(200) },
      { ...base, id: 'e7', orgId: 'sslg', title: 'Foundation Day', date: day(30), start: '08:00', venue: 'Campus', status: 'draft', createdAt: ago(5) },
    ],
    announcements: [
      { id: 'a1', orgId: 'sslg', title: 'Clearance forms due this Friday', body: 'Submit your accomplished clearance forms to your class adviser on or before Friday. Late submissions will not be accepted.', category: 'Deadline', pinned: true, status: 'published', createdAt: ago(3) },
      { id: 'a2', orgId: 'sslg', title: 'Bring your school ID to the General Assembly', body: 'IDs will be checked at the gym entrance.', category: 'Reminder', eventId: 'e1', pinned: false, status: 'published', createdAt: ago(8) },
      { id: 'a3', orgId: 'angsigay', title: 'Ang Sigay opens staff recruitment', body: 'Interested in writing, layout, or photography? Apply at the Publications Room.', category: 'Announcement', pinned: false, status: 'published', createdAt: ago(12) },
      { id: 'a4', orgId: 'theshell', title: 'Article submission deadline moved', body: 'The deadline for contributions is now next Wednesday.', category: 'Deadline', pinned: false, status: 'published', createdAt: ago(16) },
      { id: 'a5', orgId: 'spc', title: 'Science Fair registration is open', body: 'Register your project with your science teacher. Limited slots per section.', category: 'Announcement', eventId: 'e2', pinned: true, status: 'published', createdAt: ago(22) },
      { id: 'a7', orgId: 'sslg', title: 'Scheduled: Voting reminder', body: 'This post is scheduled and only officers can see it until it goes live.', category: 'Reminder', pinned: false, status: 'scheduled', createdAt: ago(1), publishAt: new Date(now + 2 * 86400_000).toISOString() },
      { id: 'a8', orgId: 'spc', title: 'Draft: Lab safety guidelines', body: 'Work in progress.', category: 'Announcement', pinned: false, status: 'draft', createdAt: ago(2) },
      ...fillers,
    ],
  };
}
