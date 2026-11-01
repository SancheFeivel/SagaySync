import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { C } from './theme';
import { MenuSheet } from './MenuSheet';

/** Yellow "+" in the middle of the tab bar. Officers only. */
export function PlusButton() {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Pressable
        accessibilityRole="button" accessibilityLabel="Create new post" onPress={() => setOpen(true)}
        style={{ marginTop: -14, width: 56, height: 56, borderRadius: 28, backgroundColor: C.yellow, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } }}
      >
        <Ionicons name="add" size={32} color={C.navy} />
      </Pressable>
      <MenuSheet
        visible={open} onClose={() => setOpen(false)} title="Create new"
        items={[
          { label: 'New announcement', onPress: () => router.push('/new-announcement') },
          { label: 'New event', onPress: () => router.push('/new-event') },
        ]}
      />
    </View>
  );
}
