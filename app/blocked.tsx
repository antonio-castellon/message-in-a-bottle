import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { isUuid } from '@/src/domain/ids';
import { shortId } from '@/src/format';
import { useApp } from '@/src/state/AppState';
import { colors, space } from '@/src/theme';

export default function BlockedScreen() {
  const { blocked, blockUuid, unblockUuid } = useApp();
  const [draft, setDraft] = useState('');
  const [kind, setKind] = useState<'device' | 'message'>('device');

  function add() {
    const value = draft.trim().toLowerCase();
    if (!isUuid(value)) {
      Alert.alert('Invalid UUID', 'Paste a v4 UUID for a phone or a message.');
      return;
    }
    void blockUuid(value, kind, 'manual');
    setDraft('');
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.lead}>
        A blocked phone UUID is not accepted and is never contacted over GATT. A blocked
        message UUID is dropped even if it arrives from another origin.
      </Text>

      <View style={styles.kinds}>
        <Pressable
          onPress={() => setKind('device')}
          style={[styles.kind, kind === 'device' && styles.kindOn]}>
          <Text style={styles.kindText}>Origin phone</Text>
        </Pressable>
        <Pressable
          onPress={() => setKind('message')}
          style={[styles.kind, kind === 'message' && styles.kindOn]}>
          <Text style={styles.kindText}>Message</Text>
        </Pressable>
      </View>

      <TextInput
        value={draft}
        onChangeText={setDraft}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="uuid…"
        placeholderTextColor={colors.muted}
        style={styles.input}
      />
      <Pressable onPress={add} style={styles.cta}>
        <Text style={styles.ctaText}>Add to the list</Text>
      </Pressable>

      {blocked.length === 0 ? (
        <Text style={styles.empty}>The list is empty.</Text>
      ) : (
        blocked.map((entry) => (
          <View key={entry.uuid} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.kindBadge}>{entry.kind === 'device' ? 'phone' : 'message'}</Text>
              <Text selectable style={styles.uuid}>
                {entry.uuid}
              </Text>
              <Text style={styles.meta}>
                {shortId(entry.uuid)} · {new Date(entry.addedAt).toLocaleString()}
              </Text>
            </View>
            <Pressable onPress={() => void unblockUuid(entry.uuid)} style={styles.unblock}>
              <Text style={styles.unblockText}>Remove</Text>
            </Pressable>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.md, paddingBottom: 48, gap: 12 },
  lead: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  kinds: { flexDirection: 'row', gap: 8 },
  kind: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
  },
  kindOn: { borderColor: colors.accent, backgroundColor: colors.accentDim },
  kindText: { color: colors.paper, fontWeight: '700' },
  input: {
    backgroundColor: colors.card,
    color: colors.paper,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cta: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  ctaText: { color: colors.bg, fontWeight: '800' },
  empty: { color: colors.muted, marginTop: 12 },
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  kindBadge: {
    color: colors.sand,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  uuid: { color: colors.paper, fontSize: 12, marginTop: 4 },
  meta: { color: colors.muted, fontSize: 11, marginTop: 4 },
  unblock: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  unblockText: { color: colors.danger, fontWeight: '700' },
});
