import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { C } from '../../lib/theme';
import { postTime, useStore } from '../../lib/store';
import { Empty, Monogram, Screen, Tag, TopBar } from '../../lib/ui';
import { EventRow, PhotoView } from '../../lib/cards';
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
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 12 }}>
          <Pressable accessibilityRole="button" onPress={() => openOrg(a.orgId)} style={s.org}>
            <Monogram org={orgById(a.orgId)} size={40} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '800', color: C.text }}>{orgById(a.orgId).name}</Text>
              <Text style={{ color: C.muted, fontSize: 12 }}>{fmtStamp(postTime(a))}</Text>
            </View>
          </Pressable>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Tag label={a.category.toUpperCase()} tone={a.category === 'Deadline' ? 'red' : 'navy'} />
            {a.pinned ? <Tag label="PINNED" tone="yellow" /> : null}
            {a.status !== 'published' ? <Tag label={a.status.toUpperCase()} tone="gray" /> : null}
          </View>
          <Text style={s.title}>{a.title}</Text>
          {a.photo ? <PhotoView uri={a.photo} /> : null}
          <Text style={s.body}>{a.body}</Text>
          {ev ? (<><Text style={s.h}>Related event</Text><EventRow e={ev} org={orgById(ev.orgId)} mode="date" onPress={() => openEvent(ev.id)} /></>) : null}
        </ScrollView>
      )}
    </Screen>
  );
}
const s = StyleSheet.create({
  org: { flexDirection: 'row', gap: 12, alignItems: 'center', minHeight: 48 },
  title: { fontSize: 24, fontWeight: '900', color: C.navy },
  body: { fontSize: 16, lineHeight: 24, color: C.text },
  h: { fontSize: 16, fontWeight: '800', color: C.text, marginTop: 8 },
});
