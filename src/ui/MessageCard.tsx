import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { LocalMessage } from '../domain/types';
import { categoryLabel, expiryLabel, relativeTime, shortId } from '../format';
import { languageNative } from '../i18n';
import { useApp } from '../state/AppState';
import { colors, space } from '../theme';

export function MessageCard({
  message,
  onPress,
}: {
  message: LocalMessage;
  onPress?: () => void;
}) {
  const { t, settings } = useApp();
  const locale = settings.uiLanguage;
  const expiry = expiryLabel(message.expiresAt, locale);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.meta}>
        <Text style={styles.category}>{categoryLabel(message.category, locale)}</Text>
        <Text style={styles.time}>
          {relativeTime(message.owned ? message.createdAt : message.receivedAt, locale)}
        </Text>
      </View>
      <Text style={styles.body}>{message.text}</Text>
      <View style={styles.flags}>
        {message.owned ? <Flag label={t('card.yours')} tone="amber" /> : null}
        {message.bottleMode && message.bottleForwardEnabled ? (
          <Flag label={t('card.bottle')} tone="accent" />
        ) : (
          <Flag label={t('card.direct')} tone="muted" />
        )}
        {!message.seen && !message.owned ? <Flag label={t('card.new')} tone="good" /> : null}
        {message.language ? <Flag label={languageNative(message.language)} tone="muted" /> : null}
        {expiry ? <Flag label={expiry} tone="muted" /> : null}
        <Text style={styles.id}>#{shortId(message.messageId)}</Text>
      </View>
    </Pressable>
  );
}

function Flag({
  label,
  tone,
}: {
  label: string;
  tone: 'amber' | 'accent' | 'muted' | 'good';
}) {
  const map = {
    amber: styles.flagAmber,
    accent: styles.flagAccent,
    muted: styles.flagMuted,
    good: styles.flagGood,
  } as const;
  return (
    <View style={[styles.flag, map[tone]]}>
      <Text style={styles.flagText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 10,
  },
  pressed: { opacity: 0.85 },
  meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  category: {
    color: colors.sand,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  time: { color: colors.muted, fontSize: 12 },
  body: {
    color: colors.paper,
    fontSize: 17,
    lineHeight: 24,
  },
  flags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  flag: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  flagAmber: { backgroundColor: 'rgba(233,196,106,0.18)' },
  flagAccent: { backgroundColor: 'rgba(42,157,143,0.2)' },
  flagMuted: { backgroundColor: 'rgba(138,160,181,0.16)' },
  flagGood: { backgroundColor: 'rgba(82,183,136,0.2)' },
  flagText: { color: colors.text, fontSize: 11, fontWeight: '600' },
  id: { color: colors.muted, fontSize: 11, marginLeft: 'auto' },
});
