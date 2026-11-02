import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { PAD } from '../lib/theme';
import { useStore } from '../lib/store';
import { Button, Input, Label, Screen, Segmented, SwitchRow, TopBar } from '../lib/ui';
import { DateTimeField } from '../lib/DateTimeField';
import { useUnsavedGuard } from '../lib/useUnsavedGuard';
import { fmtShort, fmtTime, parseDate, timeToDate, toDateStr, toTimeStr } from '../lib/date';
import { Announcement, Audience, EventItem, EventTag } from '../lib/types';

const AUD: Audience[] = ['All students', 'Members'];
const TAGS = ['Active', 'Postponed', 'Cancelled'] as const;
const tagOf = (t: (typeof TAGS)[number]): EventTag => (t === 'Active' ? 'none' : (t.toLowerCase() as EventTag));

export default function NewEvent() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { officer, events, saveEvent } = useStore();
  const existing = id ? events.find((e) => e.id === id) : undefined;

  const [title, setTitle] = useState(existing?.title ?? '');
  const [date, setDate] = useState<Date | null>(existing ? parseDate(existing.date) : null);
  const [start, setStart] = useState<Date | null>(existing ? timeToDate(existing.start) : null);
  const [end, setEnd] = useState<Date | null>(existing?.end ? timeToDate(existing.end) : null);
  const [venue, setVenue] = useState(existing?.venue ?? '');
  const [audience, setAudience] = useState<Audience>(existing?.audience ?? 'All students');
  const [body, setBody] = useState(existing?.body ?? '');
  const [alsoPost, setAlsoPost] = useState(false);
  const [tag, setTag] = useState<(typeof TAGS)[number]>(existing?.tag === 'cancelled' ? 'Cancelled' : existing?.tag === 'postponed' ? 'Postponed' : 'Active');

  const snap = () => JSON.stringify([title, date?.toISOString(), start?.toISOString(), end?.toISOString(), venue, audience, body, alsoPost, tag]);
  const initial = useRef(snap()).current;
  const dirty = snap() !== initial;

  // overlaps with other events are allowed; only end-before-start is blocked
  const endErr = start && end && toTimeStr(end) <= toTimeStr(start) ? 'End time must be after the start.' : '';
  const ready = title.trim() !== '' && !!date && !!start && !endErr;
  const canLink = !existing?.announcementId;

  const persist = async (asDraft: boolean) => {
    if (!officer || !date || !start || endErr) return false;
    const now = new Date().toISOString();
    const publishing = !asDraft;
    const linkedId = publishing && alsoPost && canLink ? `a_${Date.now()}` : existing?.announcementId;
    const e: EventItem = {
      id: existing?.id ?? `e_${Date.now()}`,
      orgId: officer.orgId,
      title: title.trim(), date: toDateStr(date), start: toTimeStr(start), end: end ? toTimeStr(end) : undefined,
      venue: venue.trim(), audience, body: body.trim(),
      status: asDraft ? 'draft' : 'published',
      tag: tagOf(tag),
      createdAt: existing?.createdAt ?? now,
      announcementId: linkedId,
    };
    // "Also post an announcement" creates a linked announcement in the feed
    const linked: Announcement | undefined = publishing && alsoPost && canLink ? {
      id: linkedId!, orgId: officer.orgId, title: e.title,
      body: `${fmtShort(e.date)} · ${fmtTime(e.start)}${e.venue ? ` · ${e.venue}` : ''}${e.body ? `\n\n${e.body}` : ''}`,
      category: 'Announcement', eventId: e.id, pinned: false, status: 'published', createdAt: now,
    } : undefined;
    return saveEvent(e, linked, asDraft ? 'Draft saved.' : existing ? 'Event updated.' : 'Event posted.');
  };

  const allow = useUnsavedGuard(dirty, () => persist(true), !existing || existing.status === 'draft');
  const finish = async (asDraft: boolean) => {
    if (await persist(asDraft)) { allow.current = true; router.back(); }
  };
  const draftable = title.trim() !== '' && !!date && !!start && !endErr; // drafts still need the 3 basics + valid end

  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar title={existing ? 'Edit event' : 'New event'} icon="close" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: PAD, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
          <Input label="Title" value={title} onChangeText={setTitle} placeholder="Event name" />
          <DateTimeField label="Date" mode="date" value={date} onChange={setDate} />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}><DateTimeField label="Start time" mode="time" value={start} onChange={setStart} /></View>
            <View style={{ flex: 1 }}><DateTimeField label="End time (optional)" mode="time" value={end} onChange={setEnd} error={endErr} /></View>
          </View>
          <Input label="Venue" value={venue} onChangeText={setVenue} placeholder="Where is it?" />

          <Label>Audience</Label>
          <View style={{ marginBottom: 16 }}><Segmented options={AUD} value={audience} onChange={setAudience} /></View>

          <Input label="Details" multiline value={body} onChangeText={setBody} placeholder="Anything students should know" />

          {existing ? (
            <>
              <Label>Status</Label>
              <View style={{ marginBottom: 16 }}><Segmented options={TAGS} value={tag} onChange={setTag} /></View>
            </>
          ) : null}

          {canLink ? <SwitchRow label="Also post an announcement" value={alsoPost} onChange={setAlsoPost} /> : null}

          <View style={{ gap: 12, marginTop: 16 }}>
            <Button title={existing && existing.status === 'published' ? 'Save changes' : 'Publish'} disabled={!ready} onPress={() => finish(false)} />
            {!existing || existing.status === 'draft' ? <Button title="Save draft" variant="ghost" disabled={!draftable} onPress={() => finish(true)} /> : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
