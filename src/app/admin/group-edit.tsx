import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { C, PAD, SP, TYPE } from '../../lib/theme';
import { useStore } from '../../lib/store';
import { Button, Empty, Input, Screen, TopBar } from '../../lib/ui';
import { Org } from '../../lib/types';
import { OfflineError, repo } from '../../lib/repo';

const count = (n: number, one: string) => (n ? `${n} ${one}${n === 1 ? '' : 's'}` : '');
/** ['a', 'b', 'c'] -> "a, b and c" */
const joinAnd = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

/** "Math Club" -> "math-club". Must fit the group id pattern in firestore.rules. */
const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32);

/** Admin: add a group, or edit or remove one (`?id=`). The id is set once from the short name and never changes. */
export default function GroupEdit() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { admin, orgs, saveOrg, deleteOrg } = useStore();
  // Fixed when the screen opens, so the form doesn't flip to "New group" the moment a removal reloads the list.
  const [existing] = useState(() => (id ? orgs.find((o) => o.id === id) : undefined));

  const [name, setName] = useState(existing?.name ?? '');
  const [fullName, setFullName] = useState(existing?.fullName ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [adviser, setAdviser] = useState(existing?.adviser ?? '');
  const [president, setPresident] = useState(existing?.president ?? '');
  const [office, setOffice] = useState(existing?.office ?? '');
  const [facebook, setFacebook] = useState(existing?.facebook ?? '');
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState(false);

  if (!admin) {
    return <Screen edges={['top', 'bottom']}><TopBar title="Group" icon="close" /><Empty icon="lock-closed-outline" text="Only school admins can open this." /></Screen>;
  }

  const groupId = existing ? existing.id : slugify(name);
  const idErr = existing || !name.trim()
    ? ''
    : groupId.length < 2
      ? 'Use at least 2 letters or numbers.'
      : orgs.some((o) => o.id === groupId)
        ? 'A group with this name already exists.'
        : '';
  const fbErr = facebook.trim() && !/^https?:\/\//i.test(facebook.trim()) ? 'Start the link with https://' : '';
  const ready = name.trim() !== '' && !idErr && !fbErr && !busy && !removing;

  /** Shows what goes with the group (posts, events, officers), then removes it all if confirmed. */
  const remove = async () => {
    if (!existing) return;
    setRemoving(true);
    let usage: Awaited<ReturnType<typeof repo.orgUsage>>;
    try {
      usage = await repo.orgUsage(existing.id);
    } catch (e) {
      setRemoving(false);
      Alert.alert(e instanceof OfflineError ? 'No connection' : 'Something went wrong', 'Nothing was removed. Try again.');
      return;
    }
    setRemoving(false);
    const goes = [
      count(usage.announcements, 'announcement'),
      count(usage.events, 'event'),
      count(usage.officers, 'officer account'),
    ].filter(Boolean);
    Alert.alert(
      `Remove ${existing.name}?`,
      `${goes.length ? `Its ${joinAnd(goes)} will be deleted too. ` : ''}Students won’t see the group anymore and stop getting its alerts. This can’t be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive',
          onPress: async () => {
            setRemoving(true);
            const ok = await deleteOrg(existing.id);
            setRemoving(false);
            if (ok) router.back();
          },
        },
      ],
    );
  };

  const save = async () => {
    setBusy(true);
    const o: Org = {
      id: groupId,
      name: name.trim(), fullName: fullName.trim(), description: description.trim(),
      adviser: adviser.trim(), president: president.trim(), office: office.trim(), facebook: facebook.trim(),
    };
    const ok = await saveOrg(o, existing ? 'Group updated.' : 'Group added.');
    setBusy(false);
    if (ok) router.back();
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar title={existing ? `Edit ${existing.name}` : 'New group'} icon="close" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: PAD, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
          <Input label="Short name" value={name} onChangeText={setName} maxLength={40} placeholder="e.g. SSLG" error={idErr} />
          <Text style={{ color: C.muted, fontSize: TYPE.caption, marginTop: -SP.sm, marginBottom: SP.lg }}>
            {existing ? `Group ID: ${existing.id}` : `Group ID: ${groupId || '—'} (set once, can’t be changed later)`}
          </Text>
          <Input label="Full name" value={fullName} onChangeText={setFullName} maxLength={120} placeholder="e.g. Supreme Secondary Learner Government" />
          <Input label="About" multiline value={description} onChangeText={setDescription} maxLength={1000} placeholder="What the group does" />
          <Input label="Adviser" value={adviser} onChangeText={setAdviser} maxLength={100} placeholder="Teacher’s name" />
          <Input label="President" value={president} onChangeText={setPresident} maxLength={100} />
          <Input label="Office" value={office} onChangeText={setOffice} maxLength={100} placeholder="Room or building" />
          <Input
            label="Facebook page (optional)" value={facebook} onChangeText={setFacebook} maxLength={300}
            autoCapitalize="none" keyboardType="url" placeholder="https://facebook.com/…" error={fbErr}
          />
          <Button title={busy ? 'Saving…' : existing ? 'Save changes' : 'Add group'} disabled={!ready} onPress={save} style={{ marginTop: SP.sm }} />
          {existing ? (
            <Button
              title={removing ? 'Removing…' : 'Remove group'} variant="danger" icon="trash-outline"
              disabled={busy || removing} onPress={remove} style={{ marginTop: SP.md }}
            />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
