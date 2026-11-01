import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { C } from '../lib/theme';
import { Screen, TopBar } from '../lib/ui';

const FAQ = [
  ['Do I need an account?', 'No. Students can browse everything without logging in. Only officers need an account.'],
  ['How do I follow a group?', 'Open Organizations, pick a group, and tap Follow. This is saved on your phone.'],
  ['Why do I see a “new” badge?', 'A group has posted something you haven’t seen yet. It clears when you open the group.'],
  ['I’m an officer. How do I get an account?', 'Accounts are created by the school administrator. There is no self sign-up.'],
] as const;

export default function Info() {
  const { kind } = useLocalSearchParams<{ kind?: string }>();
  const help = kind === 'help';
  return (
    <Screen>
      <TopBar title={help ? 'Help & FAQ' : 'About'} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        {help ? FAQ.map(([q, a]) => (
          <View key={q} style={{ gap: 4 }}>
            <Text style={{ fontWeight: '800', color: C.text, fontSize: 16 }}>{q}</Text>
            <Text style={{ color: C.muted, lineHeight: 22 }}>{a}</Text>
          </View>
        )) : (
          <>
            <Text style={{ fontSize: 28, fontWeight: '900', color: C.navy }}>SagaySync</Text>
            <Text style={{ color: C.text, lineHeight: 24 }}>
              One place for announcements and events from the student organizations of Sagay National High School.
              This is a research prototype.
            </Text>
            <Text style={{ color: C.muted }}>Version 0.1 (prototype)</Text>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
