import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { isExpired } from '@/src/domain/ids';
import { categoryLabel, expiryLabel, relativeTime, shortId } from '@/src/format';
import { useApp } from '@/src/state/AppState';
import { colors, space } from '@/src/theme';
import { useEffect } from 'react';

export default function MessageDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    messages,
    settings,
    markSeen,
    removeMessage,
    setBottleForward,
    setInPool,
    blockUuid,
  } = useApp();
  const message = messages.find((m) => m.messageId === id);

  useEffect(() => {
    if (id) void markSeen(id);
  }, [id, markSeen]);

  if (!message) {
    return (
      <View style={styles.screen}>
        <Text style={styles.missing}>This message is no longer on the phone.</Text>
      </View>
    );
  }

  const item = message;
  const expired = isExpired(item.expiresAt);
  const canForward = !item.owned && item.bottleMode && settings.acceptBottleMode && !expired;

  function confirmDelete() {
    Alert.alert('Delete message', 'It will leave the inbox and the pool on this phone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void removeMessage(item.messageId).then(() => router.back());
        },
      },
    ]);
  }

  function confirmBlockOrigin() {
    Alert.alert(
      'Block origin',
      `No more messages will be accepted from UUID ${item.originDeviceId}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => {
            void blockUuid(item.originDeviceId, 'device', 'message origin').then(() =>
              router.back(),
            );
          },
        },
      ],
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.category}>{categoryLabel(item.category)}</Text>
      <Text style={styles.body}>{item.text}</Text>

      <View style={styles.card}>
        <Line label="Message" value={item.messageId} />
        <Line label="Origin" value={item.originDeviceId} />
        <Line
          label="Received from"
          value={item.receivedFromDeviceId ?? (item.owned ? 'this phone' : '—')}
        />
        <Line label="Created" value={relativeTime(item.createdAt)} />
        <Line label="Received" value={relativeTime(item.receivedAt)} />
        <Line label="Hops" value={String(item.hopCount)} />
        <Line label="Original mode" value={item.bottleMode ? 'bottle' : 'direct'} />
        <Line label="Expiry" value={expiryLabel(item.expiresAt) ?? 'no expiry'} />
      </View>

      {!item.owned ? (
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Forward as a bottle</Text>
              <Text style={styles.hint}>
                {canForward
                  ? 'This message enters your pool and will be transmitted to other phones.'
                  : 'Cannot forward: it was not a bottle, you turned the mode off, or it expired.'}
              </Text>
            </View>
            <Switch
              value={item.bottleForwardEnabled && item.inBroadcastPool}
              onValueChange={(v) => void setBottleForward(item.messageId, v)}
              disabled={!item.bottleMode || expired}
              trackColor={{ false: colors.cardAlt, true: colors.accentDim }}
              thumbColor={colors.accent}
            />
          </View>
        </View>
      ) : (
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Include in the pool</Text>
              <Text style={styles.hint}>If you remove it, this phone stops transmitting it.</Text>
            </View>
            <Switch
              value={item.inBroadcastPool}
              onValueChange={(v) => void setInPool(item.messageId, v)}
              trackColor={{ false: colors.cardAlt, true: colors.accentDim }}
              thumbColor={colors.accent}
            />
          </View>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Message in a bottle</Text>
              <Text style={styles.hint}>
                Whoever receives it will add it to their pool. Turn this off for a direct send.
              </Text>
            </View>
            <Switch
              value={item.bottleMode}
              onValueChange={(v) => void setBottleForward(item.messageId, v)}
              trackColor={{ false: colors.cardAlt, true: colors.accentDim }}
              thumbColor={colors.accent}
            />
          </View>
        </View>
      )}

      <Pressable onPress={confirmDelete} style={styles.danger}>
        <Text style={styles.dangerText}>Delete from this phone</Text>
      </Pressable>
      {!item.owned ? (
        <Pressable onPress={confirmBlockOrigin} style={styles.ghost}>
          <Text style={styles.ghostText}>Block origin {shortId(item.originDeviceId)}</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.line}>
      <Text style={styles.lineLabel}>{label}</Text>
      <Text selectable style={styles.lineValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.md, paddingBottom: 48, gap: 16 },
  missing: { color: colors.muted, padding: space.lg },
  category: {
    color: colors.sand,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    fontWeight: '800',
    fontSize: 12,
  },
  body: { color: colors.paper, fontSize: 22, lineHeight: 30 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: space.md,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  line: { gap: 2 },
  lineLabel: { color: colors.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8 },
  lineValue: { color: colors.paper, fontSize: 13 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  rowTitle: { color: colors.text, fontWeight: '700' },
  hint: { color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: 4 },
  danger: {
    backgroundColor: colors.dangerDim,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dangerText: { color: colors.paper, fontWeight: '800' },
  ghost: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  ghostText: { color: colors.sand, fontWeight: '700' },
});
