import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { isExpired } from '@/src/domain/ids';
import { categoryLabel, expiryLabel, relativeTime, shortId } from '@/src/format';
import { languageLabel } from '@/src/i18n';
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
    t,
  } = useApp();
  const locale = settings.uiLanguage;
  const message = messages.find((m) => m.messageId === id);

  useEffect(() => {
    if (id) void markSeen(id);
  }, [id, markSeen]);

  if (!message) {
    return (
      <View style={styles.screen}>
        <Text style={styles.missing}>{t('message.missing')}</Text>
      </View>
    );
  }

  const item = message;
  const expired = isExpired(item.expiresAt);
  const canForward = !item.owned && item.bottleMode && settings.acceptBottleMode && !expired;

  function confirmDelete() {
    Alert.alert(t('message.deleteTitle'), t('message.deleteBody'), [
      { text: t('settings.cancel'), style: 'cancel' },
      {
        text: t('message.delete'),
        style: 'destructive',
        onPress: () => {
          void removeMessage(item.messageId).then(() => router.back());
        },
      },
    ]);
  }

  function confirmBlockOrigin() {
    Alert.alert(t('message.blockOrigin'), t('message.blockOriginBody', { id: item.originDeviceId }), [
      { text: t('settings.cancel'), style: 'cancel' },
      {
        text: t('message.block'),
          style: 'destructive',
          onPress: () => {
            void blockUuid(item.originDeviceId, 'device', t('blocked.defaultPhoneLabel')).then(() =>
              router.back(),
            );
          },
        },
      ],
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.category}>{categoryLabel(item.category, locale)}</Text>
      <Text style={styles.body}>{item.text}</Text>

      <View style={styles.card}>
        <Line label={t('message.fieldMessage')} value={item.messageId} />
        <Line label={t('message.fieldOrigin')} value={item.originDeviceId} />
        <Line
          label={t('message.fieldFrom')}
          value={item.receivedFromDeviceId ?? (item.owned ? t('message.thisPhone') : '—')}
        />
        <Line label={t('message.created')} value={relativeTime(item.createdAt, locale)} />
        <Line label={t('message.received')} value={relativeTime(item.receivedAt, locale)} />
        <Line label={t('message.hops')} value={String(item.hopCount)} />
        <Line label={t('message.mode')} value={item.bottleMode ? t('message.bottle') : t('message.direct')} />
        <Line label={t('message.language')} value={languageLabel(item.language)} />
        <Line label={t('message.expiry')} value={expiryLabel(item.expiresAt, locale) ?? t('message.noExpiry')} />
      </View>

      {!item.owned ? (
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{t('message.forward')}</Text>
              <Text style={styles.hint}>{canForward ? t('message.forwardOn') : t('message.forwardOff')}</Text>
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
              <Text style={styles.rowTitle}>{t('message.includePool')}</Text>
              <Text style={styles.hint}>{t('message.includeHint')}</Text>
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
              <Text style={styles.rowTitle}>{t('compose.bottle')}</Text>
              <Text style={styles.hint}>{t('message.bottleHint')}</Text>
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
        <Text style={styles.dangerText}>{t('message.deleteFromPhone')}</Text>
      </Pressable>
      {!item.owned ? (
        <Pressable onPress={confirmBlockOrigin} style={styles.ghost}>
          <Text style={styles.ghostText}>
            {t('message.blockOrigin')} {shortId(item.originDeviceId)}
          </Text>
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
