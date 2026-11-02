import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { C, MIN_TAP, PAD, SP } from '../lib/theme';
import { useStore } from '../lib/store';
import { Button, Input, LinkButton, PageTitle, Screen, TopBar } from '../lib/ui';

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
        <ScrollView contentContainerStyle={{ padding: PAD }} keyboardShouldPersistTaps="handled">
          <PageTitle style={{ marginBottom: SP.xl }}>Officer login</PageTitle>
          <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" placeholder="you@example.com" />
          <Input
            label="Password" value={pw} onChangeText={setPw} secureTextEntry={!show} autoCapitalize="none" placeholder="Password" error={err}
            right={
              <Pressable
                accessibilityRole="button" accessibilityLabel={show ? 'Hide password' : 'Show password'} onPress={() => setShow((v) => !v)}
                style={{ minHeight: MIN_TAP, minWidth: MIN_TAP, paddingHorizontal: SP.md, justifyContent: 'center' }}
              >
                <Text style={{ color: C.navy2, fontWeight: '700' }}>{show ? 'Hide' : 'Show'}</Text>
              </Pressable>
            }
          />
          <Button title={busy ? 'Logging in…' : 'Log in'} disabled={!ready || busy} onPress={submit} />
          <View style={{ alignItems: 'center', marginTop: SP.sm }}>
            <LinkButton title="Forgot password?" onPress={() => router.push('/forgot-password')} />
            <LinkButton title="Continue as guest" onPress={() => router.replace('/')} />
          </View>
          <Text style={{ color: C.muted, textAlign: 'center', marginTop: SP.lg, fontSize: 12 }}>
            Accounts are created for authorized officers only. There is no sign-up.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
