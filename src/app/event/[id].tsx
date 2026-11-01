import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../../lib/theme';
import { isLive, useStore } from '../../lib/store';
import { Empty, Monogram, Screen, Tag, TopBar } from '../../lib/ui';
import { AnnouncementRow } from '../../lib/cards';
import { openAnnouncement, openOrg } from '../../lib/nav';
import { fmtFull, fmtRange } from '../../lib/date';

// Provisional design: Event Detail was listed as "not designed yet".
export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { events, announcements, orgById, officer } = useStore();
  const e = events.find((x) => x.id === id);
  const visible = e && (e.status === 'published' || officer?.orgId === e.orgId);
  const ann = e?.announcementId ? announcements.find((a) => a.id === e.announcementId && isLive(a)) : undefined;
  const org = e ? orgById(e.orgId) : undefined;
  const Row = ({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) => (
    <View style={s.row}><Ionicons name={icon} size={20} color={C.navy2} /><Text style={s.rowT}>{text}</Text></View>
  );
  return (
    <Screen>
      <TopBar title="Event" />
      {!e || !visible || !org ? <Empty text="This event is no longer available." /> : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 12 }}>
          {e.tag !== 'none' ? (
            <View style={[s.banner, { backgroundColor: e.tag === 'cancelled' ? '#FEE4E2' : '#FFF4D6' }]}>
              <Text style={{ fontWeight: '800', color: e.tag === 'cancelled' ? C.danger : C.navy }}>
                {e.tag === 'cancelled' ? 'This event was cancelled.' : 'This event was postponed.'}
              </Text>
            </View>
          ) : null}
          {e.status === 'draft' ? <Tag label="DRAFT" tone="gray" /> : null}
          <Text style={s.title}>{e.title}</Text>
          <Row icon="calendar-outline" text={fmtFull(e.date)} />
          <Row icon="time-outline" text={fmtRange(e.start, e.end)} />
          {e.venue ? <Row icon="location-outline" text={e.venue} /> : null}
          <Row icon="people-outline" text={e.audience} />
          {e.body ? <Text style={s.body}>{e.body}</Text> : null}
          <Pressable accessibilityRole="button" onPress={() => openOrg(org.id)} style={s.org}>
            <Monogram org={org} size={40} />
            <Text style={{ fontWeight: '800', color: C.text }}>Hosted by {org.name}</Text>
          </Pressable>
          {ann ? (<><Text style={s.h}>Related announcement</Text><AnnouncementRow a={ann} org={org} onPress={() => openAnnouncement(ann.id)} /></>) : null}
        </ScrollView>
      )}
    </Screen>
  );
}
const s = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '900', color: C.navy },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center', minHeight: 32 },
  rowT: { fontSize: 16, color: C.text, flex: 1 },
  body: { fontSize: 16, lineHeight: 24, color: C.text, marginTop: 4 },
  banner: { padding: 12, borderRadius: 12 },
  org: { flexDirection: 'row', gap: 12, alignItems: 'center', minHeight: 48, marginTop: 8 },
  h: { fontSize: 16, fontWeight: '800', color: C.text, marginTop: 8 },
});
