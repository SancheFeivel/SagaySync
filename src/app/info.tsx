import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { C, PAD, SERIF } from '../lib/theme';
import { Card, PageTitle, Screen, TopBar } from '../lib/ui';

const FAQ = [
  ['Do I need an account?', 'No. Students can browse everything without logging in. Only officers need an account.'],
  ['How do I follow a group?', 'Open the Groups tab, pick a group, and tap Follow. This is saved on your phone.'],
  ['Why do I see a “new” badge?', 'A group has posted something you haven’t seen yet. It clears when you open the group.'],
  ['I’m an officer. How do I get an account?', 'Accounts are created by the school administrator. There is no self sign-up.'],
] as const;

export default function Info() {
  const { kind } = useLocalSearchParams<{ kind?: string }>();
  const help = kind === 'help';
  return (
    <Screen>
      <TopBar title={help ? 'Help & FAQ' : 'About'} />
      <ScrollView contentContainerStyle={{ padding: PAD, paddingTop: 8, gap: 12 }}>
        {help ? FAQ.map(([q, a]) => (
          <Card key={q} style={{ gap: 4 }}>
            <Text style={{ fontWeight: '700', color: C.text, fontSize: 18, fontFamily: SERIF }}>{q}</Text>
            <Text style={{ color: C.muted, lineHeight: 22 }}>{a}</Text>
          </Card>
        )) : (
          <>
            <PageTitle style={{ marginBottom: 0 }}>Sagay<Text style={{ color: C.yellow }}>Sync</Text></PageTitle>
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
