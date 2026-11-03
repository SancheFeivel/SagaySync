import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { C, ICON, PAD, PRESSED, R, SERIF, TYPE } from '../../lib/theme';
import { isLive, useStore } from '../../lib/store';
import { Card, Empty, Monogram, Screen, SectionTitle, Tag, TopBar } from '../../lib/ui';
import { AnnouncementRow } from '../../lib/cards';
import { openAnnouncement, openOrg } from '../../lib/nav';
import { fmtFull, fmtRange } from '../../lib/date';

function Row({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={s.row}><Ionicons name={icon} size={ICON.md} color={C.navy2} /><Text style={s.rowT}>{text}</Text></View>
  );
}

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { events, announcements, orgById, officer, admin } = useStore();
  const e = events.find((x) => x.id === id);
  const visible = e && (e.status === 'published' || officer?.orgId === e.orgId || !!admin);
  const ann = e?.announcementId ? announcements.find((a) => a.id === e.announcementId && isLive(a)) : undefined;
  const org = e ? orgById(e.orgId) : undefined;
  return (
    <Screen>
      <TopBar title="Event" />
      {!e || !visible || !org ? <Empty text="This event is no longer available." /> : (
        <ScrollView contentContainerStyle={{ padding: PAD, paddingTop: 8, paddingBottom: 40, gap: 12 }}>
          {e.tag !== 'none' ? (
            <View style={[s.banner, { backgroundColor: e.tag === 'cancelled' ? C.dangerSoft : C.warnSoft }]}>
              <Text style={{ fontWeight: '700', color: e.tag === 'cancelled' ? C.danger : C.navy }}>
                {e.tag === 'cancelled' ? 'This event was cancelled.' : 'This event was postponed.'}
              </Text>
            </View>
          ) : null}
          {e.status === 'draft' ? <Tag label="DRAFT" tone="gray" /> : null}
          <Text style={s.title}>{e.title}</Text>
          <Card style={{ gap: 12 }}>
            <Row icon="calendar-outline" text={fmtFull(e.date)} />
            <Row icon="time-outline" text={fmtRange(e.start, e.end)} />
            {e.venue ? <Row icon="location-outline" text={e.venue} /> : null}
            <Row icon="people-outline" text={e.audience} />
          </Card>
          {e.body ? <Text style={s.body}>{e.body}</Text> : null}
          <Pressable accessibilityRole="button" onPress={() => openOrg(org.id)} style={({ pressed }) => [s.org, pressed && PRESSED]}>
            <Monogram org={org} size={40} />
            <View style={{ flex: 1 }}>
              <Text style={s.hosted}>Hosted by</Text>
              <Text style={s.orgName}>{org.name}</Text>
            </View>
            <Ionicons name="chevron-forward" size={ICON.md} color={C.muted} />
          </Pressable>
          {ann ? (<><SectionTitle>Related announcement</SectionTitle><AnnouncementRow a={ann} org={org} onPress={() => openAnnouncement(ann.id)} /></>) : null}
        </ScrollView>
      )}
    </Screen>
  );
}
const s = StyleSheet.create({
  title: { fontSize: TYPE.h2, fontWeight: '700', color: C.navy, fontFamily: SERIF, letterSpacing: -0.3 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center', minHeight: 32 },
  rowT: { fontSize: TYPE.body, color: C.text, flex: 1 },
  body: { fontSize: TYPE.body, lineHeight: 24, color: C.text, marginTop: 4 },
  banner: { padding: 12, borderRadius: R.md },
  org: { flexDirection: 'row', gap: 12, alignItems: 'center', minHeight: 48 },
  hosted: { color: C.muted, fontSize: TYPE.caption },
  orgName: { fontWeight: '700', color: C.text },
});
