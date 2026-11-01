// src/lib/holidays.ts
// National holidays only. Sources: Proclamation 1006 s.2025 (2026 list),
// 1189 and 1264 s.2026 (2026 Eids), Proclamation 1427 s.2026 (2027 list).
// 2027 Eid'l Fitr and Eid'l Adha are NOT here yet. Add them once Malacañang proclaims them.

export type HolidayKind = 'regular' | 'special' | 'working';

export type Holiday = {
  date: string; // 'YYYY-MM-DD', local Philippine date
  name: string;
  kind: HolidayKind;
};

export const HOLIDAYS: Holiday[] = [
  // ---------- 2026 ----------
  { date: '2026-01-01', name: "New Year's Day", kind: 'regular' },
  { date: '2026-02-17', name: 'Chinese New Year', kind: 'special' },
  { date: '2026-02-25', name: 'EDSA People Power Anniversary', kind: 'working' },
  { date: '2026-03-20', name: "Eid'l Fitr", kind: 'regular' },
  { date: '2026-04-02', name: 'Maundy Thursday', kind: 'regular' },
  { date: '2026-04-03', name: 'Good Friday', kind: 'regular' },
  { date: '2026-04-04', name: 'Black Saturday', kind: 'special' },
  { date: '2026-04-09', name: 'Araw ng Kagitingan', kind: 'regular' },
  { date: '2026-05-01', name: 'Labor Day', kind: 'regular' },
  { date: '2026-05-27', name: "Eid'l Adha", kind: 'regular' },
  { date: '2026-06-12', name: 'Independence Day', kind: 'regular' },
  { date: '2026-08-21', name: 'Ninoy Aquino Day', kind: 'special' },
  { date: '2026-08-31', name: 'National Heroes Day', kind: 'regular' },
  { date: '2026-11-01', name: "All Saints' Day", kind: 'special' },
  { date: '2026-11-02', name: "All Souls' Day", kind: 'special' },
  { date: '2026-11-30', name: 'Bonifacio Day', kind: 'regular' },
  { date: '2026-12-08', name: 'Feast of the Immaculate Conception', kind: 'special' },
  { date: '2026-12-24', name: 'Christmas Eve', kind: 'special' },
  { date: '2026-12-25', name: 'Christmas Day', kind: 'regular' },
  { date: '2026-12-30', name: 'Rizal Day', kind: 'regular' },
  { date: '2026-12-31', name: 'Last Day of the Year', kind: 'special' },

  // ---------- 2027 ----------
  { date: '2027-01-01', name: "New Year's Day", kind: 'regular' },
  { date: '2027-02-06', name: 'Chinese New Year', kind: 'special' },
  { date: '2027-02-25', name: 'EDSA People Power Anniversary', kind: 'working' },
  { date: '2027-03-25', name: 'Maundy Thursday', kind: 'regular' },
  { date: '2027-03-26', name: 'Good Friday', kind: 'regular' },
  { date: '2027-03-27', name: 'Black Saturday', kind: 'special' },
  { date: '2027-04-09', name: 'Araw ng Kagitingan', kind: 'regular' },
  { date: '2027-05-01', name: 'Labor Day', kind: 'regular' },
  { date: '2027-06-12', name: 'Independence Day', kind: 'regular' },
  { date: '2027-08-21', name: 'Ninoy Aquino Day', kind: 'special' },
  { date: '2027-08-30', name: 'National Heroes Day', kind: 'regular' },
  { date: '2027-11-01', name: "All Saints' Day", kind: 'special' },
  { date: '2027-11-02', name: "All Souls' Day", kind: 'special' },
  { date: '2027-11-30', name: 'Bonifacio Day', kind: 'regular' },
  { date: '2027-12-08', name: 'Feast of the Immaculate Conception', kind: 'special' },
  { date: '2027-12-24', name: 'Christmas Eve', kind: 'special' },
  { date: '2027-12-25', name: 'Christmas Day', kind: 'regular' },
  { date: '2027-12-30', name: 'Rizal Day', kind: 'regular' },
  { date: '2027-12-31', name: 'Last Day of the Year', kind: 'special' },
];

const byDate = new Map<string, Holiday[]>();
for (const h of HOLIDAYS) {
  const list = byDate.get(h.date);
  if (list) list.push(h);
  else byDate.set(h.date, [h]);
}

/** Local-date key. Do NOT use toISOString().slice(0, 10): it converts to UTC and can shift the day. */
export function dayKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export const holidaysOn = (key: string): Holiday[] => byDate.get(key) ?? [];

/** Inclusive range; 'YYYY-MM-DD' keys compare safely as strings. */
export const holidaysBetween = (fromKey: string, toKey: string): Holiday[] =>
  HOLIDAYS.filter((h) => h.date >= fromKey && h.date <= toKey);

export const holidaysInMonth = (year: number, month0: number): Holiday[] => {
  const prefix = `${year}-${String(month0 + 1).padStart(2, '0')}-`;
  return HOLIDAYS.filter((h) => h.date.startsWith(prefix));
};

export const HOLIDAY_LABEL: Record<HolidayKind, string> = {
  regular: 'Regular holiday',
  special: 'Special non-working day',
  working: 'Special working day',
};
