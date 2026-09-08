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
import { LANGUAGES, languageNative } from '@/src/i18n';
import { useApp } from '@/src/state/AppState';
import { colors, space } from '@/src/theme';

const POPULAR = ['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ar', 'ru', 'hi', 'id'];
const EXPIRY_KEYS = [
  { key: 'expiry.none' as const, ms: null },
  { key: 'expiry.h1' as const, ms: 60 * 60 * 1000 },
  { key: 'expiry.h6' as const, ms: 6 * 60 * 60 * 1000 },
  { key: 'expiry.h24' as const, ms: 24 * 60 * 60 * 1000 },
  { key: 'expiry.d7' as const, ms: 7 * 24 * 60 * 60 * 1000 },
  { key: 'expiry.d30' as const, ms: 30 * 24 * 60 * 60 * 1000 },
];

export default function ComposeScreen() {
  const { compose, t, settings } = useApp();
  const router = useRouter();
  const [text, setText] = useState('');
  const [category, setCategory] = useState<Category>('other');
  const [language, setLanguage] = useState(settings.uiLanguage);
  const [langQuery, setLangQuery] = useState('');
  const [bottleMode, setBottleMode] = useState(true);
  const [expiryMs, setExpiryMs] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const langChoices = (() => {
    const q = langQuery.trim().toLowerCase();
    if (!q) {
      const codes = new Set([language, settings.uiLanguage, ...POPULAR]);
      return LANGUAGES.filter((l) => codes.has(l.code));
    }
    return LANGUAGES.filter(
      (l) =>
        l.code.includes(q) ||
        l.name.toLowerCase().includes(q) ||
        l.native.toLowerCase().includes(q),
    ).slice(0, 24);
  })();

  async function submit() {
    if (busy) return;
    setBusy(true);
    try {
      await compose({
        text,
        category,
        language,
        bottleMode,
        expiresAt: expiryMs ? new Date(Date.now() + expiryMs).toISOString() : null,
      });
      setText('');
      Alert.alert(
        bottleMode ? t('compose.alertBottleTitle') : t('compose.alertDirectTitle'),
        bottleMode ? t('compose.alertBottleBody') : t('compose.alertDirectBody'),
      );
      router.push('/(tabs)/pool');
    } catch (error) {
      Alert.alert(t('compose.couldNotCreate'), error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.lead}>{t('compose.lead')}</Text>

        <TextInput
          value={text}
          onChangeText={(value) => setText(value.slice(0, MAX_TEXT_LENGTH))}
          placeholder={t('compose.placeholder')}
          placeholderTextColor={colors.muted}
          multiline
          style={styles.input}
        />
        <Text style={styles.counter}>
          {text.trim().length}/{MAX_TEXT_LENGTH}
        </Text>

        <Text style={styles.label}>{t('compose.topic')}</Text>
        <View style={styles.chips}>
          {CATEGORIES.map((c) => (
            <Pressable
              key={c}
              onPress={() => setCategory(c)}
              style={[styles.chip, category === c && styles.chipOn]}>
              <Text style={[styles.chipText, category === c && styles.chipTextOn]}>
                {categoryLabel(c, settings.uiLanguage)}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>{t('compose.language')}</Text>
        <TextInput
          value={langQuery}
          onChangeText={setLangQuery}
          placeholder={t('languages.search')}
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          style={styles.langSearch}
        />
        <View style={styles.chips}>
          {langChoices.map((l) => (
            <Pressable
              key={l.code}
              onPress={() => {
                setLanguage(l.code);
                setLangQuery('');
              }}
              style={[styles.chip, language === l.code && styles.chipOn]}>
              <Text style={[styles.chipText, language === l.code && styles.chipTextOn]}>
                {languageNative(l.code)}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>{t('compose.bottle')}</Text>
            <Text style={styles.hint}>{t('compose.bottleHint')}</Text>
          </View>
          <Switch
            value={bottleMode}
            onValueChange={setBottleMode}
            trackColor={{ false: colors.cardAlt, true: colors.accentDim }}
            thumbColor={bottleMode ? colors.accent : colors.muted}
          />
        </View>

        <Text style={styles.label}>{t('compose.expiry')}</Text>
        <View style={styles.chips}>
          {EXPIRY_KEYS.map((p) => (
            <Pressable
              key={p.key}
              onPress={() => setExpiryMs(p.ms)}
              style={[styles.chip, expiryMs === p.ms && styles.chipOn]}>
              <Text style={[styles.chipText, expiryMs === p.ms && styles.chipTextOn]}>{t(p.key)}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={submit}
          disabled={busy || !text.trim()}
          style={[styles.cta, (!text.trim() || busy) && styles.ctaOff]}>
          <Text style={styles.ctaText}>{bottleMode ? t('compose.launch') : t('compose.direct')}</Text>
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
  langSearch: {
    backgroundColor: colors.card,
    color: colors.paper,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.line,
  },
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
