import * as Crypto from 'expo-crypto';

import { isLanguageCode, normalizeLanguage } from '../i18n/languages';
import { CATEGORIES, type BottleMessage, type Category } from './types';

export function newUuid(): string {
  return Crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function isExpired(expiresAt: string | null, at = Date.now()): boolean {
  if (!expiresAt) return false;
  const t = Date.parse(expiresAt);
  return Number.isFinite(t) && t <= at;
}

export function isCategory(value: unknown): value is Category {
  return typeof value === 'string' && (CATEGORIES as readonly string[]).includes(value);
}

export function isUuid(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

export function sanitizeText(text: string, max = 280): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, max);
}

export function wireMessage(msg: BottleMessage): BottleMessage {
  return {
    messageId: msg.messageId,
    originDeviceId: msg.originDeviceId,
    text: msg.text,
    category: msg.category,
    language: msg.language,
    bottleMode: msg.bottleMode,
    createdAt: msg.createdAt,
    expiresAt: msg.expiresAt,
    hopCount: msg.hopCount,
  };
}

export function parseWireMessage(raw: unknown): BottleMessage | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (!isUuid(o.messageId) || !isUuid(o.originDeviceId)) return null;
  if (typeof o.text !== 'string') return null;
  const text = sanitizeText(o.text);
  if (!text) return null;
  if (!isCategory(o.category)) return null;
  const language =
    typeof o.language === 'string' ? normalizeLanguage(o.language) : null;
  if (!language || !isLanguageCode(language)) return null;
  if (typeof o.bottleMode !== 'boolean') return null;
  if (typeof o.createdAt !== 'string' || !Number.isFinite(Date.parse(o.createdAt))) {
    return null;
  }
  const expiresAt =
    o.expiresAt === null || o.expiresAt === undefined
      ? null
      : typeof o.expiresAt === 'string' && Number.isFinite(Date.parse(o.expiresAt))
        ? o.expiresAt
        : null;
  const hopCount = typeof o.hopCount === 'number' && o.hopCount >= 0 ? Math.floor(o.hopCount) : 0;
  return {
    messageId: o.messageId.toLowerCase(),
    originDeviceId: o.originDeviceId.toLowerCase(),
    text,
    category: o.category,
    language,
    bottleMode: o.bottleMode,
    createdAt: o.createdAt,
    expiresAt,
    hopCount,
  };
}
