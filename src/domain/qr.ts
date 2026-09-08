import { isUuid } from './ids';

export const DEVICE_QR_PREFIX = 'miab:1:device:';

export function encodeDeviceQr(deviceId: string): string {
  return `${DEVICE_QR_PREFIX}${deviceId.toLowerCase()}`;
}

export function parseDeviceQr(raw: string): string | null {
  const text = raw.trim();
  const lower = text.toLowerCase();
  if (lower.startsWith(DEVICE_QR_PREFIX)) {
    const id = lower.slice(DEVICE_QR_PREFIX.length).trim();
    return isUuid(id) ? id : null;
  }
  try {
    const parsed = JSON.parse(text) as { app?: string; v?: number; deviceId?: string; t?: string };
    if (
      parsed &&
      (parsed.app === 'miab' || parsed.t === 'miab-uuid') &&
      typeof parsed.deviceId === 'string' &&
      isUuid(parsed.deviceId)
    ) {
      return parsed.deviceId.toLowerCase();
    }
  } catch {
    /* not JSON */
  }
  return isUuid(text) ? lower : null;
}
