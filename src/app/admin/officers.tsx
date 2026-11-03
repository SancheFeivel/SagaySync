import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { C, CARD, ICON, MIN_TAP, PAD, PRESSED, R, SP, TYPE } from '../../lib/theme';
import { useStore } from '../../lib/store';
import { Empty, IconButton, Screen, Skeleton, Tag, TopBar } from '../../lib/ui';
import { MenuItem, MenuSheet } from '../../lib/MenuSheet';
import { OfflineError, repo } from '../../lib/repo';
import { OfficerRecord } from '../../lib/types';

/** Admin: every officer login, which group it posts for, and whether it is switched on. */
export default function AdminOfficers() {
  const { admin, orgs, orgById, showToast } = useStore();
  const [list, setList] = useState<OfficerRecord[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [menu, setMenu] = useState<OfficerRecord | null>(null);
  const [moving, setMoving] = useState<OfficerRecord | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setList(await repo.listOfficers());
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  // Reload whenever this screen comes into view, e.g. after adding an officer.
  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!admin) {
    return <Screen><TopBar title="Officers" /><Empty icon="lock-closed-outline" text="Only school admins can open this." /></Screen>;
  }

  const act = async (fn: () => Promise<unknown>, okMsg: string) => {
    try {
      await fn();
      showToast(okMsg);
      await load();
    } catch (e) {
      Alert.alert(e instanceof OfflineError ? 'No connection' : 'Something went wrong', 'Nothing was changed. Try again.');
    }
  };

  const menuItems = (o: OfficerRecord): MenuItem[] => [
    { label: 'Move to another group', onPress: () => setMoving(o) },
    o.active
      ? {
          label: 'Switch off access',
          onPress: () => Alert.alert(
            `Switch off ${o.email}?`,
            'They lose posting rights right away and can’t log in until you switch them back on. Their posts stay up.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Switch off', style: 'destructive', onPress: () => act(() => repo.updateOfficer(o.uid, { active: false }), 'Access switched off.') },
            ],
          ),
        }
      : { label: 'Switch access back on', onPress: () => act(() => repo.updateOfficer(o.uid, { active: true }), 'Access switched on.') },
    { label: 'Send password reset email', onPress: () => act(() => repo.sendReset(o.email), 'Reset email sent.') },
    {
      label: 'Remove officer', danger: true,
      onPress: () => Alert.alert(
        `Remove ${o.email}?`,
        'Their posts stay. Their login still exists but can no longer post. To delete the login completely, use Firebase Console › Authentication.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', style: 'destructive', onPress: () => act(() => repo.deleteOfficer(o.uid), 'Officer removed.') },
        ],
      ),
    },
  ];

  const add = () => router.push('/admin/officer-new');

  return (
    <Screen>
      <TopBar title="Officers" right={<IconButton name="person-add-outline" label="Add officer" onPress={add} />} />
      {failed && !list ? (
        <Empty icon="cloud-offline-outline" text="Couldn’t load officers." actionLabel="Try again" onAction={load} />
      ) : !list ? (
        <View style={{ padding: PAD, gap: SP.md }}>
          <Skeleton h={72} r={R.lg} />
          <Skeleton h={72} r={R.lg} />
          <Skeleton h={72} r={R.lg} />
        </View>
      ) : (
        <FlatList
          data={list} keyExtractor={(o) => o.uid}
          contentContainerStyle={{ padding: PAD, paddingTop: SP.sm, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={C.navy} />}
          ListHeaderComponent={<Text style={s.hint}>Each officer posts for one group. Tap an officer to move them, switch off their access, or remove them.</Text>}
          ListEmptyComponent={<Empty icon="key-outline" text="No officers yet." actionLabel="Add an officer" onAction={add} />}
          renderItem={({ item }) => {
            const group = orgs.find((g) => g.id === item.orgId);
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${item.email}, ${group ? group.name : 'no group'}${item.active ? '' : ', switched off'}`}
                onPress={() => setMenu(item)}
                style={({ pressed }) => [s.row, pressed && PRESSED]}
              >
                <Ionicons name="person-circle-outline" size={ICON.lg} color={item.active ? C.navy2 : C.muted} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[s.email, !item.active && { color: C.muted }]} numberOfLines={1}>{item.email || item.uid}</Text>
                  <Text style={s.group}>{group ? group.name : `Group “${item.orgId}” not found`}</Text>
                </View>
                {!item.active ? <Tag label="OFF" tone="gray" /> : !group ? <Tag label="FIX GROUP" tone="red" /> : null}
                <Ionicons name="ellipsis-horizontal" size={ICON.md} color={C.muted} />
              </Pressable>
            );
          }}
        />
      )}
      <MenuSheet visible={!!menu} onClose={() => setMenu(null)} title={menu?.email} items={menu ? menuItems(menu) : []} />
      <MenuSheet
        visible={!!moving} onClose={() => setMoving(null)} title="Move to which group?"
        items={moving
          ? orgs.filter((g) => g.id !== moving.orgId).map((g) => ({
              label: g.name,
              onPress: () => act(() => repo.updateOfficer(moving.uid, { orgId: g.id }), `Moved to ${orgById(g.id).name}.`),
            }))
          : []}
      />
    </Screen>
  );
}

const s = StyleSheet.create({
  hint: { color: C.muted, marginBottom: SP.lg },
  row: { ...CARD, minHeight: MIN_TAP + 28, paddingHorizontal: SP.lg, paddingVertical: SP.md, marginBottom: SP.md, flexDirection: 'row', alignItems: 'center', gap: SP.md },
  email: { fontSize: TYPE.body, fontWeight: '700', color: C.text },
  group: { color: C.muted, fontSize: TYPE.small },
});
