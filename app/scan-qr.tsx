import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { parseDeviceQr } from '@/src/domain/qr';
import { useApp } from '@/src/state/AppState';
import { colors, space } from '@/src/theme';

export default function ScanQrScreen() {
  const { settings, whitelist, addToWhitelist, t } = useApp();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const lock = useRef(false);
  const [pending, setPending] = useState<{ deviceId: string; label: string } | null>(null);

  function onScan(data: string) {
    if (lock.current || pending) return;
    lock.current = true;
    const parsed = parseDeviceQr(data);
    if (!parsed) {
      Alert.alert(t('whitelist.invalidQr'), undefined, [
        { text: t('settings.cancel'), onPress: () => { lock.current = false; } },
      ]);
      return;
    }
    if (parsed.deviceId === settings.deviceId.toLowerCase()) {
      Alert.alert(t('whitelist.self'), undefined, [
        { text: t('settings.cancel'), onPress: () => { lock.current = false; } },
      ]);
      return;
    }
    if (whitelist.some((e) => e.uuid === parsed.deviceId)) {
      Alert.alert(t('whitelist.already'), undefined, [
        { text: t('settings.cancel'), onPress: () => router.back() },
      ]);
      return;
    }
    setPending({ deviceId: parsed.deviceId, label: parsed.label ?? '' });
  }

  async function confirm() {
    if (!pending) return;
    const name = pending.label.replace(/\s+/g, ' ').trim();
    if (!name) {
      Alert.alert(t('whitelist.labelRequired'));
      return;
    }
    await addToWhitelist(pending.deviceId, name);
    Alert.alert(t('whitelist.added'), name, [
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

  if (pending) {
    return (
      <View style={styles.screen}>
        <Text style={styles.lead}>{t('scanQr.nameThis')}</Text>
        <Text selectable style={styles.uuid}>
          {pending.deviceId}
        </Text>
        <Text style={styles.fieldLabel}>{t('whitelist.label')}</Text>
        <TextInput
          value={pending.label}
          onChangeText={(v) => setPending({ ...pending, label: v.slice(0, 40) })}
          placeholder={t('whitelist.labelPlaceholder')}
          placeholderTextColor={colors.muted}
          style={styles.input}
          autoFocus
        />
        <Pressable onPress={() => void confirm()} style={styles.cta}>
          <Text style={styles.ctaText}>{t('whitelist.confirmAdd')}</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            setPending(null);
            lock.current = false;
          }}>
          <Text style={styles.cancel}>{t('settings.cancel')}</Text>
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
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={({ data }) => onScan(data)}
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
  fieldLabel: {
    color: colors.sand,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  uuid: { color: colors.paper, fontSize: 12, textAlign: 'center' },
  input: {
    backgroundColor: colors.card,
    color: colors.paper,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
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
  cancel: { color: colors.sand, fontWeight: '700', textAlign: 'center', padding: 8 },
});
