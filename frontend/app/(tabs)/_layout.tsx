import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Dimensions } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { width, height } = Dimensions.get("window");

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: { backgroundColor: Colors[colorScheme ?? 'light'].themeColor, height: height * 0.08 },
        tabBarItemStyle: { justifyContent: "center", alignItems: "center" },
        tabBarInactiveTintColor: "#fff"
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'My Events',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="list.bullet.rectangle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="announcement"
        options={{
          title: 'Announcements',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="newspaper" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
