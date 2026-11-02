import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { C, EYEBROW, ICON, PRESSED, R, SERIF, SP, TYPE } from '../theme';
import { useStore } from '../store';
import { Eyebrow, Empty, FadeIn, Gate, LastUpdated, LinkButton, Pill, Screen } from '../ui';
import { AnnouncementRow, EventCard, EventTagView } from '../cards';
import { openAnnouncement, openEvent } from '../nav';
import { fmtFull, fmtHeaderDate, fmtRange } from '../date';
import { AppHeader, HeaderIconButton } from '../AppHeader';

const PAGE = 5;

/** One line of event info inside the pinned card. */
function PinRow({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={s.pinRow}>
      <Ionicons name={icon} size={16} color={C.navy2} />
      <Text style={s.pinRowT} numberOfLines={1}>{text}</Text>
    </View>
  );
}

export default function StudentHome() {
  const { feed, upcoming, liveEvents, orgs, orgById, follows, refresh } = useStore();
  const [filter, setFilter] = useState('all');
  const [count, setCount] = useState(PAGE);
  const [refreshing, setRefreshing] = useState(false);

  const f = filter === 'following' && follows.length === 0 ? 'all' : filter;
  const { width } = useWindowDimensions();
  const [pinIdx, setPinIdx] = useState(0);
  // One pin per org (enforced on save), newest first. Hidden when there are none.
  const pinned = useMemo(() => feed.filter((a) => a.pinned), [feed]);
  const PIN_GAP = 12;
  const pinW = pinned.length > 1 ? width - 40 - 28 : width - 40; // with several pins, the next card peeks in
  const list = useMemo(
    () => feed.filter((a) => !a.pinned && (f === 'all' || (f === 'following' ? follows.includes(a.orgId) : a.orgId === f))),
    [feed, f, follows],
  );
  const shown = list.slice(0, count);
  const nextIdx = upcoming.findIndex((e) => e.tag !== 'cancelled');

  const pick = (id: string) => { setFilter(id); setCount(PAGE); };
  const onRefresh = async () => { setRefreshing(true); await refresh(); setRefreshing(false); };

  const header = (
    <View>
      <Text style={s.dateLine}>{fmtHeaderDate()}</Text>
      {pinned.length > 0 ? (
        <View style={{ marginBottom: SP.xxl }}>
          <FlatList
            horizontal data={pinned} keyExtractor={(a) => a.id}
            showsHorizontalScrollIndicator={false}
            style={s.bleed} contentContainerStyle={s.bleedPad}
            snapToInterval={pinW + PIN_GAP} decelerationRate="fast" disableIntervalMomentum
            ItemSeparatorComponent={() => <View style={{ width: PIN_GAP }} />}
            onMomentumScrollEnd={(e) => setPinIdx(Math.round(e.nativeEvent.contentOffset.x / (pinW + PIN_GAP)))}
            renderItem={({ item }) => {
              // If the announcement is linked to an event, show that event's details right on the card.
              const ev = item.eventId ? liveEvents.find((e) => e.id === item.eventId) : undefined;
              return (
                <Pressable accessibilityRole="button" accessibilityLabel={`Pinned: ${item.title}, ${orgById(item.orgId).name}`} onPress={() => openAnnouncement(item.id)} style={({ pressed }) => [s.pinned, { width: pinW }, pressed && PRESSED]}>
                  <View pointerEvents="none" style={s.ring} />
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: SP.sm }}>
                    <Ionicons name="pin" size={ICON.sm} color={C.navy2} />
                    <Text style={[s.pinnedMeta, { flex: 1 }]} numberOfLines={1}>{orgById(item.orgId).name}{item.category !== 'Announcement' ? ` · ${item.category}` : ''}</Text>
                    {ev ? <EventTagView e={ev} /> : null}
                  </View>
                  <Text style={s.pinnedTitle} numberOfLines={3}>{item.title}</Text>
                  <Text style={s.pinnedBody} numberOfLines={ev ? 3 : 5}>{item.body}</Text>
                  {ev ? (
                    <View style={s.pinEvent}>
                      <PinRow icon="calendar-outline" text={fmtFull(ev.date)} />
                      <PinRow icon="time-outline" text={fmtRange(ev.start, ev.end)} />
                      {ev.venue ? <PinRow icon="location-outline" text={ev.venue} /> : null}
                      <PinRow icon="people-outline" text={ev.audience} />
                    </View>
                  ) : (
                    <View style={s.pinMore}>
                      <Text style={s.pinMoreT}>Read announcement</Text>
                      <Ionicons name="arrow-forward" size={16} color={C.navy2} />
                    </View>
                  )}
                </Pressable>
              );
            }}
          />
          {pinned.length > 1 ? (
            <View style={s.dots} accessibilityLabel={`Pinned ${Math.min(pinIdx, pinned.length - 1) + 1} of ${pinned.length}`}>
              {pinned.map((p, i) => <View key={p.id} style={[s.dot, i === Math.min(pinIdx, pinned.length - 1) && s.dotOn]} />)}
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={s.rowBetween}>
        <Eyebrow>Coming up</Eyebrow>
        <LinkButton title="See all" onPress={() => router.navigate('/calendar')} />
      </View>
      {upcoming.length === 0 ? <Empty icon="calendar-outline" text="No upcoming events." /> : (
        <FlatList
          horizontal showsHorizontalScrollIndicator={false} data={upcoming.slice(0, 6)} keyExtractor={(e) => e.id}
          style={s.bleed} contentContainerStyle={s.bleedPad}
          renderItem={({ item, index }) => (
            <EventCard e={item} org={orgById(item.orgId)} next={index === nextIdx} onPress={() => openEvent(item.id)} />
          )}
        />
      )}

      <Eyebrow style={{ marginTop: SP.xxl, marginBottom: SP.md }}>Latest announcements</Eyebrow>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[s.bleed, { marginBottom: SP.md }]} contentContainerStyle={s.bleedPad}>
        <Pill label="All" active={f === 'all'} onPress={() => pick('all')} />
        {follows.length > 0 ? <Pill label="Following" active={f === 'following'} onPress={() => pick('following')} /> : null}
        {orgs.map((o) => <Pill key={o.id} label={o.name} active={f === o.id} onPress={() => pick(o.id)} />)}
      </ScrollView>
    </View>
  );

  return (
    <Screen edges={[]}>
      <AppHeader
        right={<HeaderIconButton name="search" label="Search" onPress={() => router.push('/search')} />}
      />
      <LastUpdated />
      <Gate>
        <FlatList
          data={shown} keyExtractor={(a) => a.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.navy} />}
          ListHeaderComponent={header}
          renderItem={({ item, index }) => (
            <FadeIn index={index}>
              <AnnouncementRow a={item} org={orgById(item.orgId)} onPress={() => openAnnouncement(item.id)} />
            </FadeIn>
          )}
          onEndReached={() => count < list.length && setCount((c) => c + PAGE)}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            f === 'all' ? <Empty icon="megaphone-outline" text="No announcements yet." />
              : f === 'following' ? <Empty icon="people-outline" text="Nothing from the groups you follow yet." actionLabel="Browse groups" onAction={() => router.navigate('/organizations')} />
              : <Empty icon="megaphone-outline" text="Nothing posted yet." />
          }
          ListFooterComponent={list.length > 0 && shown.length >= list.length ? <Text style={s.caught}>You’re all caught up.</Text> : undefined}
        />
      </Gate>
    </Screen>
  );
}

const s = StyleSheet.create({
  // Horizontal rows sit inside the list's 20px padding; cancel it so they scroll edge to edge, then pad the content back.
  bleed: { marginHorizontal: -20 },
  bleedPad: { paddingHorizontal: 20 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: SP.sm, marginTop: SP.md },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.border },
  dotOn: { width: 18, backgroundColor: C.navy },
  pinned: { backgroundColor: C.soft, borderRadius: R.xl, padding: SP.xxl, gap: SP.md, overflow: 'hidden', borderWidth: 1, borderColor: C.border, minHeight: 200 },
  ring: { position: 'absolute', top: -50, right: -40, width: 150, height: 150, borderRadius: 75, borderWidth: 22, borderColor: 'rgba(245,162,20,0.2)' },
  // One quiet line so the pinned card is the first thing the eye lands on.
  dateLine: { ...EYEBROW, color: C.muted, marginBottom: 16 },
  pinnedMeta: { color: C.navy2, fontWeight: '700', fontSize: TYPE.caption },
  pinnedTitle: { color: C.navy, fontSize: TYPE.h2, lineHeight: 32, fontWeight: '700', fontFamily: SERIF, letterSpacing: -0.3 },
  pinnedBody: { color: C.muted, fontSize: TYPE.body, lineHeight: 24 },
  pinEvent: { marginTop: 'auto', paddingTop: SP.lg, gap: SP.sm, borderTopWidth: 1, borderTopColor: C.divider },
  pinMore: { flexDirection: 'row', alignItems: 'center', gap: SP.sm, marginTop: SP.sm },
  pinMoreT: { color: C.navy2, fontWeight: '700', fontSize: TYPE.small },
  pinRow: { flexDirection: 'row', alignItems: 'center', gap: SP.md },
  pinRowT: { color: C.text, fontSize: TYPE.small, fontWeight: '600', flex: 1 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  caught: { textAlign: 'center', color: C.muted, paddingVertical: SP.xl },
});
