import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { C, CARD, PAD, PRESSED, R, SERIF, SP, TYPE } from '../../lib/theme';
import { useStore } from '../../lib/store';
import { FadeIn, Gate, Monogram, PageTitle, Screen } from '../../lib/ui';
import { openOrg } from '../../lib/nav';

export default function OrganizationsTab() {
  const { orgs, newCount } = useStore();
  return (
    <Screen>
      <Gate>
        <FlatList
          data={orgs} numColumns={2} keyExtractor={(o) => o.id}
          contentContainerStyle={{ padding: PAD }} columnWrapperStyle={{ gap: 12 }}
          ListHeaderComponent={<PageTitle>Groups</PageTitle>}
          renderItem={({ item, index }) => {
            const n = newCount(item.id);
            return (
              <View style={{ flex: 1, marginBottom: 12 }}>
                <FadeIn index={index}>
                  <Pressable accessibilityRole="button" accessibilityLabel={`${item.name}${n > 0 ? `, ${n} new` : ''}`} onPress={() => openOrg(item.id)} style={({ pressed }) => [s.card, pressed && PRESSED]}>
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
  card: { ...CARD, padding: SP.lg, minHeight: 170, gap: SP.sm, overflow: 'hidden' },
  name: { fontSize: TYPE.title, fontWeight: '700', color: C.text, marginTop: SP.sm, fontFamily: SERIF },
  desc: { color: C.muted, fontSize: TYPE.small, lineHeight: 20 },
  badge: { position: 'absolute', top: SP.md, right: SP.md, backgroundColor: C.yellow, paddingHorizontal: SP.sm, paddingVertical: SP.xs, borderRadius: R.pill, zIndex: 1 },
  badgeT: { color: C.navy, fontWeight: '800', fontSize: TYPE.caption },
});
