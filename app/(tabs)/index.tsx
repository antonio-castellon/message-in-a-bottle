import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { CATEGORIES, type Category } from '@/src/domain/types';
import { categoryLabel } from '@/src/format';
import { useApp } from '@/src/state/AppState';
import { colors, space } from '@/src/theme';
import { EmptyState } from '@/src/ui/EmptyState';
import { MessageCard } from '@/src/ui/MessageCard';
import { RadioBanner } from '@/src/ui/RadioBanner';

export default function InboxScreen() {
  const { inbox, t, settings } = useApp();
  const router = useRouter();
  const [filter, setFilter] = useState<Category | 'all'>('all');
  const data = useMemo(
    () => (filter === 'all' ? inbox : inbox.filter((m) => m.category === filter)),
    [inbox, filter],
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.messageId}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <RadioBanner />
            <Text style={styles.lead}>{t('inbox.lead')}</Text>
            <View style={styles.chips}>
              <Chip label={t('inbox.filterAll')} active={filter === 'all'} onPress={() => setFilter('all')} />
              {CATEGORIES.map((c) => (
                <Chip
                  key={c}
                  label={categoryLabel(c, settings.uiLanguage)}
                  active={filter === c}
                  onPress={() => setFilter(c)}
                />
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title={t('inbox.emptyTitle')}
            body={t('inbox.emptyBody')}
          />
        }
        renderItem={({ item }) => (
          <MessageCard
            message={item}
            onPress={() => router.push(`/message/${item.messageId}`)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipOn]}>
      <Text style={[styles.chipText, active && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { padding: space.md, paddingBottom: 40, gap: 0 },
  header: { gap: 14, marginBottom: 16 },
  lead: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipOn: { backgroundColor: colors.accentDim, borderColor: colors.accent },
  chipText: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  chipTextOn: { color: colors.paper },
});
