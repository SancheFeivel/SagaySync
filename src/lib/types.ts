export type Org = {
  id: string;
  name: string;
  fullName: string;
  description: string;
  adviser: string;
  president: string;
  office: string;
  facebook: string;
};
export type Category = 'Announcement' | 'Reminder' | 'Deadline';
export type PostStatus = 'published' | 'scheduled' | 'draft';
export type Announcement = {
  id: string;
  orgId: string;
  title: string;
  body: string;
  category: Category;
  eventId?: string;
  pinned: boolean;
  status: PostStatus;
  createdAt: string; // ISO
  publishAt?: string; // ISO, only for scheduled
};
export type EventTag = 'none' | 'cancelled' | 'postponed';
export type Audience = 'All students' | 'Members';
export type EventItem = {
  id: string;
  orgId: string;
  title: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:mm
  end?: string; // HH:mm
  venue: string;
  audience: Audience;
  body: string;
  status: 'published' | 'draft';
  tag: EventTag;
  createdAt: string;
  announcementId?: string;
};
export type Officer = { email: string; orgId: string };
export type Data = { orgs: Org[]; announcements: Announcement[]; events: EventItem[] };
