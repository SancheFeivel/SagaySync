import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, ICON, MIN_TAP, PRESSED, SERIF, SHADOW, TYPE } from './theme';

type Props = { right?: ReactNode };

/** Light top bar: serif wordmark, school name underneath, optional action on the right. */
export function AppHeader({ right }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.wrap, { paddingTop: insets.top + 12 }]}>
      <View>
        <Text style={s.wordmark}>Sagay<Text style={{ color: C.navy2 }}>Sync</Text></Text>
        <Text style={s.school}>Sagay National High School</Text>
      </View>
      {right}
    </View>
  );
}

export function HeaderIconButton({ name, label, onPress }: { name: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [s.iconBtn, pressed && PRESSED]}>
      <Ionicons name={name} size={ICON.lg} color={C.navy} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  wrap: {
    backgroundColor: '#fff',
    ...SHADOW,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  wordmark: { color: C.navy, fontSize: TYPE.h3, fontWeight: '700', fontFamily: SERIF, letterSpacing: -0.3 },
  school: { color: C.muted, fontSize: TYPE.caption, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 1 },
  iconBtn: { width: MIN_TAP, height: MIN_TAP, borderRadius: MIN_TAP / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: C.soft },
});
