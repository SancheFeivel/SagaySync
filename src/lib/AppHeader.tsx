import React, { ReactNode, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, MIN_TAP } from './theme';

type Props = { eyebrow: string; right?: ReactNode };

/** Navy header with soft geometric depth. Extends under the status bar. */
export function AppHeader({ eyebrow, right }: Props) {
  const insets = useSafeAreaInsets();

  // light status-bar icons only while this screen is focused
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
      return () => setStatusBarStyle('dark');
    }, []),
  );

  return (
    <View style={[s.wrap, { paddingTop: insets.top + 10 }]}>
      {/* decoration: kept low-contrast so it adds depth, not noise */}
      <View pointerEvents="none" style={s.ringBig} />
      <View pointerEvents="none" style={s.ringSmall} />
      <View pointerEvents="none" style={s.dot} />

      <View style={s.row}>
        <View>
          <Text style={s.eyebrow}>{eyebrow}</Text>
          <Text style={s.wordmark}>
            Sagay<Text style={{ color: C.yellow }}>Sync</Text>
          </Text>
        </View>
        {right}
      </View>
      <View style={s.accent} />
    </View>
  );
}

export function HeaderIconButton({ name, label, onPress }: { name: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={s.iconBtn}>
      <Ionicons name={name} size={22} color="#fff" />
    </Pressable>
  );
}

const s = StyleSheet.create({
  wrap: {
    backgroundColor: C.navy,
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { color: '#9FB3D1', fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  wordmark: { color: '#fff', fontSize: 30, fontWeight: '900', letterSpacing: -0.5, marginTop: 2 },
  iconBtn: {
    width: MIN_TAP, height: MIN_TAP, borderRadius: MIN_TAP / 2,
    backgroundColor: 'rgba(255,255,255,0.10)', alignItems: 'center', justifyContent: 'center',
  },
  accent: { width: 28, height: 3, borderRadius: 2, backgroundColor: C.yellow, marginTop: 12 },
  ringBig: {
    position: 'absolute', top: -70, right: -50, width: 210, height: 210, borderRadius: 105,
    borderWidth: 28, borderColor: 'rgba(255,255,255,0.045)',
  },
  ringSmall: {
    position: 'absolute', bottom: -34, right: 70, width: 90, height: 90, borderRadius: 45,
    borderWidth: 2, borderColor: 'rgba(255,199,44,0.22)',
  },
  dot: { position: 'absolute', top: 26, right: 96, width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,199,44,0.55)' },
});