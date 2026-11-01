import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { C } from '../../lib/theme';
import { useStore } from '../../lib/store';
import { Empty, FadeIn, Gate, IconButton, LinkButton, Screen, Segmented } from '../../lib/ui';
import { EventRow } from '../../lib/cards';
import { openEvent } from '../../lib/nav';
import { DOW, MONTHS, cmpEvent, fmtFull, monthCells, pad, parseDate, toDateStr, todayStr } from '../../lib/date';
import { EventItem } from '../../lib/types';

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
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          <Text style={s.h1}>Calendar</Text>
          <Segmented options={['Month', 'Agenda'] as const} value={view} onChange={setView} />
          <View style={{ height: 14 }} />
          {view === 'Month' ? Month() : Agenda()}
        </ScrollView>
      </Gate>
    </Screen>
  );

  function Month() {
    const cells = monthCells(cur.y, cur.m);
    const today = todayStr();
    const dayEvents = [...(byDate.get(sel) ?? [])].sort(cmpEvent);
    return (
      <>
        <View style={s.card}>
          {header}
          <View style={s.dow}>
            {DOW.map((d) => <Text key={d} style={s.dowT}>{d.toUpperCase()}</Text>)}
          </View>
          <View style={s.grid}>
            {cells.map((c, i) => {
              if (!c) return <View key={i} style={s.cell} />;
              const selected = c === sel;
              const isToday = c === today;
              return (
                <Pressable key={c} accessibilityRole="button" accessibilityLabel={fmtFull(c)} accessibilityState={{ selected }} style={s.cell} onPress={() => setSel(c)}>
                  <View collapsable={false} style={[s.day, selected && !isToday && s.selectedFill, isToday && s.today, selected && s.selected]}>
                    <Text style={[s.dayT, (selected || isToday) && { fontWeight: '800' }, isToday && { color: '#fff' }]}>
                      {parseDate(c).getDate()}
                    </Text>
                    {byDate.has(c) ? <View style={[s.dot, selected && !isToday && { backgroundColor: C.navy }]} /> : null}
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
        {dayEvents.length === 0 ? <Empty text="No events on this day." /> : dayEvents.map((e, i) => (
          <FadeIn key={e.id} index={i}><EventRow e={e} org={orgById(e.orgId)} mode="time" onPress={() => openEvent(e.id)} /></FadeIn>
        ))}
      </>
    );
  }

  function Agenda() {
    const prefix = `${cur.y}-${pad(cur.m + 1)}`;
    const list = liveEvents.filter((e) => e.date.startsWith(prefix) && (past || e.date >= todayStr())).sort(cmpEvent);
    const groups = list.reduce<Record<string, EventItem[]>>((acc, e) => ((acc[e.date] = [...(acc[e.date] ?? []), e]), acc), {});
    return (
      <>
        <View style={[s.card, { paddingBottom: 4 }]}>{header}</View>
        <View style={{ alignItems: 'flex-end', marginTop: 6 }}>
          <LinkButton title={past ? 'Hide past events' : 'Show past events'} onPress={() => setPast((p) => !p)} />
        </View>
        {list.length === 0 ? <Empty text={`No events scheduled for ${MONTHS[cur.m]}.`} /> : Object.keys(groups).map((d, gi) => {
          const dt = parseDate(d);
          return (
            <FadeIn key={d} index={gi}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={s.agendaDate}>
                  <Text style={s.big}>{dt.getDate()}</Text>
                  <Text style={s.wk}>{DOW[dt.getDay()].toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  {groups[d].map((e) => <EventRow key={e.id} e={e} org={orgById(e.orgId)} mode="time" onPress={() => openEvent(e.id)} />)}
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
  h1: { fontSize: 28, fontWeight: '800', color: C.navy, marginBottom: 12 },
  card: {
    backgroundColor: '#fff', borderRadius: 24, padding: 12, borderWidth: 1, borderColor: C.border,
    shadowColor: C.navy, shadowOpacity: 0.1, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 4,
  },
  monthBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  monthT: { fontSize: 18, fontWeight: '800', color: C.navy },
  dow: { flexDirection: 'row', backgroundColor: '#EEF1F8', borderRadius: 12, marginBottom: 6, paddingVertical: 8 },
  dowT: { width: `${100 / 7}%`, textAlign: 'center', color: C.navy2, fontWeight: '800', fontSize: 11, letterSpacing: 0.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, height: 52, alignItems: 'center', justifyContent: 'center' },
  // Every day tile always has the same border + radius; only the border color changes.
  day: {
    width: 44, height: 44, borderRadius: 14,
    borderWidth: 2, borderColor: 'transparent',
    overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  today: { backgroundColor: C.navy },
  selected: { borderColor: C.yellow },
  selectedFill: { backgroundColor: '#FFF9E5' },
  dayT: { fontWeight: '600', color: C.text, fontSize: 15 },
  dot: { position: 'absolute', bottom: 3, width: 6, height: 6, borderRadius: 3, backgroundColor: C.yellow },
  listHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 22, marginBottom: 10, paddingHorizontal: 4 },
  sel: { fontSize: 16, fontWeight: '800', color: C.text },
  count: { color: C.muted, fontWeight: '600', fontSize: 12 },
  agendaDate: { width: 52, alignItems: 'center', paddingTop: 10 },
  big: { fontSize: 26, fontWeight: '800', color: C.navy },
  wk: { fontSize: 11, fontWeight: '800', color: C.muted },
});