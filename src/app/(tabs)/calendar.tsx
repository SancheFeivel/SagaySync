import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { C, CARD, PAD, PRESSED, R, SERIF, SP, TYPE } from '../../lib/theme';
import { useStore } from '../../lib/store';
import { Empty, FadeIn, Gate, IconButton, LinkButton, PageTitle, Screen, Segmented } from '../../lib/ui';
import { EventRow } from '../../lib/cards';
import { openEvent } from '../../lib/nav';
import { DOW, MONTHS, cmpEvent, fmtFull, monthCells, pad, parseDate, toDateStr, todayStr } from '../../lib/date';
import { EventItem } from '../../lib/types';
import { HOLIDAY_LABEL, Holiday, holidaysBetween, holidaysOn } from '../../lib/holidays';

export default function CalendarTab() {
  const { liveEvents, orgById } = useStore();
  const now = new Date();
  const [view, setView] = useState<'Month' | 'Agenda'>('Month');
  const [cur, setCur] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [sel, setSel] = useState(todayStr());
  const [past, setPast] = useState(false);

  const shift = (n: number) => {
    const d = new Date(cur.y, cur.m + n, 1);
    setCur({ y: d.getFullYear(), m: d.getMonth() });
    setSel(d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() ? todayStr() : toDateStr(d));
  };

  const byDate = useMemo(() => {
    const m = new Map<string, EventItem[]>();
    liveEvents.forEach((e) => m.set(e.date, [...(m.get(e.date) ?? []), e]));
    return m;
  }, [liveEvents]);

  const HolidayRow = ({ h }: { h: Holiday }) => (
    <View style={s.holiday}>
      <View style={s.holidayBar} />
      <View style={{ flex: 1 }}>
        <Text style={s.holidayName}>{h.name}</Text>
        <Text style={s.holidayKind}>{HOLIDAY_LABEL[h.kind]}</Text>
      </View>
    </View>
  );

  const header = (
    <View style={s.monthBar}>
      <IconButton name="chevron-back" label="Previous month" onPress={() => shift(-1)} />
      <Text style={s.monthT}>{MONTHS[cur.m]} {cur.y}</Text>
      <IconButton name="chevron-forward" label="Next month" onPress={() => shift(1)} />
    </View>
  );

  return (
    <Screen>
      <Gate>
        <ScrollView contentContainerStyle={{ padding: PAD, paddingBottom: 32 }}>
          <PageTitle>Calendar</PageTitle>
          {header}
          <Segmented options={['Month', 'Agenda'] as const} value={view} onChange={setView} />
          <View style={{ height: SP.lg }} />
          {view === 'Month' ? Month() : Agenda()}
        </ScrollView>
      </Gate>
    </Screen>
  );

  function Month() {
    const cells = monthCells(cur.y, cur.m);
    const today = todayStr();
    const dayEvents = [...(byDate.get(sel) ?? [])].sort(cmpEvent);
    const dayHolidays = holidaysOn(sel);
    return (
      <>
        <View style={s.card}>
          <View style={s.dow}>
            {DOW.map((d) => <Text key={d} style={s.dowT}>{d.toUpperCase()}</Text>)}
          </View>
          <View style={s.grid}>
            {cells.map((c, i) => {
              if (!c) return <View key={i} style={s.cell} />;
              const selected = c === sel;
              const isToday = c === today;
              const isHoliday = holidaysOn(c).some((h) => h.kind !== 'working');
              return (
                <Pressable key={c} accessibilityRole="button" accessibilityLabel={fmtFull(c)} accessibilityState={{ selected }} style={({ pressed }) => [s.cell, pressed && PRESSED]} onPress={() => setSel(c)}>
                  <View collapsable={false} style={[s.day, isHoliday && s.holidayFill, isToday && s.today, selected && s.selected]}>
                    <Text style={[s.dayT, (selected || isToday) && { fontWeight: '700' }, isHoliday && !isToday && { color: C.grayText, fontWeight: '700' }, isToday && { color: '#fff' }]}>
                      {parseDate(c).getDate()}
                    </Text>
                    {byDate.has(c) ? <View style={[s.dot, isToday && { backgroundColor: '#fff' }]} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={s.listHead}>
          <Text style={s.sel}>{fmtFull(sel)}</Text>
          <Text style={s.count}>{dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}</Text>
        </View>
        {dayHolidays.map((h) => <HolidayRow key={h.date + h.name} h={h} />)}
        {dayEvents.length === 0 && dayHolidays.length === 0 ? <Empty icon="calendar-outline" text="No events on this day." /> : null}
        {dayEvents.map((e, i) => (
          <FadeIn key={e.id} index={i}><EventRow e={e} org={orgById(e.orgId)} mode="time" onPress={() => openEvent(e.id)} /></FadeIn>
        ))}
      </>
    );
  }

  function Agenda() {
    const prefix = `${cur.y}-${pad(cur.m + 1)}`;
    const list = liveEvents.filter((e) => e.date.startsWith(prefix) && (past || e.date >= todayStr())).sort(cmpEvent);
    const groups = list.reduce<Record<string, EventItem[]>>((acc, e) => ((acc[e.date] = [...(acc[e.date] ?? []), e]), acc), {});
    const monthHolidays = holidaysBetween(`${prefix}-01`, `${prefix}-31`).filter((h) => past || h.date >= todayStr());
    const dates = Array.from(new Set([...Object.keys(groups), ...monthHolidays.map((h) => h.date)])).sort();
    return (
      <>
        <View style={{ alignItems: 'flex-end' }}>
          <LinkButton title={past ? 'Hide past events' : 'Show past events'} onPress={() => setPast((p) => !p)} />
        </View>
        {dates.length === 0 ? <Empty icon="calendar-outline" text={`No events scheduled for ${MONTHS[cur.m]}.`} /> : dates.map((d, gi) => {
          const dt = parseDate(d);
          return (
            <FadeIn key={d} index={gi}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={s.agendaDate}>
                  <Text style={s.big}>{dt.getDate()}</Text>
                  <Text style={s.wk}>{DOW[dt.getDay()].toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  {holidaysOn(d).map((h) => <HolidayRow key={h.name} h={h} />)}
                  {(groups[d] ?? []).map((e) => <EventRow key={e.id} e={e} org={orgById(e.orgId)} mode="time" onPress={() => openEvent(e.id)} />)}
                </View>
              </View>
            </FadeIn>
          );
        })}
      </>
    );
  }
}

const s = StyleSheet.create({
  // Same surface as every other card in the app.
  card: { ...CARD, padding: 8 },
  monthBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SP.sm },
  monthT: { fontSize: TYPE.title, fontWeight: '700', color: C.navy, fontFamily: SERIF, letterSpacing: -0.2 },
  dow: { flexDirection: 'row', marginBottom: SP.sm, paddingVertical: SP.xs },
  dowT: { width: `${100 / 7}%`, textAlign: 'center', color: C.muted, fontWeight: '700', fontSize: TYPE.caption, letterSpacing: 0.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  // Padding gives every tile a gap so neighbors (holiday fill, selected border) never touch.
  cell: { width: `${100 / 7}%`, height: 54, padding: 1.5, alignItems: 'center', justifyContent: 'center' },
  // Tile fills its column (max 50) instead of a fixed size, which overflowed on narrow phones.
  day: {
    width: '100%', maxWidth: 50, aspectRatio: 1, borderRadius: R.md,
    borderWidth: 2, borderColor: 'transparent',
    overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  today: { backgroundColor: C.navy },
  selected: { borderColor: C.navy },
  holidayFill: { backgroundColor: C.soft },
  dayT: { fontWeight: '600', color: C.text, fontSize: TYPE.body },
  // Pinned near the tile's bottom edge so the number stays centered in the square.
  dot: { position: 'absolute', bottom: 2, width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.navy2 },
  listHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: SP.xxl, marginBottom: SP.md, paddingHorizontal: SP.xs },
  sel: { fontSize: TYPE.title, fontWeight: '700', color: C.text, fontFamily: SERIF },
  count: { color: C.muted, fontWeight: '600', fontSize: TYPE.caption },
  holiday: { flexDirection: 'row', alignItems: 'center', gap: SP.md, backgroundColor: C.soft, borderRadius: R.lg, padding: SP.lg, marginBottom: SP.md, borderWidth: 1, borderColor: C.border },
  holidayBar: { width: 4, alignSelf: 'stretch', borderRadius: 2, backgroundColor: C.muted },
  holidayName: { fontSize: TYPE.body, fontWeight: '700', color: C.text, fontFamily: SERIF },
  holidayKind: { color: C.muted, fontSize: TYPE.caption, marginTop: 2 },
  agendaDate: { width: 52, alignItems: 'center', paddingTop: SP.md },
  big: { fontSize: TYPE.h2, fontWeight: '700', color: C.navy, fontFamily: SERIF },
  wk: { fontSize: TYPE.caption, fontWeight: '700', color: C.muted },
});
