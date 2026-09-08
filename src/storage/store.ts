import AsyncStorage from '@react-native-async-storage/async-storage';

import { newUuid, nowIso } from '../domain/ids';
import {
  COOLDOWN_DEFAULT,
  INTERVAL_DEFAULT,
  MAX_HOPS_DEFAULT,
  type BlockedEntry,
  type LocalMessage,
  type RadioLogEntry,
  type Settings,
} from '../domain/types';

const KEYS = {
  settings: 'miab.settings.v1',
  messages: 'miab.messages.v1',
  blocked: 'miab.blocked.v1',
  log: 'miab.radioLog.v1',
} as const;

export interface PersistedState {
  settings: Settings;
  messages: LocalMessage[];
  blocked: BlockedEntry[];
  log: RadioLogEntry[];
}

export function defaultSettings(): Settings {
  return {
    deviceId: newUuid(),
    deviceIdCreatedAt: nowIso(),
    intervalSeconds: INTERVAL_DEFAULT,
    cooldownSeconds: COOLDOWN_DEFAULT,
    maxHops: MAX_HOPS_DEFAULT,
    radioEnabled: true,
    acceptBottleMode: true,
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
  const [settings, messages, blocked, log] = await Promise.all([
    readJson<Settings | null>(KEYS.settings, null),
    readJson<LocalMessage[]>(KEYS.messages, []),
    readJson<BlockedEntry[]>(KEYS.blocked, []),
    readJson<RadioLogEntry[]>(KEYS.log, []),
  ]);
  return {
    settings: settings?.deviceId ? { ...defaultSettings(), ...settings } : defaultSettings(),
    messages,
    blocked,
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

export async function saveLog(log: RadioLogEntry[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.log, JSON.stringify(log.slice(-80)));
}
