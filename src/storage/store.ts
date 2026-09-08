import AsyncStorage from '@react-native-async-storage/async-storage';

import { newUuid, nowIso } from '../domain/ids';
import {
  CATEGORIES,
  COOLDOWN_DEFAULT,
  INTERVAL_DEFAULT,
  MAX_HOPS_DEFAULT,
  type BlockedEntry,
  type LocalMessage,
  type RadioLogEntry,
  type Settings,
  type WhitelistEntry,
} from '../domain/types';
import { deviceLanguage, normalizeLanguage } from '../i18n';

const KEYS = {
  settings: 'miab.settings.v1',
  messages: 'miab.messages.v1',
  blocked: 'miab.blocked.v1',
  whitelist: 'miab.whitelist.v1',
  log: 'miab.radioLog.v1',
} as const;

export interface PersistedState {
  settings: Settings;
  messages: LocalMessage[];
  blocked: BlockedEntry[];
  whitelist: WhitelistEntry[];
  log: RadioLogEntry[];
}

export function defaultSettings(): Settings {
  const ui = deviceLanguage();
  return {
    deviceId: newUuid(),
    deviceIdCreatedAt: nowIso(),
    intervalSeconds: INTERVAL_DEFAULT,
    cooldownSeconds: COOLDOWN_DEFAULT,
    maxHops: MAX_HOPS_DEFAULT,
    radioEnabled: true,
    acceptBottleMode: true,
    uiLanguage: ui,
    acceptedLanguages: [ui],
    acceptedCategories: [...CATEGORIES],
    whitelistEnabled: false,
    shareName: '',
  };
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function loadState(): Promise<PersistedState> {
  const [settings, messages, blocked, whitelist, log] = await Promise.all([
    readJson<Settings | null>(KEYS.settings, null),
    readJson<LocalMessage[]>(KEYS.messages, []),
    readJson<BlockedEntry[]>(KEYS.blocked, []),
    readJson<WhitelistEntry[]>(KEYS.whitelist, []),
    readJson<RadioLogEntry[]>(KEYS.log, []),
  ]);
  const base = defaultSettings();
  const merged: Settings = settings?.deviceId
    ? {
        ...base,
        ...settings,
        uiLanguage: settings.uiLanguage ?? base.uiLanguage,
        acceptedLanguages:
          settings.acceptedLanguages?.length > 0 ? settings.acceptedLanguages : [settings.uiLanguage ?? base.uiLanguage],
        acceptedCategories:
          settings.acceptedCategories?.length > 0 ? settings.acceptedCategories : [...CATEGORIES],
        whitelistEnabled: settings.whitelistEnabled ?? false,
        shareName: settings.shareName ?? '',
      }
    : base;
  const fallbackLang = merged.uiLanguage;
  const migrated = messages.map((m) => ({
    ...m,
    language: normalizeLanguage((m as LocalMessage).language) ?? fallbackLang,
  }));
  return {
    settings: merged,
    messages: migrated,
    blocked,
    whitelist: whitelist.map((e) => ({
      uuid: e.uuid,
      label: (e.label || (e as { note?: string }).note || e.uuid.slice(0, 8)).trim(),
      addedAt: e.addedAt,
    })),
    log: log.slice(-80),
  };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await AsyncStorage.setItem(KEYS.settings, JSON.stringify(settings));
}

export async function saveMessages(messages: LocalMessage[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.messages, JSON.stringify(messages));
}

export async function saveBlocked(blocked: BlockedEntry[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.blocked, JSON.stringify(blocked));
}

export async function saveWhitelist(whitelist: WhitelistEntry[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.whitelist, JSON.stringify(whitelist));
}

export async function saveLog(log: RadioLogEntry[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.log, JSON.stringify(log.slice(-80)));
}
