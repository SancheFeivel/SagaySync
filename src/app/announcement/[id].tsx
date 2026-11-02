import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { C, ICON, PAD, PRESSED, SERIF, TYPE } from '../../lib/theme';
import { postTime, useStore } from '../../lib/store';
import { Empty, Monogram, Screen, SectionTitle, Tag, TopBar } from '../../lib/ui';
import { EventRow } from '../../lib/cards';
import { openEvent, openOrg } from '../../lib/nav';
import { fmtStamp } from '../../lib/date';

// Provisional design: Announcement Detail was listed as "not designed yet".
export default function AnnouncementDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { announcements, events, orgById, officer } = useStore();
  const a = announcements.find((x) => x.id === id);
  // students only see live posts; officers can open their own group's drafts/scheduled
  const visible = a && (a.status === 'published' || (a.status === 'scheduled' && postTime(a) <= new Date().toISOString()) || officer?.orgId === a.orgId);
  const ev = a?.eventId ? events.find((e) => e.id === a.eventId && e.status === 'published') : undefined;
  return (
    <Screen>
      <TopBar title="Announcement" />
      {!a || !visible ? <Empty text="This post is no longer available." /> : (
        <ScrollView contentContainerStyle={{ padding: PAD, paddingTop: 8, paddingBottom: 40, gap: 12 }}>
          <Pressable accessibilityRole="button" onPress={() => openOrg(a.orgId)} style={({ pressed }) => [s.org, pressed && PRESSED]}>
            <Monogram org={orgById(a.orgId)} size={40} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: C.text }}>{orgById(a.orgId).name}</Text>
              <Text style={{ color: C.muted, fontSize: TYPE.caption }}>{fmtStamp(postTime(a))}</Text>
            </View>
            <Ionicons name="chevron-forward" size={ICON.md} color={C.muted} />
          </Pressable>
          {a.category !== 'Announcement' || a.pinned || a.status !== 'published' ? (
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {a.category !== 'Announcement' ? <Tag label={a.category.toUpperCase()} tone={a.category === 'Deadline' ? 'red' : 'gray'} /> : null}
              {a.pinned ? <Tag label="PINNED" tone="yellow" /> : null}
              {a.status !== 'published' ? <Tag label={a.status.toUpperCase()} tone="gray" /> : null}
            </View>
          ) : null}
          <Text style={s.title}>{a.title}</Text>
          <Text style={s.body}>{a.body}</Text>
          {ev ? (<><SectionTitle>Related event</SectionTitle><EventRow e={ev} org={orgById(ev.orgId)} mode="date" onPress={() => openEvent(ev.id)} /></>) : null}
        </ScrollView>
      )}
    </Screen>
  );
}
const s = StyleSheet.create({
  org: { flexDirection: 'row', gap: 12, alignItems: 'center', minHeight: 48 },
  title: { fontSize: TYPE.h2, fontWeight: '700', color: C.navy, fontFamily: SERIF, letterSpacing: -0.3 },
  body: { fontSize: TYPE.body, lineHeight: 24, color: C.text },
});
