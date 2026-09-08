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
      'Regenerar UUID del móvil',
      'Se crea una identidad nueva para mantener el anonimato. Los mensajes que tú escribiste pasarán a firmarse con el UUID nuevo. Los ya difundidos pueden seguir mostrando el anterior en otros teléfonos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Regenerar',
          style: 'destructive',
          onPress: () => {
            void regenerateDeviceId().then((id) => {
              Alert.alert('Nueva identidad', id);
            });
          },
        },
      ],
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <RadioBanner />

      <Section title="Identidad">
        <Text style={styles.mono}>{settings.deviceId}</Text>
        <Text style={styles.hint}>
          UUID de origen de este móvil. Se genera al instalar y puedes regenerarlo cuando quieras.
        </Text>
        <Pressable onPress={confirmRegen} style={styles.secondary}>
          <Text style={styles.secondaryText}>Regenerar UUID</Text>
        </Pressable>
      </Section>

      <Section title="Radio GATT">
        <Row
          title="Transmitir y escuchar"
          hint="Anuncia el servicio y escanea móviles cercanos. Sin internet."
          value={settings.radioEnabled}
          onValueChange={(v) => void toggleRadio(v)}
        />
        <Row
          title="Aceptar botellas ajenas"
          hint="Si se desactiva, los message-in-a-bottle recibidos no entran en tu pool de reenvío."
          value={settings.acceptBottleMode}
          onValueChange={(v) => void updateSettings({ acceptBottleMode: v })}
        />
        <Text style={styles.label}>Intervalo entre conexiones (segundos)</Text>
        <Text style={styles.hint}>
          Con muchos UUID cerca, las sesiones GATT se serializan. Este intervalo es la pausa
          entre un móvil y el siguiente.
        </Text>
        <TextInput
          value={intervalText}
          onChangeText={setIntervalText}
          onBlur={commitInterval}
          keyboardType="number-pad"
          style={styles.num}
        />
        <Text style={styles.label}>Enfriamiento tras un sync (segundos)</Text>
        <TextInput
          value={cooldownText}
          onChangeText={setCooldownText}
          onBlur={commitCooldown}
          keyboardType="number-pad"
          style={styles.num}
        />
      </Section>

      <Section title="Bloqueo">
        <Text style={styles.hint}>
          {blocked.length} UUID bloqueados. No se aceptan mensajes ni se abre GATT con ellos.
        </Text>
        <Pressable onPress={() => router.push('/blocked')} style={styles.secondary}>
          <Text style={styles.secondaryText}>Abrir lista de bloqueo</Text>
        </Pressable>
      </Section>

      <Section title="Cola cercana">
        <Text style={styles.hint}>
          {peers.length} anuncios recientes · {queueSize} en cola. Un solo enlace GATT a la vez.
        </Text>
        {peers.length === 0 ? (
          <Text style={styles.empty}>Nadie al alcance ahora mismo.</Text>
        ) : (
          peers.map((p) => (
            <View key={p.peripheralId} style={styles.peer}>
              <Text style={styles.peerName}>{p.name ?? 'MIAB'}</Text>
              <Text style={styles.monoSmall}>
                {shortId(p.peripheralId, 12)} · rssi {p.rssi ?? '—'}
                {p.inQueue ? ' · en cola' : ''}
                {p.lastError ? ` · ${p.lastError}` : ''}
              </Text>
            </View>
          ))
        )}
      </Section>

      <Section title="Diario de radio">
        {log.length === 0 ? (
          <Text style={styles.empty}>Sin eventos todavía.</Text>
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
