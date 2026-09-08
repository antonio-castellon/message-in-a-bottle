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
  const { blocked, blockUuid, renameBlocked, unblockUuid, t } = useApp();
  const [draft, setDraft] = useState('');
  const [label, setLabel] = useState('');
  const [kind, setKind] = useState<'device' | 'message'>('device');
  const [editing, setEditing] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');

  function add() {
    const value = draft.trim().toLowerCase();
    const name = label.replace(/\s+/g, ' ').trim();
    if (!name) {
      Alert.alert(t('blocked.labelRequired'));
      return;
    }
    if (!isUuid(value)) {
      Alert.alert(t('blocked.invalidTitle'), t('blocked.invalidBody'));
      return;
    }
    void blockUuid(value, kind, name);
    setDraft('');
    setLabel('');
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.lead}>{t('blocked.lead')}</Text>

      <View style={styles.kinds}>
        <Pressable
          onPress={() => setKind('device')}
          style={[styles.kind, kind === 'device' && styles.kindOn]}>
          <Text style={styles.kindText}>{t('blocked.originPhone')}</Text>
        </Pressable>
        <Pressable
          onPress={() => setKind('message')}
          style={[styles.kind, kind === 'message' && styles.kindOn]}>
          <Text style={styles.kindText}>{t('blocked.message')}</Text>
        </Pressable>
      </View>

      <Text style={styles.fieldLabel}>{t('blocked.label')}</Text>
      <TextInput
        value={label}
        onChangeText={(v) => setLabel(v.slice(0, 40))}
        placeholder={t('blocked.labelPlaceholder')}
        placeholderTextColor={colors.muted}
        style={styles.input}
      />
      <Text style={styles.fieldLabel}>UUID</Text>
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
        <Text style={styles.ctaText}>{t('blocked.add')}</Text>
      </Pressable>

      {blocked.length === 0 ? (
        <Text style={styles.empty}>{t('blocked.empty')}</Text>
      ) : (
        blocked.map((entry) => (
          <View key={entry.uuid} style={styles.row}>
            {editing === entry.uuid ? (
              <View style={{ flex: 1, gap: 8 }}>
                <TextInput
                  value={editLabel}
                  onChangeText={(v) => setEditLabel(v.slice(0, 40))}
                  style={styles.input}
                  autoFocus
                />
                <Pressable
                  onPress={() => {
                    void renameBlocked(entry.uuid, editLabel);
                    setEditing(null);
                  }}
                  style={styles.renameBtn}>
                  <Text style={styles.renameText}>{t('blocked.saveLabel')}</Text>
                </Pressable>
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                <Text style={styles.kindBadge}>
                  {entry.kind === 'device' ? t('blocked.kindPhone') : t('blocked.kindMessage')}
                </Text>
                <Text style={styles.name}>{entry.label}</Text>
                <Text selectable style={styles.uuid}>
                  {entry.uuid}
                </Text>
                <Text style={styles.meta}>
                  {shortId(entry.uuid)} · {new Date(entry.addedAt).toLocaleString()}
                </Text>
                <Pressable
                  onPress={() => {
                    setEditing(entry.uuid);
                    setEditLabel(entry.label);
                  }}>
                  <Text style={styles.renameText}>{t('blocked.rename')}</Text>
                </Pressable>
              </View>
            )}
            <Pressable onPress={() => void unblockUuid(entry.uuid)} style={styles.unblock}>
              <Text style={styles.unblockText}>{t('blocked.remove')}</Text>
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
  fieldLabel: {
    color: colors.sand,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
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
    alignItems: 'flex-start',
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
  name: { color: colors.paper, fontSize: 16, fontWeight: '700', marginTop: 4 },
  uuid: { color: colors.muted, fontSize: 12, marginTop: 4 },
  meta: { color: colors.muted, fontSize: 11, marginTop: 4 },
  renameBtn: { alignSelf: 'flex-start' },
  renameText: { color: colors.sand, fontWeight: '700', fontSize: 13, marginTop: 8 },
  unblock: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  unblockText: { color: colors.danger, fontWeight: '700' },
});
