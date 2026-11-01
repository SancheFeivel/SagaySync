import React, { useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { C } from '../lib/theme';
import { repo } from '../lib/repo';
import { Button, Input, Screen, TopBar } from '../lib/ui';

// Provisional design: Forgot-password was listed as "not designed yet".
export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');
  const send = async () => {
    setErr('');
    try { await repo.sendReset(email.trim()); setSent(true); } catch { setErr('Something went wrong. Try again.'); }
  };
  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar title="Reset password" />
      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        {sent ? (
          <Text style={{ color: C.text, fontSize: 16, lineHeight: 24 }}>
            If that email belongs to an officer account, a reset link is on its way. Check your inbox.
          </Text>
        ) : (
          <>
            <Text style={{ color: C.muted, marginBottom: 16 }}>Enter your officer email. We’ll send a link to reset your password.</Text>
            <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" error={err} />
            <Button title="Send reset link" disabled={!email.includes('@')} onPress={send} />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
