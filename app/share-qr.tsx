import { StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { encodeDeviceQr } from '@/src/domain/qr';
import { useApp } from '@/src/state/AppState';
import { colors, space } from '@/src/theme';

export default function ShareQrScreen() {
  const { settings, t } = useApp();
  const payload = encodeDeviceQr(settings.deviceId);

  return (
    <View style={styles.screen}>
      <Text style={styles.lead}>{t('shareQr.lead')}</Text>
      <View style={styles.card}>
        <QRCode
          value={payload}
          size={240}
          backgroundColor={colors.paper}
          color={colors.ink}
        />
      </View>
      <Text selectable style={styles.uuid}>
        {settings.deviceId}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: space.lg,
    alignItems: 'center',
    gap: 16,
  },
  lead: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  card: {
    backgroundColor: colors.paper,
    padding: 20,
    borderRadius: 20,
  },
  uuid: { color: colors.paper, fontSize: 12, textAlign: 'center' },
});
