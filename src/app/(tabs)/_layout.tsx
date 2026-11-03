import React from 'react';
import { ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '../../lib/theme';
import { useStore } from '../../lib/store';
import { PlusButton } from '../../lib/PlusButton';

type Icon = keyof typeof Ionicons.glyphMap;
const icon = (on: Icon, off: Icon) => {
  // Tabs passes a ColorValue (which may be null); Ionicons only takes a string here.
  const TabIcon = ({ color, focused }: { color: ColorValue; focused: boolean }) =>
    <Ionicons name={focused ? on : off} size={24} color={typeof color === 'string' ? color : undefined} />;
  return TabIcon;
};

export default function TabsLayout() {
  const { officer, admin } = useStore();
  const staff = !!officer || !!admin;
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.navy,
        tabBarInactiveTintColor: C.muted,
        tabBarStyle: { height: 62 + insets.bottom, paddingTop: 6, backgroundColor: '#fff', borderTopColor: C.border },
        tabBarLabelStyle: { fontWeight: '600', fontSize: 11 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('home', 'home-outline') }} />
      <Tabs.Screen name="calendar" options={{ title: 'Calendar', tabBarIcon: icon('calendar', 'calendar-outline') }} />
      {/* Officers and admins get an extra "+" in the middle. Hidden for students. */}
      <Tabs.Screen
        name="new"
        options={
          staff
            ? { title: 'New', tabBarButton: () => <PlusButton /> }
            : { title: 'New', href: null }
        }
      />
      <Tabs.Screen name="organizations" options={{ title: 'Groups', tabBarIcon: icon('people', 'people-outline') }} />
      <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: icon('menu', 'menu-outline') }} />
    </Tabs>
  );
}