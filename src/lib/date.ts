export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DOW_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const pad = (n: number) => String(n).padStart(2, '0');

export const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const toTimeStr = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
export const parseDate = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const timeToDate = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
};
export const todayStr = () => toDateStr(new Date());
export const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
export const fmtTime = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${pad(m)} ${h >= 12 ? 'PM' : 'AM'}`;
};
export const fmtShort = (s: string) => {
  const d = parseDate(s);
  return `${DOW[d.getDay()]}, ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
};
export const fmtFull = (s: string) => {
  const d = parseDate(s);
  return `${DOW_FULL[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};
export const fmtStamp = (iso: string | number) => {
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()} · ${fmtTime(toTimeStr(d))}`;
};
export const fmtHeaderDate = () => {
  const d = new Date();
  return `${DOW_FULL[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
};
export const fmtRange = (start: string, end?: string) => (end ? `${fmtTime(start)} – ${fmtTime(end)}` : fmtTime(start));

/** Cells for a month grid (null = blank). Length is a multiple of 7. */
export function monthCells(y: number, m: number): (string | null)[] {
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const cells: (string | null)[] = Array(first).fill(null);
  for (let d = 1; d <= days; d++) cells.push(`${y}-${pad(m + 1)}-${pad(d)}`);
  while (cells.length % 7) cells.push(null);
  return cells;
}
export const cmpEvent = (a: { date: string; start: string }, b: { date: string; start: string }) =>
  (a.date + a.start).localeCompare(b.date + b.start);
