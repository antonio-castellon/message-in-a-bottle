import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { CATEGORIES, MAX_TEXT_LENGTH, type Category } from '@/src/domain/types';
import { categoryLabel } from '@/src/format';
import { useApp } from '@/src/state/AppState';
import { colors, space } from '@/src/theme';

const EXPIRY_PRESETS: { label: string; ms: number | null }[] = [
  { label: 'No expiry', ms: null },
  { label: '1 hour', ms: 60 * 60 * 1000 },
  { label: '6 hours', ms: 6 * 60 * 60 * 1000 },
  { label: '24 hours', ms: 24 * 60 * 60 * 1000 },
  { label: '7 days', ms: 7 * 24 * 60 * 60 * 1000 },
  { label: '30 days', ms: 30 * 24 * 60 * 60 * 1000 },
];

export default function ComposeScreen() {
  const { compose } = useApp();
  const router = useRouter();
  const [text, setText] = useState('');
  const [category, setCategory] = useState<Category>('other');
  const [bottleMode, setBottleMode] = useState(true);
  const [expiryMs, setExpiryMs] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (busy) return;
    setBusy(true);
    try {
      await compose({
        text,
        category,
        bottleMode,
        expiresAt: expiryMs ? new Date(Date.now() + expiryMs).toISOString() : null,
      });
      setText('');
      Alert.alert(
        bottleMode ? 'Bottle launched' : 'Direct message ready',
        bottleMode
          ? 'Whoever receives it will add it to their pool and keep transmitting it.'
          : 'Only this phone will transmit it. Others will not forward it.',
      );
      router.push('/(tabs)/pool');
    } catch (error) {
      Alert.alert('Could not create', error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.lead}>
          A text message, no server. Choose whether it travels only from this phone or becomes
          a bottle and is passed from hand to hand.
        </Text>

        <TextInput
          value={text}
          onChangeText={(value) => setText(value.slice(0, MAX_TEXT_LENGTH))}
          placeholder="Write the message…"
          placeholderTextColor={colors.muted}
          multiline
          style={styles.input}
        />
        <Text style={styles.counter}>
          {text.trim().length}/{MAX_TEXT_LENGTH}
        </Text>

        <Text style={styles.label}>Topic</Text>
        <View style={styles.chips}>
          {CATEGORIES.map((c) => (
            <Pressable
              key={c}
              onPress={() => setCategory(c)}
              style={[styles.chip, category === c && styles.chipOn]}>
              <Text style={[styles.chipText, category === c && styles.chipTextOn]}>
                {categoryLabel(c)}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Message in a bottle</Text>
            <Text style={styles.hint}>
              When on, whoever receives it will rebroadcast it. When off, it is a direct
              phone-to-phone send with no relay.
            </Text>
          </View>
          <Switch
            value={bottleMode}
            onValueChange={setBottleMode}
            trackColor={{ false: colors.cardAlt, true: colors.accentDim }}
            thumbColor={bottleMode ? colors.accent : colors.muted}
          />
        </View>

        <Text style={styles.label}>Expiry</Text>
        <View style={styles.chips}>
          {EXPIRY_PRESETS.map((p) => (
            <Pressable
              key={p.label}
              onPress={() => setExpiryMs(p.ms)}
              style={[styles.chip, expiryMs === p.ms && styles.chipOn]}>
              <Text style={[styles.chipText, expiryMs === p.ms && styles.chipTextOn]}>{p.label}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={submit}
          disabled={busy || !text.trim()}
          style={[styles.cta, (!text.trim() || busy) && styles.ctaOff]}>
          <Text style={styles.ctaText}>{bottleMode ? 'Launch bottle' : 'Leave a direct message'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.md, paddingBottom: 48, gap: 12 },
  lead: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  input: {
    minHeight: 140,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: space.md,
    color: colors.paper,
    fontSize: 17,
    lineHeight: 24,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.line,
  },
  counter: { color: colors.muted, alignSelf: 'flex-end', fontSize: 12 },
  label: { color: colors.sand, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', fontSize: 12 },
  hint: { color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipOn: { backgroundColor: colors.accentDim, borderColor: colors.accent },
  chipText: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  chipTextOn: { color: colors.paper },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 8 },
  cta: {
    marginTop: 8,
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaOff: { opacity: 0.4 },
  ctaText: { color: colors.bg, fontWeight: '800', fontSize: 16 },
});
