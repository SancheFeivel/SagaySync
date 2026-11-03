import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { C, CARD, ICON, PAD, PRESSED, SERIF, SP, TYPE } from '../../lib/theme';
import { useStore } from '../../lib/store';
import { Empty, IconButton, Monogram, Screen, TopBar } from '../../lib/ui';

/** Admin: every group, with a way to add one, edit its details or remove it. */
export default function AdminGroups() {
  const { admin, orgs } = useStore();
  if (!admin) {
    return <Screen><TopBar title="Groups" /><Empty icon="lock-closed-outline" text="Only school admins can open this." /></Screen>;
  }
  const add = () => router.push('/admin/group-edit');
  return (
    <Screen>
      <TopBar title="Groups" right={<IconButton name="add" label="Add group" onPress={add} />} />
      <FlatList
        data={orgs} keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: PAD, paddingTop: SP.sm, paddingBottom: 32 }}
        ListHeaderComponent={<Text style={s.hint}>Students see these on the Groups tab. Tap a group to edit or remove it.</Text>}
        ListEmptyComponent={<Empty icon="people-outline" text="No groups yet." actionLabel="Add a group" onAction={add} />}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button" accessibilityLabel={`Edit or remove ${item.name}`}
            onPress={() => router.push({ pathname: '/admin/group-edit', params: { id: item.id } })}
            style={({ pressed }) => [s.row, pressed && PRESSED]}
          >
            <Monogram org={item} size={44} />
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{item.name}</Text>
              <Text style={s.full} numberOfLines={1}>{item.fullName || item.id}</Text>
            </View>
            <Ionicons name="chevron-forward" size={ICON.md} color={C.muted} />
          </Pressable>
        )}
      />
    </Screen>
  );
}

const s = StyleSheet.create({
  hint: { color: C.muted, marginBottom: SP.lg },
  row: { ...CARD, padding: SP.lg, marginBottom: SP.md, flexDirection: 'row', alignItems: 'center', gap: SP.md },
  name: { fontSize: TYPE.title, fontWeight: '700', color: C.text, fontFamily: SERIF },
  full: { color: C.muted, fontSize: TYPE.small },
});
