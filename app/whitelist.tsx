import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { isUuid } from '@/src/domain/ids';
import { shortId } from '@/src/format';
import { useApp } from '@/src/state/AppState';
import { colors, space } from '@/src/theme';

export default function WhitelistScreen() {
  const {
    settings,
    whitelist,
    updateSettings,
    addToWhitelist,
    removeFromWhitelist,
    t,
  } = useApp();
  const router = useRouter();
  const [draft, setDraft] = useState('');

  function add() {
    const value = draft.trim().toLowerCase();
    if (!isUuid(value)) {
      Alert.alert(t('blocked.invalidTitle'), t('blocked.invalidBody'));
      return;
    }
    if (value === settings.deviceId.toLowerCase()) {
      Alert.alert(t('whitelist.self'));
      return;
    }
    void addToWhitelist(value, 'manual');
    setDraft('');
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.lead}>{t('whitelist.lead')}</Text>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>{t('whitelist.enable')}</Text>
          <Text style={styles.hint}>{t('whitelist.enableHint')}</Text>
        </View>
        <Switch
          value={settings.whitelistEnabled}
          onValueChange={(v) => void updateSettings({ whitelistEnabled: v })}
          trackColor={{ false: colors.cardAlt, true: colors.accentDim }}
          thumbColor={settings.whitelistEnabled ? colors.accent : colors.muted}
        />
      </View>

      <View style={styles.actions}>
        <Pressable onPress={() => router.push('/share-qr')} style={styles.secondary}>
          <Text style={styles.secondaryText}>{t('whitelist.shareQr')}</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/scan-qr')} style={styles.secondary}>
          <Text style={styles.secondaryText}>{t('whitelist.scanQr')}</Text>
        </Pressable>
      </View>

      <TextInput
        value={draft}
        onChangeText={setDraft}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="uuid…"
        placeholderTextColor={colors.muted}
        style={styles.input}
      />
      <Pressable onPress={add} style={styles.cta}>
        <Text style={styles.ctaText}>{t('whitelist.add')}</Text>
      </Pressable>

      {whitelist.length === 0 ? (
        <Text style={styles.empty}>{t('whitelist.empty')}</Text>
      ) : (
        whitelist.map((entry) => (
          <View key={entry.uuid} style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text selectable style={styles.uuid}>
                {entry.uuid}
              </Text>
              <Text style={styles.meta}>
                {shortId(entry.uuid)} · {new Date(entry.addedAt).toLocaleString()}
              </Text>
            </View>
            <Pressable onPress={() => void removeFromWhitelist(entry.uuid)} style={styles.remove}>
              <Text style={styles.removeText}>{t('blocked.remove')}</Text>
            </Pressable>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.md, paddingBottom: 48, gap: 12 },
  lead: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  hint: { color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: 4 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  rowTitle: { color: colors.text, fontWeight: '700' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  secondary: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.sand,
  },
  secondaryText: { color: colors.sand, fontWeight: '700' },
  input: {
    backgroundColor: colors.card,
    color: colors.paper,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cta: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  ctaText: { color: colors.bg, fontWeight: '800' },
  empty: { color: colors.muted },
  card: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  uuid: { color: colors.paper, fontSize: 12 },
  meta: { color: colors.muted, fontSize: 11, marginTop: 4 },
  remove: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  removeText: { color: colors.danger, fontWeight: '700' },
});
