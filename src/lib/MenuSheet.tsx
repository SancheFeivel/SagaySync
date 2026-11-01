import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { C, MIN_TAP } from './theme';

export type MenuItem = { label: string; onPress: () => void; danger?: boolean };

export function MenuSheet({ visible, onClose, items, title }: { visible: boolean; onClose: () => void; items: MenuItem[]; title?: string }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose} accessibilityLabel="Close menu">
        <View style={s.sheet}>
          {title ? <Text style={s.title}>{title}</Text> : null}
          {items.map((it) => (
            <Pressable key={it.label} accessibilityRole="button" style={s.item} onPress={() => { onClose(); it.onPress(); }}>
              <Text style={[s.itemT, it.danger && { color: C.danger }]}>{it.label}</Text>
            </Pressable>
          ))}
          <Pressable accessibilityRole="button" style={[s.item, { borderTopWidth: 1, borderColor: C.border }]} onPress={onClose}>
            <Text style={[s.itemT, { color: C.muted }]}>Cancel</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(11,37,69,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 24, paddingTop: 8 },
  title: { color: C.muted, fontWeight: '700', paddingHorizontal: 20, paddingVertical: 10 },
  item: { minHeight: MIN_TAP + 8, justifyContent: 'center', paddingHorizontal: 20 },
  itemT: { fontSize: 16, fontWeight: '600', color: C.text },
});
