import React, { useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { C, CARD, ICON, MIN_TAP, PRESSED, R, SERIF, SP, TYPE } from '../theme';
import { isLive, useStore } from '../store';
import { Eyebrow, Empty, FadeIn, Gate, Pill, Screen, Tag } from '../ui';
import { MenuSheet, MenuItem } from '../MenuSheet';
import { openAnnouncement, openEvent } from '../nav';
import { Announcement, EventItem } from '../types';
import { fmtShort, fmtStamp, fmtTime } from '../date';
import { ScrollView } from 'react-native';
import { AppHeader, HeaderIconButton } from '../AppHeader';

type Item = { kind: 'announcement'; a: Announcement; at: string } | { kind: 'event'; e: EventItem; at: string };
type St = 'Published' | 'Scheduled' | 'Draft';
const FILTERS = ['All', 'Published', 'Scheduled', 'Drafts'] as const;

function statusOf(it: Item): { st: St; note?: string } {
  if (it.kind === 'event') return { st: it.e.status === 'draft' ? 'Draft' : 'Published' };
  const a = it.a;
  if (a.status === 'draft') return { st: 'Draft' };
  if (a.status === 'scheduled' && !isLive(a)) return { st: 'Scheduled', note: `Goes live ${fmtStamp(a.publishAt!)}` };
  return { st: 'Published' };
}

export default function OfficerHome() {
  const { officer, announcements, events, orgById, saveAnnouncement, saveEvent, deleteAnnouncement, deleteEvent, refresh } = useStore();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');
  const [menu, setMenu] = useState<Item | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const org = orgById(officer!.orgId);

  // officers only see their own group's posts here
  const items: Item[] = [
    ...announcements.filter((a) => a.orgId === org.id).map((a): Item => ({ kind: 'announcement', a, at: a.createdAt })),
    ...events.filter((e) => e.orgId === org.id).map((e): Item => ({ kind: 'event', e, at: e.createdAt })),
  ].sort((x, y) => y.at.localeCompare(x.at));
  const shown = items.filter((it) => {
    const { st } = statusOf(it);
    return filter === 'All' || (filter === 'Drafts' ? st === 'Draft' : st === filter);
  });

  const menuItems = (it: Item): MenuItem[] => {
    const id = it.kind === 'announcement' ? it.a.id : it.e.id;
    const out: MenuItem[] = [{
      label: 'Edit',
      onPress: () => router.push({ pathname: it.kind === 'announcement' ? '/new-announcement' : '/new-event', params: { id } }),
    }];
    if (statusOf(it).st === 'Published') {
      out.push({
        label: 'Unpublish',
        onPress: () => it.kind === 'announcement'
          ? saveAnnouncement({ ...it.a, status: 'draft', pinned: false, publishAt: undefined }, 'Moved to drafts.')
          : saveEvent({ ...it.e, status: 'draft' }, undefined, 'Moved to drafts.'),
      });
    }
    out.push({
      label: 'Delete', danger: true,
      onPress: () => Alert.alert('Delete this post?', 'This cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => (it.kind === 'announcement' ? deleteAnnouncement(id) : deleteEvent(id)) },
      ]),
    });
    return out;
  };

  const header = (
    <View>
      <Eyebrow>Your posts</Eyebrow>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 10, marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20 }}>
        {FILTERS.map((f) => <Pill key={f} label={f} active={f === filter} onPress={() => setFilter(f)} />)}
      </ScrollView>
    </View>
  );

  return (
    <Screen edges={[]}>
      <AppHeader
        right={<View style={s.chip}><Ionicons name="person-circle-outline" size={ICON.sm} color={C.navy} /><Text style={s.chipT}>{org.name}</Text></View>}
      />
      <Gate>
        <FlatList
          data={shown} keyExtractor={(it) => (it.kind === 'announcement' ? it.a.id : it.e.id)}
          contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await refresh(); setRefreshing(false); }} tintColor={C.navy} />}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <Empty
              icon="create-outline"
              text={filter === 'All' ? 'Nothing here yet. Tap + below to post an announcement or event.' : filter === 'Drafts' ? 'No drafts.' : `No ${filter.toLowerCase()} posts.`}
            />
          }
          renderItem={({ item, index }) => {
            const { st, note } = statusOf(item);
            const title = item.kind === 'announcement' ? item.a.title : item.e.title;
            const sub = item.kind === 'event' ? `${fmtShort(item.e.date)} · ${fmtTime(item.e.start)}` : note;
            return (
              <FadeIn index={index}>
                <Pressable
                  accessibilityRole="button" accessibilityLabel={`${title}, ${st}`} style={({ pressed }) => [s.post, pressed && PRESSED]}
                  onPress={() => (item.kind === 'announcement' ? openAnnouncement(item.a.id) : openEvent(item.e.id))}
                >
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={{ flexDirection: 'row', gap: SP.sm, alignItems: 'center' }}>
                      <Ionicons name={item.kind === 'announcement' ? 'megaphone-outline' : 'calendar-outline'} size={ICON.md} color={C.navy2} />
                      <Tag label={st.toUpperCase()} tone={st === 'Published' ? 'green' : st === 'Scheduled' ? 'yellow' : 'gray'} />
                    </View>
                    <Text style={s.title}>{title}</Text>
                    {sub ? <Text style={s.sub}>{sub}</Text> : null}
                  </View>
                  <Pressable accessibilityRole="button" accessibilityLabel="Post options" hitSlop={4} onPress={() => setMenu(item)} style={({ pressed }) => [s.more, pressed && PRESSED]}>
                    <Ionicons name="ellipsis-horizontal" size={ICON.lg} color={C.muted} />
                  </Pressable>
                </Pressable>
              </FadeIn>
            );
          }}
        />
      </Gate>
      <MenuSheet visible={!!menu} onClose={() => setMenu(null)} items={menu ? menuItems(menu) : []} />
    </Screen>
  );
}

const s = StyleSheet.create({
  chip: { flexDirection: 'row', gap: SP.sm, alignItems: 'center', backgroundColor: C.soft, borderWidth: 1, borderColor: C.border, paddingHorizontal: SP.md, minHeight: 40, borderRadius: R.pill },
  chipT: { fontWeight: '600', color: C.navy },
  post: { ...CARD, padding: SP.lg, marginBottom: SP.md, flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: TYPE.title, fontWeight: '700', color: C.text, fontFamily: SERIF },
  sub: { color: C.muted, fontSize: TYPE.caption },
  more: { width: MIN_TAP, height: MIN_TAP, alignItems: 'center', justifyContent: 'center' },
});
