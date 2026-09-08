import { StyleSheet, Text, View } from 'react-native';

import { useApp } from '../state/AppState';
import { colors, space } from '../theme';

const STATUS_LABEL: Record<string, string> = {
  off: 'Radio off',
  starting: 'Starting GATT…',
  on: 'On air · GATT',
  syncing: 'Syncing…',
  error: 'Radio error',
  unsupported: 'Bluetooth unavailable',
};

export function RadioBanner() {
  const { status, statusDetail, peers, queueSize, syncingWith, settings } = useApp();
  const nearby = peers.length;
  return (
    <View style={styles.wrap}>
      <View style={[styles.dot, status === 'on' || status === 'syncing' ? styles.dotOn : styles.dotOff]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{STATUS_LABEL[status] ?? status}</Text>
        <Text style={styles.sub}>
          {statusDetail
            ? statusDetail
            : `${nearby} nearby · queue ${queueSize} · every ${settings.intervalSeconds}s`}
          {syncingWith ? ` · ${syncingWith.slice(0, 6)}…` : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: space.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotOn: { backgroundColor: colors.accent },
  dotOff: { backgroundColor: colors.danger },
  title: { color: colors.text, fontWeight: '700', fontSize: 14 },
  sub: { color: colors.muted, fontSize: 12, marginTop: 2 },
});
