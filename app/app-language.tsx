import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { LANGUAGES, UI_LOCALES, languageLabel } from '@/src/i18n';
import { useApp } from '@/src/state/AppState';
import { colors, space } from '@/src/theme';

export default function AppLanguageScreen() {
  const { settings, updateSettings, t } = useApp();
  const options = UI_LOCALES
    .map((code) => LANGUAGES.find((l) => l.code === code))
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.lead}>{t('languages.appLead')}</Text>
      {options.map((lang) => {
        const on = settings.uiLanguage === lang.code;
        return (
          <Pressable
            key={lang.code}
            onPress={() => void updateSettings({ uiLanguage: lang.code })}
            style={styles.row}>
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
