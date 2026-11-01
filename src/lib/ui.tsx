import React, { ReactNode, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo, Animated, Pressable, StyleProp, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, MIN_TAP } from './theme';
import { Org } from './types';
import { useStore } from './store';
import { fmtStamp } from './date';

type IconName = keyof typeof Ionicons.glyphMap;

/** Items fade in one after another. Skipped when the phone has reduced motion on. */
export function FadeIn({ index = 0, children }: { index?: number; children: ReactNode }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (!alive) return;
      if (reduce) v.setValue(1);
      else Animated.timing(v, { toValue: 1, duration: 280, delay: (index % 6) * 60, useNativeDriver: true }).start();
    });
    return () => { alive = false; };
  }, [v, index]);
  return (
    <Animated.View style={{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }}>
      {children}
    </Animated.View>
  );
}

export function Screen({ children, edges = ['top'] }: { children: ReactNode; edges?: readonly ('top' | 'bottom' | 'left' | 'right')[] }) {
  return <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={edges}>{children}</SafeAreaView>;
}

type BtnProps = {
  title: string; onPress: () => void; variant?: 'primary' | 'yellow' | 'ghost' | 'danger';
  disabled?: boolean; icon?: IconName; style?: StyleProp<ViewStyle>;
};
export function Button({ title, onPress, variant = 'primary', disabled, icon, style }: BtnProps) {
  const bg = variant === 'primary' ? C.navy : variant === 'yellow' ? C.yellow : variant === 'danger' ? C.danger : 'transparent';
  const fg = variant === 'yellow' || variant === 'ghost' ? C.navy : '#fff';
  return (
    <Pressable
      accessibilityRole="button" accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress}
      style={[s.btn, { backgroundColor: bg, borderColor: variant === 'ghost' ? C.border : bg, opacity: disabled ? 0.4 : 1 }, style]}
    >
      {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
      <Text style={[s.btnT, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

export function IconButton({ name, onPress, label, color = C.navy }: { name: IconName; onPress: () => void; label: string; color?: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={s.iconBtn} hitSlop={4}>
      <Ionicons name={name} size={24} color={color} />
    </Pressable>
  );
}

export function Pill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress} hitSlop={{ top: 4, bottom: 4 }}
      style={[s.pill, active && { backgroundColor: C.navy, borderColor: C.navy }]}
    >
      <Text style={[s.pillT, active && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

const TONES = {
  navy: { bg: C.navy, fg: '#fff' },
  yellow: { bg: C.yellow, fg: C.navy },
  red: { bg: '#FEE4E2', fg: C.danger },
  gray: { bg: '#EAECF0', fg: '#475467' },
  green: { bg: '#D1FADF', fg: '#027A48' },
};
export function Tag({ label, tone = 'gray' }: { label: string; tone?: keyof typeof TONES }) {
  return (
    <View style={[s.tag, { backgroundColor: TONES[tone].bg }]}>
      <Text style={[s.tagT, { color: TONES[tone].fg }]}>{label}</Text>
    </View>
  );
}

export const monogram = (name: string) => {
  const w = name.trim().split(/\s+/);
  return (w.length > 1 ? w[0][0] + w[1][0] : name.slice(0, 2)).toUpperCase();
};
export function Monogram({ org, size = 44, inverted }: { org: Org; size?: number; inverted?: boolean }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: inverted ? C.yellow : C.navy, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: inverted ? C.navy : C.yellow, fontWeight: '800', fontSize: size * 0.36 }}>{monogram(org.name)}</Text>
    </View>
  );
}

export function Empty({ text }: { text: string }) {
  return <Text style={s.empty}>{text}</Text>;
}

export function Segmented<T extends string>({ options, value, onChange }: { options: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={s.seg}>
      {options.map((o) => (
        <Pressable key={o} accessibilityRole="button" accessibilityState={{ selected: o === value }} onPress={() => onChange(o)} style={[s.segItem, o === value && { backgroundColor: C.navy }]}>
          <Text style={[s.segT, o === value && { color: '#fff' }]}>{o}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function Input({ label, error, multiline, ...rest }: TextInputProps & { label: string; error?: string }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        placeholderTextColor={C.muted} multiline={multiline} {...rest}
        style={[s.input, multiline && { minHeight: 120, textAlignVertical: 'top' }, error ? { borderColor: C.danger } : null]}
      />
      {error ? <Text style={s.err}>{error}</Text> : null}
    </View>
  );
}

export function TopBar({ title, right, icon = 'chevron-back' }: { title?: string; right?: ReactNode; icon?: IconName }) {
  return (
    <View style={s.topBar}>
      <IconButton name={icon} label={icon === 'close' ? 'Close' : 'Back'} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      <Text style={s.topTitle} numberOfLines={1}>{title}</Text>
      <View style={{ minWidth: MIN_TAP }}>{right}</View>
    </View>
  );
}

export function Skeleton({ h = 16, w = '100%', r = 8, style }: { h?: number; w?: number | `${number}%`; r?: number; style?: StyleProp<ViewStyle> }) {
  const v = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const l = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(v, { toValue: 0.5, duration: 700, useNativeDriver: true }),
    ]));
    l.start();
    return () => l.stop();
  }, [v]);
  return <Animated.View style={[{ height: h, width: w, borderRadius: r, backgroundColor: C.border, opacity: v }, style]} />;
}

export function SkeletonScreen() {
  return (
    <View style={{ padding: 16, gap: 14 }}>
      <Skeleton h={28} w="50%" />
      <Skeleton h={110} r={14} />
      <Skeleton h={90} r={14} />
      <Skeleton h={90} r={14} />
      <Skeleton h={90} r={14} />
    </View>
  );
}

function Msg({ title, body, onRetry }: { title: string; body: string; onRetry: () => void }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 }}>
      <Ionicons name="cloud-offline-outline" size={40} color={C.muted} />
      <Text style={{ fontSize: 18, fontWeight: '700', color: C.text }}>{title}</Text>
      <Text style={{ color: C.muted, textAlign: 'center', marginBottom: 12 }}>{body}</Text>
      <Button title="Retry" onPress={onRetry} style={{ paddingHorizontal: 32 }} />
    </View>
  );
}

/** Wraps screen content: placeholders while loading, Retry on failure. Never a blank screen. */
export function Gate({ children }: { children: ReactNode }) {
  const { state, refresh } = useStore();
  if (state.status === 'loading') return <SkeletonScreen />;
  if (state.status === 'nocache') return <Msg title="No connection" body="Connect to the internet and try again." onRetry={refresh} />;
  if (state.status === 'error') return <Msg title="Something went wrong" body="We couldn’t load the latest posts." onRetry={refresh} />;
  return <>{children}</>;
}

export function LastUpdated() {
  const { state } = useStore();
  if (!state.cached || !state.at) return null;
  return (
    <View style={s.stale}>
      <Ionicons name="time-outline" size={14} color={C.muted} />
      <Text style={{ color: C.muted, fontSize: 12 }}>Offline · Last updated {fmtStamp(state.at)}</Text>
    </View>
  );
}

export function Toast() {
  const { toast } = useStore();
  if (!toast) return null;
  return (
    <SafeAreaView pointerEvents="none" edges={['top']} style={s.toastWrap}>
      <View style={s.toast}>
        <Ionicons name="checkmark-circle" size={18} color={C.yellow} />
        <Text style={{ color: '#fff', fontWeight: '600' }}>{toast}</Text>
      </View>
    </SafeAreaView>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
      <Text style={s.section}>{children}</Text>
      {right}
    </View>
  );
}

export function LinkButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="link" onPress={onPress} style={{ minHeight: MIN_TAP, justifyContent: 'center', paddingHorizontal: 4 }}>
      <Text style={{ color: C.navy2, fontWeight: '700' }}>{title}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  btn: { minHeight: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnT: { fontWeight: '700', fontSize: 16 },
  iconBtn: { width: MIN_TAP, height: MIN_TAP, alignItems: 'center', justifyContent: 'center' },
  pill: { height: 36, paddingHorizontal: 16, borderRadius: 18, borderWidth: 1, borderColor: C.border, backgroundColor: '#fff', justifyContent: 'center', marginRight: 8 },
  pillT: { color: C.text, fontWeight: '600' },
  tag: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagT: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  empty: { color: C.muted, textAlign: 'center', paddingVertical: 28 },
  seg: { flexDirection: 'row', backgroundColor: '#EAECF0', borderRadius: 12, padding: 3 },
  segItem: { flex: 1, minHeight: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  segT: { fontWeight: '700', color: C.text },
  label: { fontWeight: '700', color: C.text, marginBottom: 6 },
  input: { minHeight: 48, borderWidth: 1, borderColor: C.border, borderRadius: 12, backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: C.text },
  err: { color: C.danger, marginTop: 6 },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, minHeight: 56 },
  topTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: C.text, textAlign: 'center' },
  stale: { flexDirection: 'row', gap: 6, alignItems: 'center', paddingHorizontal: 16, paddingVertical: 6 },
  toastWrap: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', zIndex: 99 },
  toast: { marginTop: 8, flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: C.navy, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 24 },
  section: { fontSize: 18, fontWeight: '800', color: C.text },
});
