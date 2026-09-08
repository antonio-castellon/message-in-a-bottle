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

import { shortId } from '@/src/format';
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
    Alert.alert(
      'Regenerate this phone UUID',
      'A new identity is created to keep you anonymous. Messages you wrote will be signed with the new UUID. Copies already spread may still show the old one on other phones.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Regenerate',
          style: 'destructive',
          onPress: () => {
            void regenerateDeviceId().then((id) => {
              Alert.alert('New identity', id);
            });
          },
        },
      ],
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <RadioBanner />

      <Section title="Identity">
        <Text style={styles.mono}>{settings.deviceId}</Text>
        <Text style={styles.hint}>
          Origin UUID for this phone. It is generated on install and you can regenerate it any time.
        </Text>
        <Pressable onPress={confirmRegen} style={styles.secondary}>
          <Text style={styles.secondaryText}>Regenerate UUID</Text>
        </Pressable>
      </Section>

      <Section title="GATT radio">
        <Row
          title="Transmit and listen"
          hint="Advertises the service and scans nearby phones. No internet."
          value={settings.radioEnabled}
          onValueChange={(v) => void toggleRadio(v)}
        />
        <Row
          title="Accept bottles from others"
          hint="If off, incoming message-in-a-bottle items do not enter your forwarding pool."
          value={settings.acceptBottleMode}
          onValueChange={(v) => void updateSettings({ acceptBottleMode: v })}
        />
        <Text style={styles.label}>Interval between connections (seconds)</Text>
        <Text style={styles.hint}>
          When many UUIDs are nearby, GATT sessions are serialized. This interval is the pause
          between one phone and the next.
        </Text>
        <TextInput
          value={intervalText}
          onChangeText={setIntervalText}
          onBlur={commitInterval}
          keyboardType="number-pad"
          style={styles.num}
        />
        <Text style={styles.label}>Cooldown after a sync (seconds)</Text>
        <TextInput
          value={cooldownText}
          onChangeText={setCooldownText}
          onBlur={commitCooldown}
          keyboardType="number-pad"
          style={styles.num}
        />
      </Section>

      <Section title="Blocking">
        <Text style={styles.hint}>
          {blocked.length} UUIDs blocked. Messages from them are rejected and GATT is not opened.
        </Text>
        <Pressable onPress={() => router.push('/blocked')} style={styles.secondary}>
          <Text style={styles.secondaryText}>Open block list</Text>
        </Pressable>
      </Section>

      <Section title="Nearby queue">
        <Text style={styles.hint}>
          {peers.length} recent advertisements · {queueSize} queued. One GATT link at a time.
        </Text>
        {peers.length === 0 ? (
          <Text style={styles.empty}>Nobody in range right now.</Text>
        ) : (
          peers.map((p) => (
            <View key={p.peripheralId} style={styles.peer}>
              <Text style={styles.peerName}>{p.name ?? 'MIAB'}</Text>
              <Text style={styles.monoSmall}>
                {shortId(p.peripheralId, 12)} · rssi {p.rssi ?? '—'}
                {p.inQueue ? ' · queued' : ''}
                {p.lastError ? ` · ${p.lastError}` : ''}
              </Text>
            </View>
          ))
        )}
      </Section>

      <Section title="Radio log">
        {log.length === 0 ? (
          <Text style={styles.empty}>No events yet.</Text>
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
});
