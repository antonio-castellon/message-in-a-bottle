import { isUuid } from './ids';

export const DEVICE_QR_PREFIX = 'miab:1:device:';

export interface DeviceQr {
  deviceId: string;
  label?: string;
}

export function encodeDeviceQr(deviceId: string, label?: string): string {
  const id = deviceId.toLowerCase();
  const name = label?.trim().slice(0, 40);
  if (name) {
    return JSON.stringify({ app: 'miab', v: 1, deviceId: id, label: name });
  }
  return `${DEVICE_QR_PREFIX}${id}`;
}

export function parseDeviceQr(raw: string): DeviceQr | null {
  const text = raw.trim();
  const lower = text.toLowerCase();
  if (lower.startsWith(DEVICE_QR_PREFIX)) {
    const id = lower.slice(DEVICE_QR_PREFIX.length).trim();
    return isUuid(id) ? { deviceId: id } : null;
  }
  try {
    const parsed = JSON.parse(text) as {
      app?: string;
      v?: number;
      deviceId?: string;
      t?: string;
      label?: string;
    };
    if (
      parsed &&
      (parsed.app === 'miab' || parsed.t === 'miab-uuid') &&
      typeof parsed.deviceId === 'string' &&
      isUuid(parsed.deviceId)
    ) {
      const label =
        typeof parsed.label === 'string' && parsed.label.trim()
          ? parsed.label.trim().slice(0, 40)
          : undefined;
      return { deviceId: parsed.deviceId.toLowerCase(), label };
    }
  } catch {
    /* not JSON */
  }
  return isUuid(text) ? { deviceId: lower } : null;
}
