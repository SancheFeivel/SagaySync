import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, MIN_TAP } from './theme';
import { Announcement, EventItem, Org } from './types';
import { Monogram, Tag } from './ui';
import { fmtRange, fmtStamp, fmtTime, MONTHS, parseDate, DOW } from './date';
import { postTime } from './store';

export function EventTagView({ e }: { e: EventItem }) {
  if (e.tag === 'cancelled') return <Tag label="CANCELLED" tone="red" />;
  if (e.tag === 'postponed') return <Tag label="POSTPONED" tone="yellow" />;
  return null;
}

export function AnnouncementRow({ a, org, onPress }: { a: Announcement; org: Org; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={s.card}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 8 }}>
        <Monogram org={org} size={32} />
        <View style={{ flex: 1 }}>
          <Text style={s.org}>{org.name}</Text>
          <Text style={s.meta}>{fmtStamp(postTime(a))}</Text>
        </View>
        {a.pinned ? <Ionicons name="pin" size={16} color={C.muted} /> : null}
        <Tag label={a.category.toUpperCase()} tone={a.category === 'Deadline' ? 'red' : 'gray'} />
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
    <Pressable accessibilityRole="button" onPress={onPress} style={[s.card, { width: 230, marginRight: 12, minHeight: 130 }]}>
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
      <Text style={[s.title, { marginTop: 10 }]} numberOfLines={2}>{e.title}</Text>
      <Text style={s.meta}>{org.name} · {fmtTime(e.start)}</Text>
    </Pressable>
  );
}

/** Row in a list of events. `date` mode leads with a big day number, `time` mode with the start time. */
export function EventRow({ e, org, mode, next, onPress }: { e: EventItem; org: Org; mode: 'date' | 'time'; next?: boolean; onPress: () => void }) {
  const d = parseDate(e.date);
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[s.card, { flexDirection: 'row', gap: 12, alignItems: 'center', minHeight: MIN_TAP + 20 }]}>
      {mode === 'date' ? (
        <View style={s.dateBox}>
          <Text style={s.dateMon}>{MONTHS[d.getMonth()].slice(0, 3).toUpperCase()}</Text>
          <Text style={s.dateNum}>{d.getDate()}</Text>
        </View>
      ) : (
        <View style={{ width: 64 }}>
          <Text style={{ fontWeight: '800', color: C.navy }}>{fmtTime(e.start)}</Text>
        </View>
      )}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={s.title}>{e.title}</Text>
        <Text style={s.meta}>
          {mode === 'date' ? `${DOW[d.getDay()]} · ${fmtRange(e.start, e.end)}` : e.end ? `until ${fmtTime(e.end)}` : e.venue || ' '} · {org.name}
        </Text>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 2 }}>
          {next ? <Tag label="NEXT" tone="yellow" /> : null}
          <EventTagView e={e} />
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={C.muted} />
    </Pressable>
  );
}

export function PhotoView({ uri }: { uri: string }) {
  return <Image source={{ uri }} style={{ width: '100%', height: 200, borderRadius: 12, backgroundColor: C.border }} resizeMode="cover" />;
}

const s = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  org: { fontWeight: '700', color: C.text },
  meta: { color: C.muted, fontSize: 12 },
  title: { fontSize: 16, fontWeight: '700', color: C.text },
  body: { color: C.muted, marginTop: 4, lineHeight: 20 },
  dateBox: { width: 52, height: 56, borderRadius: 12, backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center' },
  dateMon: { color: C.yellow, fontSize: 10, fontWeight: '800' },
  dateNum: { color: '#fff', fontSize: 22, fontWeight: '800', lineHeight: 26 },
});
