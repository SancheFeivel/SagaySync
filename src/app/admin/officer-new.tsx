import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { C, FIELD, MIN_TAP, PAD, PRESSED, SP, TYPE } from '../../lib/theme';
import { useStore } from '../../lib/store';
import { Button, Empty, Input, Label, Screen, TopBar } from '../../lib/ui';
import { MenuSheet } from '../../lib/MenuSheet';
import { OfflineError, repo } from '../../lib/repo';

// No look-alike characters (0/O, 1/l/I), so the password survives being read aloud or copied by hand.
const ALPHABET = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
const tempPassword = () =>
  Array.from({ length: 10 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');

type Errors = { email?: string; pw?: string; form?: string };

/** Admin: makes a login for a new officer and ties it to a group, without signing the admin out. */
export default function OfficerNew() {
  const { admin, orgs, orgById, showToast } = useStore();
  const [email, setEmail] = useState('');
  const [orgId, setOrgId] = useState<string | undefined>(undefined);
  const [pw, setPw] = useState(tempPassword);
  const [show, setShow] = useState(true);
  const [pick, setPick] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<Errors>({});

  if (!admin) {
    return <Screen edges={['top', 'bottom']}><TopBar title="New officer" icon="close" /><Empty icon="lock-closed-outline" text="Only school admins can open this." /></Screen>;
  }

  const addr = email.trim().toLowerCase();
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr);
  const ready = emailOk && !!orgId && pw.length >= 8 && !busy;

  const create = async () => {
    if (!orgId) return;
    setBusy(true);
    setErr({});
    try {
      await repo.createOfficer(addr, pw, orgId);
      showToast('Officer added.');
      Alert.alert(
        'Officer added',
        `Share this login with them:\n\nEmail: ${addr}\nPassword: ${pw}\nGroup: ${orgById(orgId).name}\n\nThey can set their own password with “Forgot password?” on the login screen.`,
        [{ text: 'Done', onPress: () => router.back() }],
      );
    } catch (e: any) {
      const code = e?.code as string | undefined;
      if (code === 'auth/email-already-in-use') {
        setErr({ email: 'This email already has a login. If they’re in the officers list, switch their access back on there. If you removed them, delete the old login in Firebase Console › Authentication first.' });
      } else if (code === 'auth/invalid-email') {
        setErr({ email: 'That email doesn’t look right.' });
      } else if (code === 'auth/weak-password') {
        setErr({ pw: 'Use a longer password.' });
      } else if (code === 'link-failed') {
        setErr({ form: `The login for ${addr} was made but couldn’t be linked to the group. Check that the latest Firestore rules are deployed, delete ${addr} in Firebase Console › Authentication, then try again.` });
      } else if (e instanceof OfflineError) {
        setErr({ form: 'No connection. Nothing was created. Try again.' });
      } else {
        setErr({ form: 'Something went wrong. Nothing was created. Try again.' });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar title="New officer" icon="close" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: PAD, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
          <Input
            label="Email" value={email} onChangeText={(t) => { setEmail(t); setErr({}); }} error={err.email}
            autoCapitalize="none" keyboardType="email-address" autoComplete="off" placeholder="officer@example.com"
          />

          <Label>Group</Label>
          <Pressable
            accessibilityRole="button" onPress={() => setPick(true)}
            style={({ pressed }) => [{ ...FIELD, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SP.lg }, pressed && PRESSED]}
          >
            <Text style={{ fontSize: TYPE.body, color: orgId ? C.text : C.muted }}>{orgId ? orgById(orgId).name : 'Choose the group they post for'}</Text>
            <Ionicons name="chevron-down" size={20} color={C.muted} />
          </Pressable>

          <Input
            label="Temporary password" value={pw} onChangeText={(t) => { setPw(t); setErr({}); }} error={err.pw}
            secureTextEntry={!show} autoCapitalize="none" autoComplete="off"
            right={
              <Pressable
                accessibilityRole="button" accessibilityLabel={show ? 'Hide password' : 'Show password'} onPress={() => setShow((v) => !v)}
                style={{ minHeight: MIN_TAP, minWidth: MIN_TAP, paddingHorizontal: SP.md, justifyContent: 'center' }}
              >
                <Text style={{ color: C.navy2, fontWeight: '700' }}>{show ? 'Hide' : 'Show'}</Text>
              </Pressable>
            }
          />
          <Text style={{ color: C.muted, fontSize: TYPE.caption, marginTop: -SP.sm, marginBottom: SP.lg }}>
            At least 8 characters. You’ll see it once more after saving so you can pass it on.
          </Text>

          {err.form ? <Text style={{ color: C.danger, marginBottom: SP.md }}>{err.form}</Text> : null}
          <Button title={busy ? 'Creating…' : 'Create officer login'} disabled={!ready} onPress={create} />
        </ScrollView>
      </KeyboardAvoidingView>
      <MenuSheet
        visible={pick} onClose={() => setPick(false)} title="Which group do they post for?"
        items={orgs.map((g) => ({ label: g.name, onPress: () => setOrgId(g.id) }))}
      />
    </Screen>
  );
}
