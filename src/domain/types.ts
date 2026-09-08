export const CATEGORIES = [
  'sports',
  'politics',
  'philosophy',
  'lifestyle',
  'science',
  'art',
  'humor',
  'news',
  'other',
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  sports: 'Sports',
  politics: 'Politics',
  philosophy: 'Philosophy',
  lifestyle: 'Lifestyle',
  science: 'Science',
  art: 'Art',
  humor: 'Humor',
  news: 'News',
  other: 'Other',
};

export const MAX_TEXT_LENGTH = 280;
export const PROTOCOL_VERSION = 1;
export const MAX_HOPS_DEFAULT = 32;
export const INTERVAL_DEFAULT = 8;
export const COOLDOWN_DEFAULT = 45;

export interface BottleMessage {
  messageId: string;
  originDeviceId: string;
  text: string;
  category: Category;
  bottleMode: boolean;
  createdAt: string;
  expiresAt: string | null;
  hopCount: number;
}

export interface LocalMessage extends BottleMessage {
  owned: boolean;
  receivedAt: string | null;
  receivedFromDeviceId: string | null;
  inBroadcastPool: boolean;
  bottleForwardEnabled: boolean;
  seen: boolean;
}

export interface Settings {
  deviceId: string;
  deviceIdCreatedAt: string;
  intervalSeconds: number;
  cooldownSeconds: number;
  maxHops: number;
  radioEnabled: boolean;
  acceptBottleMode: boolean;
}

export interface BlockedEntry {
  uuid: string;
  kind: 'device' | 'message';
  addedAt: string;
  note?: string;
}

export type RadioStatus =
  | 'off'
  | 'starting'
  | 'on'
  | 'syncing'
  | 'error'
  | 'unsupported';

export interface NearbyPeer {
  peripheralId: string;
  name: string | null;
  rssi: number | null;
  lastSeenAt: string;
  lastSyncAt: string | null;
  lastError: string | null;
  inQueue: boolean;
}

export interface RadioLogEntry {
  at: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

export type ProtocolType = 'hello' | 'offer' | 'push' | 'done' | 'reject';

export interface HelloPayload {
  v: typeof PROTOCOL_VERSION;
  t: 'hello';
  deviceId: string;
  have: string[];
}

export interface OfferPayload {
  v: typeof PROTOCOL_VERSION;
  t: 'offer';
  deviceId: string;
  have: string[];
  messages: BottleMessage[];
}

export interface PushPayload {
  v: typeof PROTOCOL_VERSION;
  t: 'push';
  messages: BottleMessage[];
}

export interface DonePayload {
  v: typeof PROTOCOL_VERSION;
  t: 'done';
}

export interface RejectPayload {
  v: typeof PROTOCOL_VERSION;
  t: 'reject';
  reason: string;
}

export type ProtocolMessage =
  | HelloPayload
  | OfferPayload
  | PushPayload
  | DonePayload
  | RejectPayload;
