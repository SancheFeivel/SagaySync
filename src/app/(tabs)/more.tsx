import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { C, CARD, ICON, MIN_TAP, PAD, PRESSED_ROW, SP, TYPE } from '../../lib/theme';
import { useStore } from '../../lib/store';
import { AppSwitch, PageTitle, Screen } from '../../lib/ui';

type Icon = keyof typeof Ionicons.glyphMap;
function Row({ icon, label, onPress, right, sub }: { icon: Icon; label: string; sub?: string; onPress?: () => void; right?: React.ReactNode }) {
  return (
    <Pressable accessibilityRole="button" disabled={!onPress} onPress={onPress} style={({ pressed }) => [s.row, pressed && PRESSED_ROW]}>
      <Ionicons name={icon} size={ICON.lg} color={C.navy} />
      <View style={{ flex: 1 }}>
        <Text style={s.label}>{label}</Text>
        {sub ? <Text style={s.sub}>{sub}</Text> : null}
      </View>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={ICON.md} color={C.muted} /> : null)}
    </Pressable>
  );
}

export default function MoreTab() {
  const { officer, signOut, notifOn, setNotifOn, orgById } = useStore();
  return (
    <Screen>
      <View style={{ padding: PAD }}>
        <PageTitle>More</PageTitle>
        <View style={s.group}>
          <Row icon="information-circle-outline" label="About" onPress={() => router.push({ pathname: '/info', params: { kind: 'about' } })} />
          <Row icon="help-circle-outline" label="Help & FAQ" onPress={() => router.push({ pathname: '/info', params: { kind: 'help' } })} />
          <Row
            icon="notifications-outline" label="Notifications" sub="Push alerts for groups you follow"
            right={<AppSwitch value={notifOn} onChange={setNotifOn} label="Notifications" />}
          />
          <Row icon="chatbubble-ellipses-outline" label="Send feedback" onPress={() => router.push('/feedback')} />
        </View>
        <View style={[s.group, { marginTop: 16 }]}>
          {officer ? (
            <Row icon="log-out-outline" label="Log out" sub={`Signed in as ${orgById(officer.orgId).name} officer`} onPress={signOut} />
          ) : (
            <Row icon="lock-closed-outline" label="Officer login" onPress={() => router.push('/login')} />
          )}
        </View>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  group: { ...CARD, overflow: 'hidden' },
  row: { minHeight: MIN_TAP + 12, flexDirection: 'row', alignItems: 'center', gap: SP.lg, paddingHorizontal: SP.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: C.border },
  label: { fontSize: TYPE.body, fontWeight: '600', color: C.text },
  sub: { color: C.muted, fontSize: TYPE.caption, marginTop: 1 },
});
