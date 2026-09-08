import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';

import { colors } from '@/src/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.paper,
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.amber,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.bgAlt,
          borderTopColor: colors.line,
        },
        headerTitleStyle: { fontWeight: '700', letterSpacing: 0.3 },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inbox',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'tray.and.arrow.down', android: 'inbox', web: 'inbox' }}
              tintColor={color}
              size={26}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="pool"
        options={{
          title: 'Bottle',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'archivebox',
                android: 'science',
                web: 'science',
              }}
              tintColor={color}
              size={26}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="compose"
        options={{
          title: 'Write',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'square.and.pencil', android: 'edit', web: 'edit' }}
              tintColor={color}
              size={26}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'gearshape', android: 'settings', web: 'settings' }}
              tintColor={color}
              size={26}
            />
          ),
        }}
      />
    </Tabs>
  );
}
