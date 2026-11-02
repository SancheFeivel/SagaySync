import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { C, MIN_TAP, PAD } from '../lib/theme';
import { repo } from '../lib/repo';
import { useStore } from '../lib/store';
import { Button, Input, Label, Screen, TopBar } from '../lib/ui';

// Open to guests. Feeds the usability evaluation.
export default function Feedback() {
  const { showToast } = useStore();
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const send = async () => {
    setBusy(true); setErr('');
    try { await repo.sendFeedback(rating, text.trim()); showToast('Thanks for the feedback!'); router.back(); }
    catch { setErr('Something went wrong. Try again.'); }
    finally { setBusy(false); }
  };
  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar title="Send feedback" icon="close" />
      <ScrollView contentContainerStyle={{ padding: PAD }} keyboardShouldPersistTaps="handled">
        <Label>How easy was SagaySync to use?</Label>
        <View style={{ flexDirection: 'row', marginBottom: 20 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} accessibilityRole="button" accessibilityLabel={`${n} of 5`} onPress={() => setRating(n)} style={{ width: MIN_TAP + 8, height: MIN_TAP + 8, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={n <= rating ? 'star' : 'star-outline'} size={32} color={n <= rating ? C.yellow : C.muted} />
            </Pressable>
          ))}
        </View>
        <Input label="Comments (optional)" multiline value={text} onChangeText={setText} placeholder="What worked? What was confusing?" error={err} />
        <Button title={busy ? 'Sending…' : 'Send'} disabled={rating === 0 || busy} onPress={send} />
      </ScrollView>
    </Screen>
  );
}
