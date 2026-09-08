import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { CATEGORIES } from '@/src/domain/types';
import { categoryLabel, shortId } from '@/src/format';
import { languageLabel } from '@/src/i18n';
import { useApp } from '@/src/state/AppState';
import { colors, space } from '@/src/theme';
import { RadioBanner } from '@/src/ui/RadioBanner';

export default function SettingsScreen() {
  const {
    settings,
    blocked,
    peers,
    log,
    queueSize,
    updateSettings,
    regenerateDeviceId,
    toggleRadio,
    t,
  } = useApp();
  const router = useRouter();
  const [intervalText, setIntervalText] = useState(String(settings.intervalSeconds));
  const [cooldownText, setCooldownText] = useState(String(settings.cooldownSeconds));

  function commitInterval() {
    const n = Number(intervalText);
    if (!Number.isFinite(n)) {
      setIntervalText(String(settings.intervalSeconds));
      return;
    }
    const clamped = Math.min(60, Math.max(3, Math.round(n)));
    setIntervalText(String(clamped));
    void updateSettings({ intervalSeconds: clamped });
  }

  function commitCooldown() {
    const n = Number(cooldownText);
    if (!Number.isFinite(n)) {
      setCooldownText(String(settings.cooldownSeconds));
      return;
    }
    const clamped = Math.min(600, Math.max(5, Math.round(n)));
    setCooldownText(String(clamped));
    void updateSettings({ cooldownSeconds: clamped });
  }

  function confirmRegen() {
    Alert.alert(t('settings.regenTitle'), t('settings.regenBody'), [
      { text: t('settings.cancel'), style: 'cancel' },
      {
        text: t('settings.regenerate'),
        style: 'destructive',
        onPress: () => {
          void regenerateDeviceId().then((id) => {
            Alert.alert(t('settings.newIdentity'), id);
          });
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <RadioBanner />

      <Section title={t('settings.identity')}>
        <Text style={styles.mono}>{settings.deviceId}</Text>
        <Text style={styles.hint}>{t('settings.identityHint')}</Text>
        <Pressable onPress={confirmRegen} style={styles.secondary}>
          <Text style={styles.secondaryText}>{t('settings.regenUuid')}</Text>
        </Pressable>
      </Section>

      <Section title={t('settings.appLanguage')}>
        <Text style={styles.hint}>{t('settings.appLanguageHint')}</Text>
        <Pressable onPress={() => router.push('/app-language')} style={styles.secondary}>
          <Text style={styles.secondaryText}>{languageLabel(settings.uiLanguage)}</Text>
        </Pressable>
      </Section>

      <Section title={t('settings.receiveLanguages')}>
        <Text style={styles.hint}>{t('settings.receiveLanguagesHint')}</Text>
        <Text style={styles.label}>
          {t('settings.selectedCount', { count: settings.acceptedLanguages.length })}
        </Text>
        <Pressable onPress={() => router.push('/languages')} style={styles.secondary}>
          <Text style={styles.secondaryText}>{t('settings.receiveLanguages')}</Text>
        </Pressable>
      </Section>

      <Section title={t('settings.receiveTopics')}>
        <Text style={styles.hint}>{t('settings.receiveTopicsHint')}</Text>
        <View style={styles.chips}>
          {CATEGORIES.map((c) => {
            const on = settings.acceptedCategories.includes(c);
            return (
              <Pressable
                key={c}
                onPress={() => {
                  const next = on
                    ? settings.acceptedCategories.filter((x) => x !== c)
                    : [...settings.acceptedCategories, c];
                  if (next.length === 0) return;
                  void updateSettings({ acceptedCategories: next });
                }}
                style={[styles.chip, on && styles.chipOn]}>
                <Text style={[styles.chipText, on && styles.chipTextOn]}>
                  {categoryLabel(c, settings.uiLanguage)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Section>

      <Section title={t('settings.radio')}>
        <Row
          title={t('settings.transmit')}
          hint={t('settings.transmitHint')}
          value={settings.radioEnabled}
          onValueChange={(v) => void toggleRadio(v)}
        />
        <Row
          title={t('settings.acceptBottles')}
          hint={t('settings.acceptBottlesHint')}
          value={settings.acceptBottleMode}
          onValueChange={(v) => void updateSettings({ acceptBottleMode: v })}
        />
        <Text style={styles.label}>{t('settings.interval')}</Text>
        <Text style={styles.hint}>{t('settings.intervalHint')}</Text>
        <TextInput
          value={intervalText}
          onChangeText={setIntervalText}
          onBlur={commitInterval}
          keyboardType="number-pad"
          style={styles.num}
        />
        <Text style={styles.label}>{t('settings.cooldown')}</Text>
        <TextInput
          value={cooldownText}
          onChangeText={setCooldownText}
          onBlur={commitCooldown}
          keyboardType="number-pad"
          style={styles.num}
        />
      </Section>

      <Section title={t('settings.blocking')}>
        <Text style={styles.hint}>{t('settings.blockingHint', { count: blocked.length })}</Text>
        <Pressable onPress={() => router.push('/blocked')} style={styles.secondary}>
          <Text style={styles.secondaryText}>{t('settings.openBlockList')}</Text>
        </Pressable>
      </Section>

      <Section title={t('settings.nearby')}>
        <Text style={styles.hint}>
          {t('settings.nearbyHint', { peers: peers.length, queue: queueSize })}
        </Text>
        {peers.length === 0 ? (
          <Text style={styles.empty}>{t('settings.nobody')}</Text>
        ) : (
          peers.map((p) => (
            <View key={p.peripheralId} style={styles.peer}>
              <Text style={styles.peerName}>{p.name ?? 'MIAB'}</Text>
              <Text style={styles.monoSmall}>
                {shortId(p.peripheralId, 12)} · rssi {p.rssi ?? '—'}
                {p.inQueue ? ` · ${t('settings.queued')}` : ''}
                {p.lastError ? ` · ${p.lastError}` : ''}
              </Text>
            </View>
          ))
        )}
      </Section>

      <Section title={t('settings.radioLog')}>
        {log.length === 0 ? (
          <Text style={styles.empty}>{t('settings.noEvents')}</Text>
        ) : (
          log
            .slice()
            .reverse()
            .slice(0, 20)
            .map((entry, i) => (
              <Text key={`${entry.at}-${i}`} style={styles.log}>
                {entry.at.slice(11, 19)} {entry.level === 'error' ? '×' : '·'} {entry.message}
              </Text>
            ))
        )}
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({
  title,
  hint,
  value,
  onValueChange,
}: {
  title: string;
  hint: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.hint}>{hint}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.cardAlt, true: colors.accentDim }}
        thumbColor={value ? colors.accent : colors.muted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.md, paddingBottom: 48, gap: 16 },
  section: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: space.md,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  sectionTitle: {
    color: colors.sand,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontSize: 12,
  },
  hint: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  label: { color: colors.text, fontWeight: '600', marginTop: 4 },
  mono: { color: colors.paper, fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }), fontSize: 13 },
  monoSmall: { color: colors.muted, fontSize: 11 },
  num: {
    backgroundColor: colors.bgAlt,
    color: colors.paper,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.line,
  },
  secondary: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.bgAlt,
    borderWidth: 1,
    borderColor: colors.sand,
  },
  secondaryText: { color: colors.sand, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  rowTitle: { color: colors.text, fontWeight: '700' },
  empty: { color: colors.muted, fontStyle: 'italic' },
  peer: { gap: 2, paddingVertical: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  peerName: { color: colors.paper, fontWeight: '600' },
  log: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: colors.bgAlt,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipOn: { backgroundColor: colors.accentDim, borderColor: colors.accent },
  chipText: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  chipTextOn: { color: colors.paper },
});
