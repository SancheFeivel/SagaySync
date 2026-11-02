import React, { ReactNode, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo, Animated, Pressable, StyleProp, StyleSheet, Switch, Text, TextInput, TextInputProps, TextStyle, View, ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, CARD, CONTENT_MAX, EYEBROW, FIELD, ICON, LABEL, MIN_TAP, PAD, PRESSED, R, SERIF, SP, TYPE } from './theme';
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
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={edges}>
      <View style={{ flex: 1, width: '100%', maxWidth: CONTENT_MAX, alignSelf: 'center' }}>{children}</View>
    </SafeAreaView>
  );
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
      style={({ pressed }) => [s.btn, { backgroundColor: bg, borderColor: variant === 'ghost' ? C.border : bg, opacity: disabled ? 0.4 : 1 }, style, pressed && PRESSED]}
    >
      {icon ? <Ionicons name={icon} size={ICON.md} color={fg} /> : null}
      <Text style={[s.btnT, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

export function IconButton({ name, onPress, label, color = C.navy }: { name: IconName; onPress: () => void; label: string; color?: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [s.iconBtn, pressed && PRESSED]} hitSlop={4}>
      <Ionicons name={name} size={24} color={color} />
    </Pressable>
  );
}

export function Pill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress} hitSlop={{ top: 4, bottom: 4 }}
      style={({ pressed }) => [s.pill, active && { backgroundColor: C.navy, borderColor: C.navy }, pressed && PRESSED]}
    >
      <Text style={[s.pillT, active && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

const TONES = {
  navy: { bg: C.navy, fg: '#fff' },
  yellow: { bg: C.yellow, fg: C.navy },
  red: { bg: C.dangerSoft, fg: C.danger },
  gray: { bg: C.soft, fg: C.grayText },
  green: { bg: C.okSoft, fg: C.okText },
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
// Soft badge with navy initials. `inverted` goes white, for use on a soft background.
export function Monogram({ org, size = 44, inverted }: { org: Org; size?: number; inverted?: boolean }) {
  return (
    <View
      style={{
        width: size, height: size, borderRadius: size * 0.3, alignItems: 'center', justifyContent: 'center',
        backgroundColor: inverted ? '#fff' : C.soft,
      }}
    >
      <Text style={{ color: C.navy, fontWeight: '700', fontSize: size * 0.34 }}>{monogram(org.name)}</Text>
    </View>
  );
}

/** Placeholder for a list with nothing in it. Add an icon, and an action when there is something to do next. */
export function Empty({ text, icon, actionLabel, onAction }: { text: string; icon?: IconName; actionLabel?: string; onAction?: () => void }) {
  return (
    <View style={s.emptyBox}>
      {icon ? <Ionicons name={icon} size={ICON.lg} color={C.muted} style={{ alignSelf: 'center', marginBottom: SP.sm }} /> : null}
      <Text style={s.empty}>{text}</Text>
      {actionLabel && onAction ? <View style={{ alignItems: 'center', marginTop: SP.sm }}><LinkButton title={actionLabel} onPress={onAction} /></View> : null}
    </View>
  );
}

export function Segmented<T extends string>({ options, value, onChange }: { options: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={s.seg}>
      {options.map((o) => (
        <Pressable key={o} accessibilityRole="button" accessibilityState={{ selected: o === value }} onPress={() => onChange(o)} style={({ pressed }) => [s.segItem, o === value && { backgroundColor: C.navy }, pressed && PRESSED]}>
          <Text style={[s.segT, o === value && { color: '#fff' }]}>{o}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Labeled text field. Pass `right` to put a control (like Show/Hide) inside the field, on its right edge. */
export function Input({ label, error, multiline, right, ...rest }: TextInputProps & { label: string; error?: string; right?: ReactNode }) {
  const errStyle = error ? { borderColor: C.danger } : null;
  return (
    <View style={{ marginBottom: SP.lg }}>
      <Text style={s.label}>{label}</Text>
      {right ? (
        <View style={[s.field, errStyle]}>
          <TextInput placeholderTextColor={C.muted} {...rest} style={s.fieldInput} />
          {right}
        </View>
      ) : (
        <TextInput
          placeholderTextColor={C.muted} multiline={multiline} {...rest}
          style={[s.input, multiline && { minHeight: 120, textAlignVertical: 'top' }, errStyle]}
        />
      )}
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
    <View style={{ padding: PAD, gap: SP.lg }}>
      {/* Same shape as Home: date line, pinned card, a row of event cards, then list rows. */}
      <Skeleton h={14} w="40%" />
      <Skeleton h={190} r={R.xl} />
      <Skeleton h={14} w="30%" />
      <View style={{ flexDirection: 'row', gap: SP.md, overflow: 'hidden' }}>
        <Skeleton h={130} w={230} r={R.lg} />
        <Skeleton h={130} w={230} r={R.lg} />
      </View>
      <Skeleton h={96} r={R.lg} />
      <Skeleton h={96} r={R.lg} />
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
      <Ionicons name="time-outline" size={ICON.sm} color={C.muted} />
      <Text style={{ color: C.muted, fontSize: 12 }}>Offline · Last updated {fmtStamp(state.at)}</Text>
    </View>
  );
}

export function Toast() {
  const { toast } = useStore();
  if (!toast) return null;
  return (
    <SafeAreaView pointerEvents="none" edges={['top']} style={s.toastWrap}>
      <View style={s.toast} accessibilityRole="alert" accessibilityLiveRegion="polite">
        <Ionicons name="checkmark-circle" size={ICON.md} color="#fff" />
        <Text style={{ color: '#fff', fontWeight: '600' }}>{toast}</Text>
      </View>
    </SafeAreaView>
  );
}

/** Tracked uppercase section label with a small navy marker. */
export function Eyebrow({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 8 }, style]}>
      <View style={{ width: 4, height: 14, borderRadius: 2, backgroundColor: C.navy2 }} />
      <Text style={s.section}>{children}</Text>
    </View>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SP.lg, marginBottom: SP.md }}>
      <Eyebrow>{children}</Eyebrow>
      {right}
    </View>
  );
}

/** Big serif title at the top of a tab screen, under the app header. */
export function PageTitle({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text accessibilityRole="header" style={[s.pageTitle, style]}>{children}</Text>;
}

/** Label above a form field or option group. */
export function Label({ children }: { children: ReactNode }) {
  return <Text style={s.label}>{children}</Text>;
}

/** White rounded surface, same look as the cards in the feeds. */
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function LinkButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="link" onPress={onPress} style={({ pressed }) => [{ minHeight: MIN_TAP, justifyContent: 'center', paddingHorizontal: 4 }, pressed && PRESSED]}>
      <Text style={{ color: C.navy2, fontWeight: '700' }}>{title}</Text>
    </Pressable>
  );
}

/** The app's one switch: white thumb, navy track. */
export function AppSwitch({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <Switch accessibilityLabel={label} value={value} onValueChange={onChange} trackColor={{ false: C.border, true: C.navy }} thumbColor="#fff" />
  );
}

/** A form row with a label (and optional helper line) on the left and a switch on the right. */
export function SwitchRow({ label, sub, value, onChange }: { label: string; sub?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SP.md, minHeight: MIN_TAP, marginBottom: SP.sm }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '700', color: C.text }}>{label}</Text>
        {sub ? <Text style={{ color: C.muted, fontSize: TYPE.caption }}>{sub}</Text> : null}
      </View>
      <AppSwitch value={value} onChange={onChange} label={label} />
    </View>
  );
}

const s = StyleSheet.create({
  btn: { minHeight: 48, borderRadius: R.md, borderWidth: 1, paddingHorizontal: SP.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SP.sm },
  btnT: { fontWeight: '700', fontSize: TYPE.body },
  iconBtn: { width: MIN_TAP, height: MIN_TAP, alignItems: 'center', justifyContent: 'center' },
  pill: { height: 40, paddingHorizontal: SP.lg, borderRadius: R.pill, borderWidth: 1, borderColor: C.border, backgroundColor: '#fff', justifyContent: 'center', marginRight: SP.sm },
  pillT: { color: C.text, fontWeight: '600' },
  tag: { alignSelf: 'flex-start', paddingHorizontal: SP.sm, paddingVertical: SP.xs, borderRadius: R.sm },
  tagT: { fontSize: TYPE.caption, fontWeight: '800', letterSpacing: 0.3 },
  empty: { color: C.muted, textAlign: 'center' },
  emptyBox: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.divider, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: R.lg, paddingVertical: SP.xxxl, paddingHorizontal: SP.lg, marginVertical: SP.sm },
  seg: { flexDirection: 'row', backgroundColor: C.soft, borderRadius: R.md, padding: SP.xs },
  segItem: { flex: 1, minHeight: MIN_TAP, borderRadius: R.md - SP.xs, alignItems: 'center', justifyContent: 'center' },
  segT: { fontWeight: '700', color: C.text },
  label: LABEL,
  input: { ...FIELD, paddingHorizontal: 14, paddingVertical: SP.md, fontSize: TYPE.body, color: C.text },
  field: { ...FIELD, flexDirection: 'row', alignItems: 'center' },
  fieldInput: { flex: 1, paddingHorizontal: 14, paddingVertical: SP.md, fontSize: TYPE.body, color: C.text },
  err: { color: C.danger, marginTop: SP.sm },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, minHeight: 56 },
  topTitle: { flex: 1, fontSize: TYPE.title, fontWeight: '700', color: C.text, textAlign: 'center', fontFamily: SERIF },
  stale: { flexDirection: 'row', gap: SP.sm, alignItems: 'center', paddingHorizontal: SP.lg, paddingVertical: SP.sm },
  toastWrap: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', zIndex: 99 },
  toast: { marginTop: 8, flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: C.navy, paddingHorizontal: SP.lg, paddingVertical: SP.md, borderRadius: R.xl },
  section: { ...EYEBROW, color: C.navy },
  pageTitle: { fontSize: TYPE.h1, fontWeight: '700', color: C.navy, marginBottom: SP.lg, fontFamily: SERIF, letterSpacing: -0.4 },
  card: { ...CARD, padding: 16 },
});
