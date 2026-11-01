import React, { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../../lib/theme';
import { postTime, useStore } from '../../lib/store';
import { Button, Empty, FadeIn, IconButton, LinkButton, Monogram, Screen, Segmented } from '../../lib/ui';
import { AnnouncementRow, EventRow } from '../../lib/cards';
import { openAnnouncement, openEvent } from '../../lib/nav';
import { router } from 'expo-router';
import { todayStr } from '../../lib/date';

const TABS = ['Posts', 'Events', 'About'] as const;

export default function OrgProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { orgs, feed, liveEvents, follows, toggleFollow, markSeen } = useStore();
  const [tab, setTab] = useState<(typeof TABS)[number]>('Posts');
  const [past, setPast] = useState(false);
  const org = orgs.find((o) => o.id === id);

  useEffect(() => { if (id) markSeen(id); }, [id, markSeen]); // clears the "new" badge

  if (!org) return <Screen><IconButton name="chevron-back" label="Back" onPress={() => router.back()} /><Empty text="This group is no longer available." /></Screen>;

  const following = follows.includes(org.id);
  const posts = feed.filter((a) => a.orgId === org.id).sort((a, b) => Number(b.pinned) - Number(a.pinned) || postTime(b).localeCompare(postTime(a)));
  const mine = liveEvents.filter((e) => e.orgId === org.id);
  const evs = mine.filter((e) => past || e.date >= todayStr());
  const nextId = mine.find((e) => e.date >= todayStr() && e.tag !== 'cancelled')?.id;

  return (
    <Screen edges={['top']}>
      <View style={s.head}>
        <IconButton name="chevron-back" label="Back" color="#fff" onPress={() => router.back()} />
        <View style={{ alignItems: 'center', gap: 6, paddingBottom: 16 }}>
          <Monogram org={org} size={64} inverted />
          <Text style={s.name}>{org.name}</Text>
          <Text style={s.full}>{org.fullName}</Text>
          <Button
            title={following ? 'Following' : 'Follow'} variant={following ? 'ghost' : 'yellow'} icon={following ? 'checkmark' : 'add'}
            onPress={() => toggleFollow(org.id)} style={{ marginTop: 6, paddingHorizontal: 28, backgroundColor: following ? '#fff' : C.yellow }}
          />
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <Segmented options={TABS} value={tab} onChange={setTab} />
        <View style={{ height: 14 }} />
        {tab === 'Posts' && (posts.length === 0 ? <Empty text="Nothing posted yet." /> : posts.map((a, i) => (
          <FadeIn key={a.id} index={i}><AnnouncementRow a={a} org={org} onPress={() => openAnnouncement(a.id)} /></FadeIn>
        )))}
        {tab === 'Events' && (
          <>
            <View style={{ alignItems: 'flex-end' }}><LinkButton title={past ? 'Hide past events' : 'Show past events'} onPress={() => setPast((p) => !p)} /></View>
            {evs.length === 0 ? <Empty text="Nothing posted yet." /> : evs.map((e, i) => (
              <FadeIn key={e.id} index={i}><EventRow e={e} org={org} mode="date" next={e.id === nextId} onPress={() => openEvent(e.id)} /></FadeIn>
            ))}
          </>
        )}
        {tab === 'About' && (
          <View style={s.about}>
            <Text style={{ color: C.text, lineHeight: 22 }}>{org.description}</Text>
            {([['Adviser', org.adviser], ['President', org.president], ['Office', org.office]] as const).map(([k, v]) => (
              <View key={k} style={s.kv}><Text style={s.k}>{k}</Text><Text style={s.v}>{v}</Text></View>
            ))}
            <Pressable accessibilityRole="link" onPress={() => Linking.openURL(org.facebook)} style={[s.kv, { minHeight: 48 }]}>
              <Ionicons name="logo-facebook" size={20} color={C.navy2} />
              <Text style={{ color: C.navy2, fontWeight: '700' }}>Facebook page</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  head: { backgroundColor: C.navy, paddingHorizontal: 8 },
  name: { color: '#fff', fontSize: 24, fontWeight: '900' },
  full: { color: '#C7D2E5' },
  about: { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 16, gap: 10 },
  kv: { flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'flex-start' },
  k: { width: 90, color: C.muted, fontWeight: '700' },
  v: { color: C.text, flex: 1 },
});
