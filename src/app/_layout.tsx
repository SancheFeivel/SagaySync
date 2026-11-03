import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StoreProvider } from '../lib/store';
import { Toast } from '../lib/ui';
import { C } from '../lib/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="new-announcement" options={{ presentation: 'modal' }} />
          <Stack.Screen name="new-event" options={{ presentation: 'modal' }} />
          <Stack.Screen name="feedback" options={{ presentation: 'modal' }} />
          <Stack.Screen name="admin/group-edit" options={{ presentation: 'modal' }} />
          <Stack.Screen name="admin/officer-new" options={{ presentation: 'modal' }} />
        </Stack>
        <Toast />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
