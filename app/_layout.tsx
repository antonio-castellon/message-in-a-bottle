import { DarkTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AppProvider, useApp } from '@/src/state/AppState';
import { colors } from '@/src/theme';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    border: colors.line,
    primary: colors.accent,
  },
};

export default function RootLayout() {
  return (
    <AppProvider>
      <RootNav />
    </AppProvider>
  );
}

function RootNav() {
  const { ready, t } = useApp();

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <ThemeProvider value={theme}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.paper,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: colors.bg },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="message/[id]" options={{ title: t('message.title') }} />
        <Stack.Screen name="blocked" options={{ title: t('blocked.title') }} />
        <Stack.Screen name="languages" options={{ title: t('languages.title') }} />
        <Stack.Screen name="app-language" options={{ title: t('languages.appTitle') }} />
      </Stack>
    </ThemeProvider>
  );
}
