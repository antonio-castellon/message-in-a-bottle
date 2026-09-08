import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { LANGUAGES, languageLabel } from '@/src/i18n';
import { useApp } from '@/src/state/AppState';
import { colors, space } from '@/src/theme';

export default function ReceiveLanguagesScreen() {
  const { settings, updateSettings, t } = useApp();
  const [query, setQuery] = useState('');
  const selected = new Set(settings.acceptedLanguages);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = !q
      ? LANGUAGES
      : LANGUAGES.filter(
          (l) =>
            l.code.includes(q) ||
            l.name.toLowerCase().includes(q) ||
            l.native.toLowerCase().includes(q),
        );
    return [...filtered].sort((a, b) => {
      const as = selected.has(a.code) ? 0 : 1;
      const bs = selected.has(b.code) ? 0 : 1;
      if (as !== bs) return as - bs;
      return a.name.localeCompare(b.name);
    });
  }, [query, settings.acceptedLanguages]);

  function toggle(code: string) {
    const on = selected.has(code);
    const next = on
      ? settings.acceptedLanguages.filter((c) => c !== code)
      : [...settings.acceptedLanguages, code];
    if (next.length === 0) return;
    void updateSettings({ acceptedLanguages: next });
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.lead}>{t('languages.lead')}</Text>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={t('languages.search')}
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        style={styles.search}
      />
      {list.map((lang) => {
        const on = selected.has(lang.code);
        return (
          <Pressable key={lang.code} onPress={() => toggle(lang.code)} style={styles.row}>
            <View style={[styles.check, on && styles.checkOn]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{languageLabel(lang.code)}</Text>
              <Text style={styles.code}>{lang.code}</Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.md, paddingBottom: 48, gap: 8 },
  lead: { color: colors.muted, fontSize: 14, lineHeight: 20, marginBottom: 8 },
  search: {
    backgroundColor: colors.card,
    color: colors.paper,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  check: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.muted,
  },
  checkOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  name: { color: colors.paper, fontWeight: '700' },
  code: { color: colors.muted, fontSize: 12, marginTop: 2 },
});
