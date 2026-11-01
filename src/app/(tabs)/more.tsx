import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { C, MIN_TAP } from '../../lib/theme';
import { useStore } from '../../lib/store';
import { Screen } from '../../lib/ui';

type Icon = keyof typeof Ionicons.glyphMap;
function Row({ icon, label, onPress, right, sub }: { icon: Icon; label: string; sub?: string; onPress?: () => void; right?: React.ReactNode }) {
  return (
    <Pressable accessibilityRole="button" disabled={!onPress} onPress={onPress} style={s.row}>
      <Ionicons name={icon} size={22} color={C.navy} />
      <View style={{ flex: 1 }}>
        <Text style={s.label}>{label}</Text>
        {sub ? <Text style={s.sub}>{sub}</Text> : null}
      </View>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={C.muted} /> : null)}
    </Pressable>
  );
}

export default function MoreTab() {
  const { officer, signOut, notifOn, setNotifOn, orgById } = useStore();
  return (
    <Screen>
      <View style={{ padding: 16 }}>
        <Text style={s.h1}>More</Text>
        <View style={s.group}>
          <Row icon="information-circle-outline" label="About" onPress={() => router.push({ pathname: '/info', params: { kind: 'about' } })} />
          <Row icon="help-circle-outline" label="Help & FAQ" onPress={() => router.push({ pathname: '/info', params: { kind: 'help' } })} />
          <Row
            icon="notifications-outline" label="Notifications" sub="Push alerts for groups you follow"
            right={<Switch value={notifOn} onValueChange={setNotifOn} trackColor={{ true: C.navy }} thumbColor={C.yellow} />}
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
  h1: { fontSize: 28, fontWeight: '800', color: C.navy, marginBottom: 12 },
  group: { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  row: { minHeight: MIN_TAP + 12, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: C.border },
  label: { fontSize: 16, fontWeight: '600', color: C.text },
  sub: { color: C.muted, fontSize: 12, marginTop: 1 },
});
