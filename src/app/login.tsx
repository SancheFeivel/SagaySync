import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { C, MIN_TAP } from '../lib/theme';
import { useStore } from '../lib/store';
import { Button, Input, LinkButton, Screen, Tag, TopBar } from '../lib/ui';

export default function Login() {
  const { signIn } = useStore();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const ready = email.trim() !== '' && pw !== '';

  const submit = async () => {
    setBusy(true); setErr('');
    try {
      await signIn(email, pw);
      router.replace('/'); // lands on Officer Home
    } catch {
      setErr('Incorrect email or password'); // never says which one was wrong
    } finally { setBusy(false); }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar title="" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
          <Tag label="OFFICERS ONLY" tone="yellow" />
          <Text style={{ fontSize: 30, fontWeight: '900', color: C.navy, marginVertical: 12 }}>Officer login</Text>
          <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" placeholder="you@example.com" />
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontWeight: '700', color: C.text, marginBottom: 6 }}>Password</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: err ? C.danger : C.border, borderRadius: 12, backgroundColor: '#fff', minHeight: 48 }}>
              <TextInput value={pw} onChangeText={setPw} secureTextEntry={!show} autoCapitalize="none" placeholder="Password" placeholderTextColor={C.muted} style={{ flex: 1, paddingHorizontal: 14, fontSize: 16, color: C.text }} />
              <Pressable accessibilityRole="button" onPress={() => setShow((s) => !s)} style={{ minHeight: MIN_TAP, minWidth: MIN_TAP, paddingHorizontal: 12, justifyContent: 'center' }}>
                <Text style={{ color: C.navy2, fontWeight: '700' }}>{show ? 'Hide' : 'Show'}</Text>
              </Pressable>
            </View>
            {err ? <Text style={{ color: C.danger, marginTop: 6 }}>{err}</Text> : null}
          </View>
          <Button title={busy ? 'Logging in…' : 'Log in'} disabled={!ready || busy} onPress={submit} />
          <View style={{ alignItems: 'center', marginTop: 8 }}>
            <LinkButton title="Forgot password?" onPress={() => router.push('/forgot-password')} />
            <LinkButton title="Continue as guest" onPress={() => router.replace('/')} />
          </View>
          <Text style={{ color: C.muted, textAlign: 'center', marginTop: 16, fontSize: 12 }}>
            Accounts are created for authorized officers only. There is no sign-up.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
