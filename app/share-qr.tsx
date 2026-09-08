import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { encodeDeviceQr } from '@/src/domain/qr';
import { useApp } from '@/src/state/AppState';
import { colors, space } from '@/src/theme';

export default function ShareQrScreen() {
  const { settings, updateSettings, t } = useApp();
  const payload = encodeDeviceQr(settings.deviceId, settings.shareName);

  return (
    <View style={styles.screen}>
      <Text style={styles.lead}>{t('shareQr.lead')}</Text>

      <View style={styles.qrCard}>
        <QRCode value={payload} size={240} backgroundColor={colors.paper} color={colors.ink} />
      </View>

      <Text style={styles.fieldLabel}>{t('shareQr.yourUuid')}</Text>
      <Pressable
        onPress={() => {
          Alert.alert(t('shareQr.yourUuid'), settings.deviceId);
        }}
        style={styles.uuidBox}>
        <Text selectable style={styles.uuid}>
          {settings.deviceId}
        </Text>
        <Text style={styles.uuidHint}>{t('shareQr.uuidHint')}</Text>
      </Pressable>

      <Text style={styles.fieldLabel}>{t('shareQr.name')}</Text>
      <Text style={styles.hint}>{t('shareQr.nameHint')}</Text>
      <TextInput
        value={settings.shareName}
        onChangeText={(v) => void updateSettings({ shareName: v.slice(0, 40) })}
        placeholder={t('shareQr.namePlaceholder')}
        placeholderTextColor={colors.muted}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: space.lg,
    alignItems: 'center',
    gap: 10,
  },
  lead: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  qrCard: {
    backgroundColor: colors.paper,
    padding: 20,
    borderRadius: 20,
    marginVertical: 8,
  },
  fieldLabel: {
    color: colors.sand,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    alignSelf: 'stretch',
    marginTop: 8,
  },
  hint: { color: colors.muted, fontSize: 13, lineHeight: 18, alignSelf: 'stretch' },
  input: {
    alignSelf: 'stretch',
    backgroundColor: colors.card,
    color: colors.paper,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  uuidBox: {
    alignSelf: 'stretch',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 4,
  },
  uuid: { color: colors.paper, fontSize: 13 },
  uuidHint: { color: colors.muted, fontSize: 12 },
});
