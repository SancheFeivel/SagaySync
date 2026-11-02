import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { C, MIN_TAP, PRESSED_ROW, R, SP, TYPE } from './theme';

export type MenuItem = { label: string; onPress: () => void; danger?: boolean };

export function MenuSheet({ visible, onClose, items, title }: { visible: boolean; onClose: () => void; items: MenuItem[]; title?: string }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose} accessibilityLabel="Close menu">
        <View style={s.sheet}>
          {title ? <Text style={s.title}>{title}</Text> : null}
          {items.map((it) => (
            <Pressable key={it.label} accessibilityRole="button" style={({ pressed }) => [s.item, pressed && PRESSED_ROW]} onPress={() => { onClose(); it.onPress(); }}>
              <Text style={[s.itemT, it.danger && { color: C.danger }]}>{it.label}</Text>
            </Pressable>
          ))}
          <Pressable accessibilityRole="button" style={({ pressed }) => [s.item, { borderTopWidth: 1, borderColor: C.border }, pressed && PRESSED_ROW]} onPress={onClose}>
            <Text style={[s.itemT, { color: C.muted }]}>Cancel</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(24,37,67,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: R.lg, borderTopRightRadius: R.lg, paddingBottom: SP.xxl, paddingTop: SP.sm },
  title: { color: C.muted, fontWeight: '700', paddingHorizontal: SP.xl, paddingVertical: SP.md },
  item: { minHeight: MIN_TAP + 8, justifyContent: 'center', paddingHorizontal: SP.xl },
  itemT: { fontSize: TYPE.body, fontWeight: '600', color: C.text },
});
