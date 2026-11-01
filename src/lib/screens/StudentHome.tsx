import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { C } from '../theme';
import { useStore } from '../store';
import { Empty, FadeIn, Gate, IconButton, LastUpdated, LinkButton, Pill, Screen } from '../ui';
import { AnnouncementRow, EventCard } from '../cards';
import { openAnnouncement, openEvent } from '../nav';
import { fmtHeaderDate } from '../date';
import { AppHeader, HeaderIconButton } from '../AppHeader';

const PAGE = 5;

export default function StudentHome() {
  const { feed, upcoming, orgs, orgById, follows, refresh } = useStore();
  const [filter, setFilter] = useState('all');
  const [count, setCount] = useState(PAGE);
  const [refreshing, setRefreshing] = useState(false);

  const f = filter === 'following' && follows.length === 0 ? 'all' : filter;
  const pinned = feed.find((a) => a.pinned); // hidden when there is none
  const list = useMemo(
    () => feed.filter((a) => a !== pinned && (f === 'all' || (f === 'following' ? follows.includes(a.orgId) : a.orgId === f))),
    [feed, pinned, f, follows],
  );
  const shown = list.slice(0, count);
  const nextIdx = upcoming.findIndex((e) => e.tag !== 'cancelled');

  const pick = (id: string) => { setFilter(id); setCount(PAGE); };
  const onRefresh = async () => { setRefreshing(true); await refresh(); setRefreshing(false); };

  const header = (
    <View>
      {pinned ? (
        <Pressable accessibilityRole="button" onPress={() => openAnnouncement(pinned.id)} style={s.pinned}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="pin" size={14} color={C.yellow} />
            <Text style={s.pinnedMeta}>{orgById(pinned.orgId).name} · {pinned.category}</Text>
          </View>
          <Text style={s.pinnedTitle}>{pinned.title}</Text>
          <Text style={s.pinnedBody} numberOfLines={2}>{pinned.body}</Text>
        </Pressable>
      ) : null}

      <View style={s.rowBetween}>
        <Text style={s.section}>Coming up</Text>
        <LinkButton title="See all" onPress={() => router.navigate('/calendar')} />
      </View>
      {upcoming.length === 0 ? <Empty text="No upcoming events." /> : (
        <FlatList
          horizontal showsHorizontalScrollIndicator={false} data={upcoming.slice(0, 6)} keyExtractor={(e) => e.id}
          renderItem={({ item, index }) => (
            <EventCard e={item} org={orgById(item.orgId)} next={index === nextIdx} onPress={() => openEvent(item.id)} />
          )}
        />
      )}

      <Text style={[s.section, { marginTop: 18, marginBottom: 8 }]}>Latest</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        <Pill label="All" active={f === 'all'} onPress={() => pick('all')} />
        {follows.length > 0 ? <Pill label="Following" active={f === 'following'} onPress={() => pick('following')} /> : null}
        {orgs.map((o) => <Pill key={o.id} label={o.name} active={f === o.id} onPress={() => pick(o.id)} />)}
      </ScrollView>
    </View>
  );

  return (
    <Screen edges={[]}>
      <AppHeader
        eyebrow={fmtHeaderDate()}
        right={<HeaderIconButton name="search" label="Search" onPress={() => router.push('/search')} />}
      />
      <LastUpdated />
      <Gate>
        <FlatList
          data={shown} keyExtractor={(a) => a.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.navy} />}
          ListHeaderComponent={header}
          renderItem={({ item, index }) => (
            <FadeIn index={index}>
              <AnnouncementRow a={item} org={orgById(item.orgId)} onPress={() => openAnnouncement(item.id)} />
            </FadeIn>
          )}
          onEndReached={() => count < list.length && setCount((c) => c + PAGE)}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={<Empty text={f === 'all' ? 'No announcements yet.' : 'Nothing posted yet.'} />}
          ListFooterComponent={list.length > 0 && shown.length >= list.length ? <Text style={s.caught}>You’re all caught up.</Text> : null}
        />
      </Gate>
    </Screen>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8 },
  date: { color: C.muted, fontSize: 12, fontWeight: '600' },
  wordmark: { fontSize: 26, fontWeight: '900', color: C.navy },
  pinned: { backgroundColor: C.navy, borderRadius: 18, padding: 16, marginBottom: 18, gap: 6 },
  pinnedMeta: { color: C.yellow, fontWeight: '700', fontSize: 12 },
  pinnedTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  pinnedBody: { color: '#C7D2E5', lineHeight: 20 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  section: { fontSize: 18, fontWeight: '800', color: C.text },
  caught: { textAlign: 'center', color: C.muted, paddingVertical: 20 },
});
