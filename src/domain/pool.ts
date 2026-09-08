import { isExpired, parseWireMessage, wireMessage } from './ids';
import type {
  BlockedEntry,
  BottleMessage,
  Category,
  LocalMessage,
  Settings,
  WhitelistEntry,
} from './types';

export function isDeviceBlocked(blocked: BlockedEntry[], deviceId: string): boolean {
  const id = deviceId.toLowerCase();
  return blocked.some((b) => b.kind === 'device' && b.uuid.toLowerCase() === id);
}

export function isMessageBlocked(blocked: BlockedEntry[], messageId: string): boolean {
  const id = messageId.toLowerCase();
  return blocked.some((b) => b.kind === 'message' && b.uuid.toLowerCase() === id);
}

export function isOnWhitelist(list: WhitelistEntry[], deviceId: string): boolean {
  const id = deviceId.toLowerCase();
  return list.some((e) => e.uuid.toLowerCase() === id);
}

export function passesWhitelist(
  enabled: boolean,
  list: WhitelistEntry[],
  deviceId: string,
): boolean {
  if (!enabled) return true;
  return isOnWhitelist(list, deviceId);
}

export function catalogIds(messages: LocalMessage[]): string[] {
  return messages.map((m) => m.messageId);
}

export function broadcastable(
  messages: LocalMessage[],
  settings: Settings,
  at = Date.now(),
): BottleMessage[] {
  return messages
    .filter((m) => {
      if (!m.inBroadcastPool) return false;
      if (isExpired(m.expiresAt, at)) return false;
      if (m.owned) return true;
      if (!settings.acceptBottleMode) return false;
      if (!m.bottleMode) return false;
      if (!m.bottleForwardEnabled) return false;
      if (m.hopCount >= settings.maxHops) return false;
      return true;
    })
    .map(wireMessage);
}

export function ingestIncoming(
  existing: LocalMessage[],
  incoming: BottleMessage[],
  settings: Settings,
  blocked: BlockedEntry[],
  whitelist: WhitelistEntry[],
  fromDeviceId: string,
): { next: LocalMessage[]; added: LocalMessage[] } {
  const known = new Set(existing.map((m) => m.messageId.toLowerCase()));
  const added: LocalMessage[] = [];
  const now = Date.now();
  const receivedAt = new Date(now).toISOString();

  for (const raw of incoming) {
    const msg = parseWireMessage(raw);
    if (!msg) continue;
    if (known.has(msg.messageId)) continue;
    if (msg.originDeviceId === settings.deviceId) continue;
    if (isDeviceBlocked(blocked, msg.originDeviceId) || isDeviceBlocked(blocked, fromDeviceId)) {
      continue;
    }
    if (
      !passesWhitelist(settings.whitelistEnabled, whitelist, msg.originDeviceId) ||
      !passesWhitelist(settings.whitelistEnabled, whitelist, fromDeviceId)
    ) {
      continue;
    }
    if (isMessageBlocked(blocked, msg.messageId)) continue;
    if (isExpired(msg.expiresAt, now)) continue;
    if (msg.hopCount >= settings.maxHops) continue;
    if (!matchesReceiveFilter(msg, settings.acceptedLanguages, settings.acceptedCategories)) {
      continue;
    }

    const hopCount = msg.hopCount + 1;
    const bottleIntoPool =
      msg.bottleMode && settings.acceptBottleMode && hopCount < settings.maxHops;

    const local: LocalMessage = {
      ...msg,
      hopCount,
      owned: false,
      receivedAt,
      receivedFromDeviceId: fromDeviceId,
      inBroadcastPool: bottleIntoPool,
      bottleForwardEnabled: bottleIntoPool,
      seen: false,
    };
    known.add(local.messageId);
    added.push(local);
  }

  return { next: added.length ? [...added, ...existing] : existing, added };
}

export function matchesReceiveFilter(
  msg: BottleMessage,
  languages: string[] | undefined,
  categories: string[] | undefined,
): boolean {
  if (languages && languages.length > 0 && !languages.includes(msg.language)) return false;
  if (categories && categories.length > 0 && !categories.includes(msg.category)) return false;
  return true;
}

export function filterForPeer(
  messages: BottleMessage[],
  languages?: string[],
  categories?: string[],
): BottleMessage[] {
  if ((!languages || languages.length === 0) && (!categories || categories.length === 0)) {
    return messages;
  }
  return messages.filter((m) => matchesReceiveFilter(m, languages, categories as Category[] | undefined));
}

export const MAX_MESSAGES_PER_SYNC = 16;
export const MAX_CATALOG_IDS = 150;

export function messagesPeerNeeds(
  ours: BottleMessage[],
  theirHave: string[],
): BottleMessage[] {
  const have = new Set(theirHave.map((id) => id.toLowerCase()));
  return ours.filter((m) => !have.has(m.messageId.toLowerCase())).slice(0, MAX_MESSAGES_PER_SYNC);
}
