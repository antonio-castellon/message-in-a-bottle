import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useApp } from '@/src/state/AppState';
import { colors, space } from '@/src/theme';

export default function NotFoundScreen() {
  const { t } = useApp();
  return (
    <>
      <Stack.Screen options={{ title: t('notFound.title') }} />
      <View style={styles.container}>
        <Text style={styles.title}>{t('notFound.body')}</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>{t('notFound.back')}</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.lg,
  },
  title: { fontSize: 20, fontWeight: 'bold', color: colors.paper },
  link: { marginTop: 16, paddingVertical: 12 },
  linkText: { fontSize: 14, color: colors.accent, fontWeight: '700' },
});
