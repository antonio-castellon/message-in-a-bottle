/** GATT service and characteristics for Message in a Bottle. */
export const MIAB_SERVICE = '6d696162-74c1-4e00-8000-6d6961626f74';
export const MIAB_IDENTITY = '6d696162-74c1-4e00-8001-6d6961626f74';
export const MIAB_RX = '6d696162-74c1-4e00-8002-6d6961626f74';
export const MIAB_TX = '6d696162-74c1-4e00-8003-6d6961626f74';

export const ADVERTISED_NAME = 'MIAB';

export function normalizeUuid(value: string): string {
  return value.toLowerCase();
}

export function isMiabService(uuid: string | undefined | null): boolean {
  return !!uuid && normalizeUuid(uuid) === MIAB_SERVICE;
}
