import React, { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, FIELD, ICON, PAD, PRESSED, SERIF } from '../lib/theme';
import { useStore } from '../lib/store';
import { Empty, IconButton, Monogram, Screen, SectionTitle } from '../lib/ui';
import { AnnouncementRow, EventRow } from '../lib/cards';
import { openAnnouncement, openEvent, openOrg } from '../lib/nav';
import { router } from 'expo-router';

// Provisional design: Search was listed as "not designed yet".
export default function Search() {
  const { feed, liveEvents, orgs, orgById } = useStore();
  const [q, setQ] = useState('');
  const t = q.trim().toLowerCase();
  const has = (...s: string[]) => s.some((x) => x.toLowerCase().includes(t));
  const ready = t.length >= 2;
  const a = ready ? feed.filter((x) => has(x.title, x.body)) : [];
  const e = ready ? liveEvents.filter((x) => has(x.title, x.body, x.venue)) : [];
  const o = ready ? orgs.filter((x) => has(x.name, x.fullName, x.description)) : [];
  const none = ready && !a.length && !e.length && !o.length;
  // Before the person types, show every group so there is something to tap.
  const groups = ready ? o : orgs;
  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: PAD }}>
        <IconButton name="chevron-back" label="Back" onPress={() => router.back()} />
        <View style={{ ...FIELD, flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 }}>
          <Ionicons name="search" size={ICON.md} color={C.muted} />
          <TextInput autoFocus value={q} onChangeText={setQ} placeholder="Search posts, events, groups" placeholderTextColor={C.muted} style={{ flex: 1, fontSize: 16, color: C.text }} returnKeyType="search" />
          {q ? <Pressable accessibilityLabel="Clear" onPress={() => setQ('')} hitSlop={12}><Ionicons name="close-circle" size={ICON.md} color={C.muted} /></Pressable> : null}
        </View>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: PAD }}>
        {none ? <Empty icon="search-outline" text={`No results for “${q.trim()}”.`} /> : null}
        {groups.length ? <SectionTitle>Groups</SectionTitle> : null}
        {groups.map((x) => (
          <Pressable key={x.id} accessibilityRole="button" onPress={() => openOrg(x.id)} style={({ pressed }) => [{ flexDirection: 'row', gap: 12, alignItems: 'center', minHeight: 56 }, pressed && PRESSED]}>
            <Monogram org={x} size={40} /><Text style={{ fontWeight: '700', color: C.text, fontFamily: SERIF, fontSize: 16 }}>{x.fullName}</Text>
          </Pressable>
        ))}
        {e.length ? <SectionTitle>Events</SectionTitle> : null}
        <View style={{ height: 8 }} />
        {e.map((x) => <EventRow key={x.id} e={x} org={orgById(x.orgId)} mode="date" onPress={() => openEvent(x.id)} />)}
        {a.length ? <SectionTitle>Announcements</SectionTitle> : null}
        <View style={{ height: 8 }} />
        {a.map((x) => <AnnouncementRow key={x.id} a={x} org={orgById(x.orgId)} onPress={() => openAnnouncement(x.id)} />)}
      </ScrollView>
    </Screen>
  );
}
