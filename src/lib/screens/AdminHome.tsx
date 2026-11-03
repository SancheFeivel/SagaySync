import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { C, CARD, ICON, MIN_TAP, PRESSED, R, SERIF, SP, TYPE } from '../theme';
import { isLive, useStore } from '../store';
import { Eyebrow, Empty, FadeIn, Gate, Pill, Screen, Tag } from '../ui';
import { MenuSheet, MenuItem } from '../MenuSheet';
import { openAnnouncement, openEvent } from '../nav';
import { Announcement, EventItem } from '../types';
import { fmtShort, fmtStamp, fmtTime } from '../date';
import { AppHeader } from '../AppHeader';
import { repo } from '../repo';

type Item = { kind: 'announcement'; a: Announcement; at: string } | { kind: 'event'; e: EventItem; at: string };
type St = 'Published' | 'Scheduled' | 'Draft';
const FILTERS = ['All', 'Published', 'Scheduled', 'Drafts'] as const;
const ALL_GROUPS = '';

function statusOf(it: Item): { st: St; note?: string } {
  if (it.kind === 'event') return { st: it.e.status === 'draft' ? 'Draft' : 'Published' };
  const a = it.a;
  if (a.status === 'draft') return { st: 'Draft' };
  if (a.status === 'scheduled' && !isLive(a)) return { st: 'Scheduled', note: `Goes live ${fmtStamp(a.publishAt!)}` };
  return { st: 'Published' };
}

type IconName = keyof typeof Ionicons.glyphMap;
function Tile({ icon, label, value, onPress }: { icon: IconName; label: string; value: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${label}, ${value}`} onPress={onPress} style={({ pressed }) => [s.tile, pressed && PRESSED]}>
      <View style={s.tileTop}>
        <Ionicons name={icon} size={ICON.md} color={C.navy2} />
        <Ionicons name="chevron-forward" size={ICON.sm} color={C.muted} />
      </View>
      <Text style={s.tileValue}>{value}</Text>
      <Text style={s.tileLabel}>{label}</Text>
    </Pressable>
  );
}

/** Home for school admins: every group's posts in one list, with moderation, plus shortcuts to groups and officers. */
export default function AdminHome() {
  const { announcements, events, orgs, orgById, saveAnnouncement, saveEvent, deleteAnnouncement, deleteEvent, refresh } = useStore();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');
  const [group, setGroup] = useState(ALL_GROUPS);
  const [menu, setMenu] = useState<Item | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [officerCount, setOfficerCount] = useState<number | null>(null);

  // Active officer count for the tile, refreshed whenever Home comes back into view.
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      repo.listOfficers()
        .then((list) => { if (alive) setOfficerCount(list.filter((o) => o.active).length); })
        .catch(() => {});
      return () => { alive = false; };
    }, []),
  );

  const items: Item[] = [
    ...announcements.map((a): Item => ({ kind: 'announcement', a, at: a.createdAt })),
    ...events.map((e): Item => ({ kind: 'event', e, at: e.createdAt })),
  ].sort((x, y) => y.at.localeCompare(x.at));
  const orgOf = (it: Item) => (it.kind === 'announcement' ? it.a.orgId : it.e.orgId);
  const shown = items.filter((it) => {
    if (group !== ALL_GROUPS && orgOf(it) !== group) return false;
    const { st } = statusOf(it);
    return filter === 'All' || (filter === 'Drafts' ? st === 'Draft' : st === filter);
  });

  const menuItems = (it: Item): MenuItem[] => {
    const id = it.kind === 'announcement' ? it.a.id : it.e.id;
    const { st } = statusOf(it);
    const out: MenuItem[] = [{
      label: 'Edit',
      onPress: () => router.push({ pathname: it.kind === 'announcement' ? '/new-announcement' : '/new-event', params: { id } }),
    }];
    if (it.kind === 'announcement' && st !== 'Draft') {
      const a = it.a;
      out.push({
        label: a.pinned ? 'Unpin' : 'Pin to top',
        onPress: () => saveAnnouncement({ ...a, pinned: !a.pinned }, a.pinned ? 'Unpinned.' : 'Pinned to top.'),
      });
    }
    if (st === 'Published') {
      out.push({
        label: 'Unpublish',
        onPress: () => it.kind === 'announcement'
          ? saveAnnouncement({ ...it.a, status: 'draft', pinned: false, publishAt: undefined }, 'Moved to drafts.')
          : saveEvent({ ...it.e, status: 'draft' }, undefined, 'Moved to drafts.'),
      });
    }
    out.push({
      label: 'Delete', danger: true,
      onPress: () => Alert.alert(`Delete this ${orgById(orgOf(it)).name} post?`, 'This cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => (it.kind === 'announcement' ? deleteAnnouncement(id) : deleteEvent(id)) },
      ]),
    });
    return out;
  };

  const header = (
    <View>
      <View style={s.tiles}>
        <Tile icon="people-outline" label="Groups" value={String(orgs.length)} onPress={() => router.push('/admin/groups')} />
        <Tile icon="key-outline" label="Active officers" value={officerCount == null ? '–' : String(officerCount)} onPress={() => router.push('/admin/officers')} />
      </View>
      <Eyebrow>All posts</Eyebrow>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.pillRow} contentContainerStyle={{ paddingHorizontal: 20 }}>
        {FILTERS.map((f) => <Pill key={f} label={f} active={f === filter} onPress={() => setFilter(f)} />)}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[s.pillRow, { marginTop: 0 }]} contentContainerStyle={{ paddingHorizontal: 20 }}>
        <Pill label="All groups" active={group === ALL_GROUPS} onPress={() => setGroup(ALL_GROUPS)} />
        {orgs.map((o) => <Pill key={o.id} label={o.name} active={o.id === group} onPress={() => setGroup(o.id)} />)}
      </ScrollView>
    </View>
  );

  return (
    <Screen edges={[]}>
      <AppHeader
        right={<View style={s.chip}><Ionicons name="shield-checkmark-outline" size={ICON.sm} color={C.navy} /><Text style={s.chipT}>Admin</Text></View>}
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
              text={filter === 'All' && group === ALL_GROUPS ? 'No posts yet. Tap + below to post for any group.' : 'Nothing matches these filters.'}
            />
          }
          renderItem={({ item, index }) => {
            const { st, note } = statusOf(item);
            const title = item.kind === 'announcement' ? item.a.title : item.e.title;
            const when = item.kind === 'event' ? `${fmtShort(item.e.date)} · ${fmtTime(item.e.start)}` : note;
            const sub = [orgById(orgOf(item)).name, when].filter(Boolean).join(' · ');
            const pinned = item.kind === 'announcement' && item.a.pinned && st !== 'Draft';
            return (
              <FadeIn index={index}>
                <Pressable
                  accessibilityRole="button" accessibilityLabel={`${title}, ${sub}, ${st}`} style={({ pressed }) => [s.post, pressed && PRESSED]}
                  onPress={() => (item.kind === 'announcement' ? openAnnouncement(item.a.id) : openEvent(item.e.id))}
                >
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={{ flexDirection: 'row', gap: SP.sm, alignItems: 'center' }}>
                      <Ionicons name={item.kind === 'announcement' ? 'megaphone-outline' : 'calendar-outline'} size={ICON.md} color={C.navy2} />
                      <Tag label={st.toUpperCase()} tone={st === 'Published' ? 'green' : st === 'Scheduled' ? 'yellow' : 'gray'} />
                      {pinned ? <Tag label="PINNED" tone="yellow" /> : null}
                    </View>
                    <Text style={s.title}>{title}</Text>
                    <Text style={s.sub}>{sub}</Text>
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
  tiles: { flexDirection: 'row', gap: SP.md, marginBottom: SP.xl },
  tile: { ...CARD, flex: 1, padding: SP.lg, minHeight: MIN_TAP * 2 },
  tileTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tileValue: { fontSize: TYPE.h2, fontWeight: '700', color: C.navy, fontFamily: SERIF, marginTop: SP.sm },
  tileLabel: { color: C.muted, fontSize: TYPE.small, fontWeight: '600' },
  pillRow: { marginVertical: 10, marginHorizontal: -20 },
  post: { ...CARD, padding: SP.lg, marginBottom: SP.md, flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: TYPE.title, fontWeight: '700', color: C.text, fontFamily: SERIF },
  sub: { color: C.muted, fontSize: TYPE.caption },
  more: { width: MIN_TAP, height: MIN_TAP, alignItems: 'center', justifyContent: 'center' },
});
