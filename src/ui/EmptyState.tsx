import { StyleSheet, Text, View } from 'react-native';

import { colors, space } from '../theme';

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.mark}>~</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: 48, paddingHorizontal: space.lg, alignItems: 'center', gap: 8 },
  mark: { color: colors.sand, fontSize: 40, opacity: 0.7 },
  title: { color: colors.paper, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  body: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: 'center' },
});
