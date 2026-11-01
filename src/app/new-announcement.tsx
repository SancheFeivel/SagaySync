import React, { useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { C, MIN_TAP } from '../lib/theme';
import { useStore } from '../lib/store';
import { Button, Input, Pill, Screen, Segmented, TopBar } from '../lib/ui';
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
  const [photo, setPhoto] = useState<string | undefined>(existing?.photo);
  const [eventId, setEventId] = useState<string | undefined>(existing?.eventId);
  const [pinned, setPinned] = useState(existing?.pinned ?? false);
  const [mode, setMode] = useState<'Now' | 'Later'>(existing?.status === 'scheduled' ? 'Later' : 'Now');
  const [when, setWhen] = useState<Date | null>(existing?.publishAt ? new Date(existing.publishAt) : null);
  const [pickEvent, setPickEvent] = useState(false);
  const [err, setErr] = useState('');

  const snap = () => JSON.stringify([title, body, category, photo, eventId, pinned, mode, when?.toISOString()]);
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
      title: title.trim(), body: body.trim(), category, photo, eventId, pinned,
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

  const addPhoto = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    // TODO Firebase: upload r.assets[0].uri to Storage and save the download URL instead of the local path
    if (!r.canceled) setPhoto(r.assets[0].uri);
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar title={existing ? 'Edit announcement' : 'New announcement'} icon="close" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
          <Input label="Title" value={title} onChangeText={setTitle} placeholder="What’s the announcement?" />
          <Input label="Details" multiline value={body} onChangeText={setBody} placeholder="Add the details students need" />

          <Text style={{ fontWeight: '700', color: C.text, marginBottom: 8 }}>Category</Text>
          <View style={{ flexDirection: 'row', marginBottom: 16 }}>
            {CATS.map((c) => <Pill key={c} label={c} active={c === category} onPress={() => setCategory(c)} />)}
          </View>

          <Text style={{ fontWeight: '700', color: C.text, marginBottom: 8 }}>Photo</Text>
          {photo ? (
            <View style={{ marginBottom: 16 }}>
              <Image source={{ uri: photo }} style={{ width: '100%', height: 180, borderRadius: 12 }} />
              <Button title="Remove photo" variant="ghost" onPress={() => setPhoto(undefined)} style={{ marginTop: 8 }} />
            </View>
          ) : <Button title="Add photo" variant="ghost" icon="image-outline" onPress={addPhoto} style={{ marginBottom: 16 }} />}

          <Text style={{ fontWeight: '700', color: C.text, marginBottom: 8 }}>Linked event</Text>
          <Pressable accessibilityRole="button" onPress={() => setPickEvent(true)} style={{ minHeight: MIN_TAP + 4, borderWidth: 1, borderColor: C.border, borderRadius: 12, backgroundColor: '#fff', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text style={{ fontSize: 16, color: linked ? C.text : C.muted }}>{linked ? `${linked.title} · ${fmtShort(linked.date)}` : 'Link an event (optional)'}</Text>
            <Ionicons name="link-outline" size={20} color={C.muted} />
          </Pressable>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: MIN_TAP, marginBottom: 4 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: C.text }}>Pin to top</Text>
              {pinned && currentPin ? <Text style={{ color: C.muted, fontSize: 12 }}>Replaces your current pinned post: “{currentPin.title}”</Text> : null}
            </View>
            <Switch value={pinned} onValueChange={setPinned} trackColor={{ true: C.navy }} thumbColor={C.yellow} />
          </View>

          <Text style={{ fontWeight: '700', color: C.text, marginVertical: 8 }}>Publish</Text>
          {canSchedule ? <Segmented options={['Now', 'Later'] as const} value={mode} onChange={(m) => { setMode(m); setErr(''); }} /> : <Text style={{ color: C.muted }}>Now (already published)</Text>}
          {mode === 'Later' ? (
            <View style={{ marginTop: 12 }}>
              <DateTimeField label="Go live on" mode="datetime" value={when} onChange={(d) => { setWhen(d); setErr(''); }} error={err} />
            </View>
          ) : null}

          <View style={{ gap: 10, marginTop: 20 }}>
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
