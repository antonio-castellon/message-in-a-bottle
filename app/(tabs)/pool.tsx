import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { useApp } from '@/src/state/AppState';
import { colors, space } from '@/src/theme';
import { EmptyState } from '@/src/ui/EmptyState';
import { MessageCard } from '@/src/ui/MessageCard';
import { RadioBanner } from '@/src/ui/RadioBanner';

export default function PoolScreen() {
  const { pool } = useApp();
  const router = useRouter();
  const own = pool.filter((m) => m.owned).length;
  const bottled = pool.filter((m) => !m.owned).length;

  return (
    <View style={styles.screen}>
      <FlatList
        data={pool}
        keyExtractor={(item) => item.messageId}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <RadioBanner />
            <Text style={styles.lead}>
              What this phone is willing to transmit. {own} yours · {bottled} bottled from
              others. A direct message is not forwarded; a bottle is, until it expires or you
              pull it from the pool.
            </Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="The bottle is empty"
            body="Write a message, or wait for someone to toss you a bottle to forward."
          />
        }
        renderItem={({ item }) => (
          <MessageCard message={item} onPress={() => router.push(`/message/${item.messageId}`)} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { padding: space.md, paddingBottom: 40 },
  header: { gap: 14, marginBottom: 16 },
  lead: { color: colors.muted, fontSize: 14, lineHeight: 20 },
});
