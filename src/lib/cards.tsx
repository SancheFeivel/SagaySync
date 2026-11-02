import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, CARD, ICON, MIN_TAP, PRESSED, R, SERIF, SP, TYPE } from './theme';
import { Announcement, EventItem, Org } from './types';
import { Monogram, Tag } from './ui';
import { fmtFull, fmtRange, fmtStamp, fmtTime, MONTHS, parseDate, DOW } from './date';
import { postTime } from './store';

export function EventTagView({ e }: { e: EventItem }) {
  if (e.tag === 'cancelled') return <Tag label="CANCELLED" tone="red" />;
  if (e.tag === 'postponed') return <Tag label="POSTPONED" tone="yellow" />;
  return null;
}

/** What a screen reader says for an event card or row, instead of reading every tag and icon. */
const eventLabel = (e: EventItem, org: Org) =>
  `${e.tag !== 'none' ? `${e.tag}: ` : ''}${e.title}, ${fmtFull(e.date)}, ${fmtRange(e.start, e.end)}, ${org.name}`;

export function AnnouncementRow({ a, org, onPress }: { a: Announcement; org: Org; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button" accessibilityLabel={`${a.category !== 'Announcement' ? `${a.category}: ` : ''}${a.title}, ${org.name}`}
      onPress={onPress} style={({ pressed }) => [s.card, pressed && PRESSED]}
    >
      <View style={{ flexDirection: 'row', gap: SP.md, alignItems: 'center', marginBottom: SP.sm }}>
        <Monogram org={org} size={44} />
        <View style={{ flex: 1 }}>
          <Text style={s.org}>{org.name}</Text>
          <Text style={s.meta}>{fmtStamp(postTime(a))}</Text>
        </View>
        {a.pinned ? <Ionicons name="pin" size={16} color={C.muted} /> : null}
        {a.category !== 'Announcement' ? <Tag label={a.category.toUpperCase()} tone={a.category === 'Deadline' ? 'red' : 'gray'} /> : null}
      </View>
      <Text style={s.title}>{a.title}</Text>
      <Text style={s.body} numberOfLines={2}>{a.body}</Text>
    </Pressable>
  );
}

/** Horizontal card for "Coming up" on Home. */
export function EventCard({ e, org, next, onPress }: { e: EventItem; org: Org; next?: boolean; onPress: () => void }) {
  const d = parseDate(e.date);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={eventLabel(e, org)} onPress={onPress} style={({ pressed }) => [s.card, { width: 230, marginRight: 12, minHeight: 130 }, next && { borderColor: C.navy, borderWidth: 2 }, pressed && PRESSED]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={s.dateBox}>
          <Text style={s.dateMon}>{MONTHS[d.getMonth()].slice(0, 3).toUpperCase()}</Text>
          <Text style={s.dateNum}>{d.getDate()}</Text>
        </View>
        <View style={{ gap: 4, alignItems: 'flex-end' }}>
          {next ? <Tag label="NEXT" tone="yellow" /> : null}
          <EventTagView e={e} />
        </View>
      </View>
      <Text style={[s.title, { marginTop: SP.md }]} numberOfLines={2}>{e.title}</Text>
      <Text style={s.meta}>{org.name} · {fmtTime(e.start)}</Text>
    </Pressable>
  );
}

/** Row in a list of events. `date` mode leads with a big day number, `time` mode with the start time. */
export function EventRow({ e, org, mode, next, onPress }: { e: EventItem; org: Org; mode: 'date' | 'time'; next?: boolean; onPress: () => void }) {
  const d = parseDate(e.date);
  // Calendar day view: same shape as a holiday card (bar, serif title, one meta line).
  if (mode === 'time') {
    return (
      <Pressable accessibilityRole="button" accessibilityLabel={eventLabel(e, org)} onPress={onPress} style={({ pressed }) => [s.line, pressed && PRESSED]}>
        <View style={s.lineBar} />
        <View style={{ flex: 1 }}>
          <Text style={s.lineTitle}>{e.title}</Text>
          <Text style={[s.meta, { marginTop: 2 }]}>{fmtRange(e.start, e.end)} · {org.name}</Text>
          {next || e.tag !== 'none' ? (
            <View style={{ flexDirection: 'row', gap: SP.sm, marginTop: SP.sm }}>
              {next ? <Tag label="NEXT" tone="yellow" /> : null}
              <EventTagView e={e} />
            </View>
          ) : null}
        </View>
      </Pressable>
    );
  }
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={eventLabel(e, org)} onPress={onPress} style={({ pressed }) => [s.card, { flexDirection: 'row', gap: 12, alignItems: 'center', minHeight: MIN_TAP + 20 }, pressed && PRESSED]}>
      {mode === 'date' ? (
        <View style={s.dateBox}>
          <Text style={s.dateMon}>{MONTHS[d.getMonth()].slice(0, 3).toUpperCase()}</Text>
          <Text style={s.dateNum}>{d.getDate()}</Text>
        </View>
      ) : (
        <View style={{ width: 64 }}>
          <Text style={{ fontWeight: '700', color: C.navy }}>{fmtTime(e.start)}</Text>
        </View>
      )}
      <View style={{ flex: 1, gap: SP.xs }}>
        <Text style={s.title}>{e.title}</Text>
        <Text style={s.meta}>
          {mode === 'date' ? `${DOW[d.getDay()]} · ${fmtRange(e.start, e.end)}` : e.end ? `until ${fmtTime(e.end)}` : e.venue || ' '} · {org.name}
        </Text>
        <View style={{ flexDirection: 'row', gap: SP.sm, marginTop: SP.xs }}>
          {next ? <Tag label="NEXT" tone="yellow" /> : null}
          <EventTagView e={e} />
        </View>
      </View>
      <Ionicons name="chevron-forward" size={ICON.md} color={C.muted} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: { ...CARD, padding: SP.lg, marginBottom: SP.md },
  org: { fontWeight: '700', color: C.text },
  meta: { color: C.muted, fontSize: TYPE.caption },
  line: { ...CARD, flexDirection: 'row', alignItems: 'center', gap: SP.md, padding: SP.lg, marginBottom: SP.md },
  lineBar: { width: 4, alignSelf: 'stretch', borderRadius: 2, backgroundColor: C.navy },
  lineTitle: { fontSize: TYPE.body, fontWeight: '700', color: C.text, fontFamily: SERIF },
  title: { fontSize: TYPE.title, fontWeight: '700', color: C.text, fontFamily: SERIF },
  body: { color: C.muted, marginTop: SP.sm, lineHeight: 24 },
  // Soft badge, same as the group monograms.
  dateBox: { width: 54, height: 58, borderRadius: R.md, backgroundColor: C.soft, alignItems: 'center', justifyContent: 'center' },
  dateMon: { color: C.navy2, fontSize: TYPE.caption, fontWeight: '700', letterSpacing: 1.2 },
  dateNum: { color: C.navy, fontSize: TYPE.h3, fontWeight: '700', lineHeight: 26, fontFamily: SERIF },
});
