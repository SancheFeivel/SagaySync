import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { C } from '../../lib/theme';
import { useStore } from '../../lib/store';
import { FadeIn, Gate, Monogram, Screen } from '../../lib/ui';
import { openOrg } from '../../lib/nav';

export default function OrganizationsTab() {
  const { orgs, newCount } = useStore();
  return (
    <Screen>
      <Gate>
        <FlatList
          data={orgs} numColumns={2} keyExtractor={(o) => o.id}
          contentContainerStyle={{ padding: 16 }} columnWrapperStyle={{ gap: 12 }}
          ListHeaderComponent={<Text style={s.h1}>Organizations</Text>}
          renderItem={({ item, index }) => {
            const n = newCount(item.id);
            return (
              <View style={{ flex: 1, marginBottom: 12 }}>
                <FadeIn index={index}>
                  <Pressable accessibilityRole="button" onPress={() => openOrg(item.id)} style={s.card}>
                    {n > 0 ? <View style={s.badge}><Text style={s.badgeT}>{n} new</Text></View> : null}
                    <Monogram org={item} size={52} />
                    <Text style={s.name}>{item.name}</Text>
                    <Text style={s.desc} numberOfLines={3}>{item.description}</Text>
                  </Pressable>
                </FadeIn>
              </View>
            );
          }}
        />
      </Gate>
    </Screen>
  );
}

const s = StyleSheet.create({
  h1: { fontSize: 28, fontWeight: '800', color: C.navy, marginBottom: 12 },
  card: { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 14, minHeight: 170, gap: 6 },
  name: { fontSize: 16, fontWeight: '800', color: C.text, marginTop: 6 },
  desc: { color: C.muted, fontSize: 13, lineHeight: 18 },
  badge: { position: 'absolute', top: 10, right: 10, backgroundColor: C.yellow, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, zIndex: 1 },
  badgeT: { color: C.navy, fontWeight: '800', fontSize: 11 },
});
