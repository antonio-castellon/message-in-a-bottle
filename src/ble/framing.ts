import type { ProtocolMessage } from '../domain/types';

const CHUNK_MAGIC = 0x01;
/** Fits under a typical iOS ATT MTU (~185) after Android requestMTU(512). */
export const CHUNK_PAYLOAD_BYTES = 120;

export function utf8ToBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

export function bytesToUtf8(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

export function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i += 1) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim().replace(/^0x/i, '').replace(/[^0-9a-f]/gi, '');
  if (clean.length % 2 !== 0) {
    throw new Error('odd hex length');
  }
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i += 1) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export function encodeChunks(payload: ProtocolMessage): string[] {
  const json = JSON.stringify(payload);
  const body = utf8ToBytes(json);
  const total = Math.max(1, Math.ceil(body.length / CHUNK_PAYLOAD_BYTES));
  if (total > 255) {
    throw new Error('payload too large for GATT');
  }
  const frames: string[] = [];
  for (let i = 0; i < total; i += 1) {
    const slice = body.subarray(i * CHUNK_PAYLOAD_BYTES, (i + 1) * CHUNK_PAYLOAD_BYTES);
    const frame = new Uint8Array(3 + slice.length);
    frame[0] = CHUNK_MAGIC;
    frame[1] = total;
    frame[2] = i;
    frame.set(slice, 3);
    frames.push(bytesToHex(frame));
  }
  return frames;
}

export class ChunkAssembler {
  private expected = 0;
  private parts = new Map<number, Uint8Array>();

  reset(): void {
    this.expected = 0;
    this.parts.clear();
  }

  push(hex: string): ProtocolMessage | 'incomplete' | null {
    let bytes: Uint8Array;
    try {
      bytes = hexToBytes(hex);
    } catch {
      return null;
    }
    if (bytes.length < 4 || bytes[0] !== CHUNK_MAGIC) return null;
    const total = bytes[1];
    const index = bytes[2];
    if (total < 1 || index >= total) return null;
    if (this.expected !== 0 && this.expected !== total) {
      this.reset();
    }
    this.expected = total;
    this.parts.set(index, bytes.subarray(3));
    if (this.parts.size < total) return 'incomplete';
    let size = 0;
    for (let i = 0; i < total; i += 1) {
      const part = this.parts.get(i);
      if (!part) return 'incomplete';
      size += part.length;
    }
    const merged = new Uint8Array(size);
    let offset = 0;
    for (let i = 0; i < total; i += 1) {
      const part = this.parts.get(i)!;
      merged.set(part, offset);
      offset += part.length;
    }
    this.reset();
    try {
      const parsed = JSON.parse(bytesToUtf8(merged)) as ProtocolMessage;
      if (!parsed || typeof parsed !== 'object' || parsed.v !== 1) return null;
      return parsed;
    } catch {
      return null;
    }
  }
}
