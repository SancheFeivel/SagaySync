import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { C, FIELD, PAD, PRESSED } from '../lib/theme';
import { useStore } from '../lib/store';
import { Button, Input, Label, Pill, Screen, Segmented, SwitchRow, TopBar } from '../lib/ui';
import { DateTimeField } from '../lib/DateTimeField';
import { MenuSheet } from '../lib/MenuSheet';
import { useUnsavedGuard } from '../lib/useUnsavedGuard';
import { fmtShort } from '../lib/date';
import { Announcement, Category } from '../lib/types';

const CATS: Category[] = ['Announcement', 'Reminder', 'Deadline'];

export default function NewAnnouncement() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { officer, announcements, events, saveAnnouncement } = useStore();
  const existing = id ? announcements.find((a) => a.id === id) : undefined;
  const canSchedule = !existing || existing.status !== 'published';

  const [title, setTitle] = useState(existing?.title ?? '');
  const [body, setBody] = useState(existing?.body ?? '');
  const [category, setCategory] = useState<Category>(existing?.category ?? 'Announcement');
  const [eventId, setEventId] = useState<string | undefined>(existing?.eventId);
  const [pinned, setPinned] = useState(existing?.pinned ?? false);
  const [mode, setMode] = useState<'Now' | 'Later'>(existing?.status === 'scheduled' ? 'Later' : 'Now');
  const [when, setWhen] = useState<Date | null>(existing?.publishAt ? new Date(existing.publishAt) : null);
  const [pickEvent, setPickEvent] = useState(false);
  const [err, setErr] = useState('');

  const snap = () => JSON.stringify([title, body, category, eventId, pinned, mode, when?.toISOString()]);
  const initial = useRef(snap()).current;
  const dirty = snap() !== initial;

  const myEvents = events.filter((e) => e.orgId === officer?.orgId && e.status === 'published');
  const linked = myEvents.find((e) => e.id === eventId);
  const currentPin = announcements.find((a) => a.orgId === officer?.orgId && a.pinned && a.status !== 'draft' && a.id !== existing?.id);
  const ready = title.trim() !== '' && body.trim() !== '' && (mode === 'Now' || !!when);

  const persist = async (asDraft: boolean) => {
    if (!officer) return false;
    if (!asDraft && mode === 'Later' && (!when || when.getTime() <= Date.now())) {
      setErr('Pick a date and time in the future.');
      return false;
    }
    const status = asDraft ? 'draft' : mode === 'Later' ? 'scheduled' : 'published';
    const a: Announcement = {
      id: existing?.id ?? `a_${Date.now()}`,
      orgId: officer.orgId,
      title: title.trim(), body: body.trim(), category, eventId, pinned,
      status,
      createdAt: existing?.status === 'published' && status === 'published' ? existing.createdAt : new Date().toISOString(),
      publishAt: status === 'scheduled' ? when!.toISOString() : undefined,
    };
    return saveAnnouncement(a, asDraft ? 'Draft saved.' : status === 'scheduled' ? 'Post scheduled.' : 'Announcement posted.');
  };

  const allow = useUnsavedGuard(dirty, () => persist(true), !existing || existing.status === 'draft');
  const finish = async (asDraft: boolean) => {
    if (await persist(asDraft)) { allow.current = true; router.back(); }
  };
  const draftable = title.trim() !== '' || body.trim() !== '';

  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar title={existing ? 'Edit announcement' : 'New announcement'} icon="close" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: PAD, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
          <Input label="Title" value={title} onChangeText={setTitle} placeholder="What’s the announcement?" />
          <Input label="Details" multiline value={body} onChangeText={setBody} placeholder="Add the details students need" />

          <Label>Category</Label>
          <View style={{ flexDirection: 'row', marginBottom: 16 }}>
            {CATS.map((c) => <Pill key={c} label={c} active={c === category} onPress={() => setCategory(c)} />)}
          </View>

          <Label>Linked event</Label>
          <Pressable accessibilityRole="button" onPress={() => setPickEvent(true)} style={({ pressed }) => [{ ...FIELD, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }, pressed && PRESSED]}>
            <Text style={{ fontSize: 16, color: linked ? C.text : C.muted }}>{linked ? `${linked.title} · ${fmtShort(linked.date)}` : 'Link an event (optional)'}</Text>
            <Ionicons name="link-outline" size={20} color={C.muted} />
          </Pressable>

          <SwitchRow
            label="Pin to top" value={pinned} onChange={setPinned}
            sub={pinned && currentPin ? `Replaces your current pinned post: “${currentPin.title}”` : undefined}
          />

          <View style={{ marginTop: 8 }}><Label>Publish</Label></View>
          {canSchedule ? <Segmented options={['Now', 'Later'] as const} value={mode} onChange={(m) => { setMode(m); setErr(''); }} /> : <Text style={{ color: C.muted }}>Now (already published)</Text>}
          {mode === 'Later' ? (
            <View style={{ marginTop: 12 }}>
              <DateTimeField label="Go live on" mode="datetime" value={when} onChange={(d) => { setWhen(d); setErr(''); }} error={err} />
            </View>
          ) : null}

          <View style={{ gap: 12, marginTop: 24 }}>
            <Button title={mode === 'Later' ? 'Schedule' : 'Post'} disabled={!ready} onPress={() => finish(false)} />
            {!existing || existing.status === 'draft' ? <Button title="Save draft" variant="ghost" disabled={!draftable} onPress={() => finish(true)} /> : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <MenuSheet
        visible={pickEvent} onClose={() => setPickEvent(false)} title="Link one of your events"
        items={[
          { label: 'None', onPress: () => setEventId(undefined) },
          ...myEvents.map((e) => ({ label: `${e.title} · ${fmtShort(e.date)}`, onPress: () => setEventId(e.id) })),
        ]}
      />
    </Screen>
  );
}
