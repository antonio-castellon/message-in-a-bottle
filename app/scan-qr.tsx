import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { parseDeviceQr } from '@/src/domain/qr';
import { useApp } from '@/src/state/AppState';
import { colors, space } from '@/src/theme';

export default function ScanQrScreen() {
  const { settings, whitelist, addToWhitelist, t } = useApp();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const lock = useRef(false);
  const [torch] = useState(false);

  async function onScan(data: string) {
    if (lock.current) return;
    lock.current = true;
    const id = parseDeviceQr(data);
    if (!id) {
      Alert.alert(t('whitelist.invalidQr'), undefined, [
        { text: t('settings.cancel'), onPress: () => { lock.current = false; } },
      ]);
      return;
    }
    if (id === settings.deviceId.toLowerCase()) {
      Alert.alert(t('whitelist.self'), undefined, [
        { text: t('settings.cancel'), onPress: () => { lock.current = false; } },
      ]);
      return;
    }
    if (whitelist.some((e) => e.uuid === id)) {
      Alert.alert(t('whitelist.already'), undefined, [
        { text: t('settings.cancel'), onPress: () => router.back() },
      ]);
      return;
    }
    await addToWhitelist(id, 'qr');
    Alert.alert(t('whitelist.added'), id, [
      { text: t('settings.cancel'), onPress: () => router.back() },
    ]);
  }

  if (Platform.OS === 'web') {
    return (
      <View style={styles.center}>
        <Text style={styles.lead}>{t('scanQr.web')}</Text>
      </View>
    );
  }

  if (!permission) {
    return <View style={styles.screen} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.lead}>{t('scanQr.permission')}</Text>
        <Pressable onPress={() => void requestPermission()} style={styles.cta}>
          <Text style={styles.ctaText}>{t('scanQr.grant')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.lead}>{t('scanQr.lead')}</Text>
      <View style={styles.cameraWrap}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={torch}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={({ data }) => {
            void onScan(data);
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: space.md, gap: 12 },
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: space.lg,
    justifyContent: 'center',
    gap: 16,
  },
  lead: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  cameraWrap: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
    minHeight: 320,
  },
  cta: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  ctaText: { color: colors.bg, fontWeight: '800' },
});
