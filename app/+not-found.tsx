import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { colors, space } from '@/src/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Naufrago' }} />
      <View style={styles.container}>
        <Text style={styles.title}>Esta orilla no existe.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Volver a Recibidos</Text>
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
