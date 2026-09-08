import { PermissionsAndroid, Platform } from 'react-native';
import {
  addEventListener,
  connect,
  disconnect,
  discoverServices,
  isBluetoothEnabled,
  readCharacteristic,
  requestBluetoothPermission,
  requestMTU,
  setServices,
  startAdvertising,
  startScan,
  stopAdvertising,
  stopScan,
  subscribeToCharacteristic,
  updateCharacteristicValue,
  writeCharacteristic,
  type BLEDevice,
} from 'munim-bluetooth';

import { nowIso } from '../domain/ids';
import { filterForPeer, isDeviceBlocked, messagesPeerNeeds, passesWhitelist } from '../domain/pool';
import type {
  BlockedEntry,
  BottleMessage,
  NearbyPeer,
  ProtocolMessage,
  RadioLogEntry,
  RadioStatus,
  Settings,
  WhitelistEntry,
} from '../domain/types';
import { bytesToHex, bytesToUtf8, ChunkAssembler, encodeChunks, hexToBytes, utf8ToBytes } from './framing';
import { ADVERTISED_NAME, MIAB_IDENTITY, MIAB_RX, MIAB_SERVICE, MIAB_TX, normalizeUuid } from './uuids';

export interface RadioHost {
  getSettings: () => Settings;
  getBlocked: () => BlockedEntry[];
  getWhitelist: () => WhitelistEntry[];
  catalogIds: () => string[];
  getReceiveFilter: () => { languages: string[]; categories: string[] };
  offerFor: (have: string[]) => BottleMessage[];
  ingest: (messages: BottleMessage[], fromDeviceId: string) => void;
  onStatus: (status: RadioStatus, detail?: string) => void;
  onPeers: (peers: NearbyPeer[], queueSize: number, syncingWith: string | null) => void;
  onLog: (entry: RadioLogEntry) => void;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function looksLikePeer(device: BLEDevice): boolean {
  const uuids = (device.serviceUUIDs ?? []).map((u) => normalizeUuid(u));
  if (uuids.includes(MIAB_SERVICE)) return true;
  const name = (device.localName || device.name || '').trim();
  return name === ADVERTISED_NAME || name.startsWith(`${ADVERTISED_NAME}-`);
}

class RadioEngine {
  private host: RadioHost | null = null;
  private running = false;
  private pumpTimer: ReturnType<typeof setTimeout> | null = null;
  private unsubs: Array<() => void> = [];
  private peers = new Map<string, NearbyPeer>();
  private queue: string[] = [];
  private cooldownUntil = new Map<string, number>();
  private knownDeviceIds = new Map<string, string>();
  private inbound = new Map<string, ChunkAssembler>();
  private outboundBusy = false;
  private inboundBusyUntil = 0;
  private syncingWith: string | null = null;

  bind(host: RadioHost): void {
    this.host = host;
  }

  async start(): Promise<void> {
    if (Platform.OS === 'web') {
      this.host?.onStatus('unsupported', 'Bluetooth GATT is not available on web.');
      return;
    }
    if (this.running) return;
    this.running = true;
    this.host?.onStatus('starting');
    try {
      if (Platform.OS === 'android') {
        try {
          await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
        } catch {
          /* older APIs still proceed via munim */
        }
      }
      const granted = await requestBluetoothPermission(['scan', 'connect', 'advertise']);
      if (!granted) {
        this.running = false;
        this.host?.onStatus('error', 'Bluetooth permission denied.');
        return;
      }
      const enabled = await isBluetoothEnabled();
      if (!enabled) {
        this.running = false;
        this.host?.onStatus('error', 'Turn on Bluetooth to transmit.');
        return;
      }

      const deviceId = this.host!.getSettings().deviceId;
      setServices(
        [
          {
            uuid: MIAB_SERVICE,
            characteristics: [
              {
                uuid: MIAB_IDENTITY,
                properties: ['read'],
                value: bytesToHex(utf8ToBytes(deviceId)),
              },
              {
                uuid: MIAB_RX,
                properties: ['write', 'writeWithoutResponse'],
                permissions: ['write'],
                value: '00',
              },
              {
                uuid: MIAB_TX,
                properties: ['read', 'notify'],
                permissions: ['read'],
                value: '00',
              },
            ],
          },
        ],
        { mode: 'automatic', timeoutMs: 4000 },
      );

      this.listen();
      startAdvertising({
        serviceUUIDs: [MIAB_SERVICE],
        localName: ADVERTISED_NAME,
      });
      startScan({
        allowDuplicates: true,
        scanMode: 'balanced',
      });
      this.host?.onStatus('on');
      this.log('info', 'GATT radio on: advertising and scanning.');
      this.schedulePump(500);
    } catch (error) {
      this.running = false;
      const message = error instanceof Error ? error.message : String(error);
      this.host?.onStatus('error', message);
      this.log('error', `Could not start the radio: ${message}`);
    }
  }

  async stop(): Promise<void> {
    this.running = false;
    if (this.pumpTimer) {
      clearTimeout(this.pumpTimer);
      this.pumpTimer = null;
    }
    this.unsubs.forEach((u) => u());
    this.unsubs = [];
    try {
      stopScan();
    } catch {
      /* ignore */
    }
    try {
      stopAdvertising();
    } catch {
      /* ignore */
    }
    this.queue = [];
    this.syncingWith = null;
    this.host?.onStatus('off');
    this.emitPeers();
    this.log('info', 'Radio stopped.');
  }

  async refreshIdentity(deviceId: string): Promise<void> {
    try {
      await updateCharacteristicValue(
        MIAB_SERVICE,
        MIAB_IDENTITY,
        bytesToHex(utf8ToBytes(deviceId)),
        false,
      );
    } catch (error) {
      this.log('warn', `Could not publish the new identity: ${String(error)}`);
    }
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  private listen(): void {
    this.unsubs.push(
      addEventListener('deviceFound', (device) => {
        this.onDeviceFound(device);
      }),
      addEventListener('advertisingStartFailed', (event) => {
        this.log('error', `Advertising failed: ${event.message ?? event.error ?? 'unknown'}`);
      }),
      addEventListener('scanFailed', (event) => {
        this.log('error', `Scan failed: ${event.message}`);
      }),
      addEventListener('peripheralWriteRequest', (event) => {
        if (normalizeUuid(event.characteristicUUID) !== MIAB_RX) return;
        void this.onInboundFrame(event.centralId, event.value);
      }),
      addEventListener('peripheralSubscribed', (event) => {
        if (normalizeUuid(event.characteristicUUID) === MIAB_TX) {
          this.inboundBusyUntil = Date.now() + 12_000;
        }
      }),
      addEventListener('characteristicValueChanged', (event) => {
        if (normalizeUuid(event.characteristicUUID) !== MIAB_TX) return;
        this.onOutboundNotify(event.deviceId, event.value);
      }),
    );
  }

  private onDeviceFound(device: BLEDevice): void {
    if (!this.running || !looksLikePeer(device)) return;
    const existing = this.peers.get(device.id);
    const peer: NearbyPeer = {
      peripheralId: device.id,
      name: device.localName || device.name || existing?.name || ADVERTISED_NAME,
      rssi: device.rssi ?? existing?.rssi ?? null,
      lastSeenAt: nowIso(),
      lastSyncAt: existing?.lastSyncAt ?? null,
      lastError: existing?.lastError ?? null,
      inQueue: existing?.inQueue ?? false,
    };
    this.peers.set(device.id, peer);
    this.enqueue(device.id);
    this.prunePeers();
    this.emitPeers();
  }

  private enqueue(peripheralId: string): void {
    if (this.queue.includes(peripheralId)) return;
    const knownUuid = this.knownDeviceIds.get(peripheralId);
    if (knownUuid && this.host && isDeviceBlocked(this.host.getBlocked(), knownUuid)) {
      return;
    }
    const until = this.cooldownUntil.get(peripheralId) ?? 0;
    if (Date.now() < until) return;
    this.queue.push(peripheralId);
    const peer = this.peers.get(peripheralId);
    if (peer) peer.inQueue = true;
  }

  private schedulePump(delayMs: number): void {
    if (this.pumpTimer) clearTimeout(this.pumpTimer);
    this.pumpTimer = setTimeout(() => {
      void this.pump();
    }, delayMs);
  }

  private async pump(): Promise<void> {
    if (!this.running) return;
    const interval = Math.max(3, this.host?.getSettings().intervalSeconds ?? 8) * 1000;
    try {
      if (!this.outboundBusy && Date.now() >= this.inboundBusyUntil) {
        const next = this.takeNext();
        if (next) {
          await this.syncAsCentral(next);
        }
      }
    } catch (error) {
      this.log('error', `Queue: ${error instanceof Error ? error.message : String(error)}`);
    }
    this.schedulePump(interval);
  }

  private takeNext(): string | null {
    const now = Date.now();
    while (this.queue.length > 0) {
      const id = this.queue.shift()!;
      const peer = this.peers.get(id);
      if (peer) peer.inQueue = false;
      const until = this.cooldownUntil.get(id) ?? 0;
      if (now < until) continue;
      return id;
    }
    return null;
  }

  private markCooldown(peripheralId: string, extraKey?: string): void {
    const seconds = this.host?.getSettings().cooldownSeconds ?? 45;
    const until = Date.now() + Math.max(5, seconds) * 1000;
    this.cooldownUntil.set(peripheralId, until);
    if (extraKey) this.cooldownUntil.set(extraKey, until);
  }

  private outboundWaiters = new Map<
    string,
    { assembler: ChunkAssembler; resolve: (msg: ProtocolMessage) => void; reject: (err: Error) => void }
  >();

  private onOutboundNotify(deviceId: string, hex: string): void {
    const waiter = this.outboundWaiters.get(deviceId);
    if (!waiter) return;
    const result = waiter.assembler.push(hex);
    if (result === 'incomplete' || result === null) return;
    waiter.resolve(result);
  }

  private waitForPeerMessage(deviceId: string, timeoutMs: number): Promise<ProtocolMessage> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.outboundWaiters.delete(deviceId);
        reject(new Error('GATT wait timed out'));
      }, timeoutMs);
      this.outboundWaiters.set(deviceId, {
        assembler: new ChunkAssembler(),
        resolve: (msg) => {
          clearTimeout(timer);
          this.outboundWaiters.delete(deviceId);
          resolve(msg);
        },
        reject,
      });
    });
  }

  private async syncAsCentral(peripheralId: string): Promise<void> {
    if (!this.host) return;
    this.outboundBusy = true;
    this.syncingWith = peripheralId;
    this.host.onStatus('syncing');
    this.emitPeers();
    this.log('info', `Connecting to ${peripheralId.slice(0, 8)}…`);
    try {
      await connect(peripheralId);
      try {
        await requestMTU(peripheralId, 512);
      } catch {
        /* iOS negotiates MTU itself */
      }
      await discoverServices(peripheralId);
      const identity = await readCharacteristic(peripheralId, MIAB_SERVICE, MIAB_IDENTITY);
      const peerDeviceId = bytesToUtf8(hexToBytes(identity.value)).trim().toLowerCase();
      this.knownDeviceIds.set(peripheralId, peerDeviceId);

      if (peerDeviceId === this.host.getSettings().deviceId.toLowerCase()) {
        this.log('info', 'Ignored: that is us.');
        this.markCooldown(peripheralId, peerDeviceId);
        return;
      }
      if (isDeviceBlocked(this.host.getBlocked(), peerDeviceId)) {
        this.log('warn', `Blocked: ${peerDeviceId.slice(0, 8)}`);
        this.markCooldown(peripheralId, peerDeviceId);
        return;
      }
      if (
        !passesWhitelist(
          this.host.getSettings().whitelistEnabled,
          this.host.getWhitelist(),
          peerDeviceId,
        )
      ) {
        this.log('warn', `Not on whitelist: ${peerDeviceId.slice(0, 8)}`);
        this.markCooldown(peripheralId, peerDeviceId);
        return;
      }

      await subscribeToCharacteristic(peripheralId, MIAB_SERVICE, MIAB_TX);
      const pending = this.waitForPeerMessage(peripheralId, 10_000);
      const want = this.host.getReceiveFilter();
      await this.writeFrames(peripheralId, {
        v: 1,
        t: 'hello',
        deviceId: this.host.getSettings().deviceId,
        have: this.host.catalogIds(),
        languages: want.languages,
        categories: want.categories,
      });
      const offer = await pending;
      if (offer.t === 'reject') {
        this.log('warn', `Peer rejected: ${offer.reason}`);
        this.markCooldown(peripheralId, peerDeviceId);
        return;
      }
      if (offer.t !== 'offer') {
        throw new Error(`unexpected reply: ${offer.t}`);
      }
      this.host.ingest(offer.messages, offer.deviceId);
      const toPush = filterForPeer(
        messagesPeerNeeds(this.host.offerFor(offer.have ?? []), offer.have ?? []),
        offer.languages,
        offer.categories,
      );
      const doneWait = this.waitForPeerMessage(peripheralId, 8_000);
      await this.writeFrames(peripheralId, { v: 1, t: 'push', messages: toPush });
      try {
        const done = await doneWait;
        if (done.t !== 'done' && done.t !== 'reject') {
          this.log('warn', `Unexpected close: ${done.t}`);
        }
      } catch {
        /* some peers ACK only via disconnect */
      }
      const peer = this.peers.get(peripheralId);
      if (peer) {
        peer.lastSyncAt = nowIso();
        peer.lastError = null;
      }
      this.markCooldown(peripheralId, peerDeviceId);
      this.log('info', `Synced with ${peerDeviceId.slice(0, 8)}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const peer = this.peers.get(peripheralId);
      if (peer) peer.lastError = message;
      this.markCooldown(peripheralId);
      this.log('error', `Sync ${peripheralId.slice(0, 8)}: ${message}`);
    } finally {
      this.outboundWaiters.delete(peripheralId);
      try {
        disconnect(peripheralId);
      } catch {
        /* ignore */
      }
      this.outboundBusy = false;
      this.syncingWith = null;
      if (this.running) this.host?.onStatus('on');
      this.emitPeers();
    }
  }

  private async writeFrames(peripheralId: string, payload: ProtocolMessage): Promise<void> {
    const frames = encodeChunks(payload);
    for (let i = 0; i < frames.length; i += 1) {
      const last = i === frames.length - 1;
      await writeCharacteristic(
        peripheralId,
        MIAB_SERVICE,
        MIAB_RX,
        frames[i],
        last ? 'write' : 'writeWithoutResponse',
      );
      if (!last) await sleep(20);
    }
  }

  private async notifyFrames(payload: ProtocolMessage): Promise<void> {
    const frames = encodeChunks(payload);
    for (let i = 0; i < frames.length; i += 1) {
      await updateCharacteristicValue(MIAB_SERVICE, MIAB_TX, frames[i], true);
      if (i < frames.length - 1) await sleep(30);
    }
  }

  private async onInboundFrame(centralId: string, hex: string): Promise<void> {
    if (!this.host) return;
    this.inboundBusyUntil = Date.now() + 12_000;
    let assembler = this.inbound.get(centralId);
    if (!assembler) {
      assembler = new ChunkAssembler();
      this.inbound.set(centralId, assembler);
    }
    const message = assembler.push(hex);
    if (message === 'incomplete' || message === null) return;
    this.inbound.delete(centralId);
    try {
      await this.handleInbound(centralId, message);
    } catch (error) {
      this.log('error', `Inbound: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async handleInbound(centralId: string, message: ProtocolMessage): Promise<void> {
    if (!this.host) return;
    if (message.t === 'hello') {
      const peerId = message.deviceId.toLowerCase();
      this.knownDeviceIds.set(centralId, peerId);
      if (isDeviceBlocked(this.host.getBlocked(), peerId)) {
        await this.notifyFrames({ v: 1, t: 'reject', reason: 'blocked' });
        return;
      }
      if (
        !passesWhitelist(this.host.getSettings().whitelistEnabled, this.host.getWhitelist(), peerId)
      ) {
        await this.notifyFrames({ v: 1, t: 'reject', reason: 'whitelist' });
        return;
      }
      const ours = this.host.getReceiveFilter();
      const offer = filterForPeer(
        messagesPeerNeeds(this.host.offerFor(message.have), message.have),
        message.languages,
        message.categories,
      );
      await this.notifyFrames({
        v: 1,
        t: 'offer',
        deviceId: this.host.getSettings().deviceId,
        have: this.host.catalogIds(),
        languages: ours.languages,
        categories: ours.categories,
        messages: offer,
      });
      return;
    }
    if (message.t === 'push') {
      const from = this.knownDeviceIds.get(centralId) ?? 'unknown';
      this.host.ingest(message.messages, from);
      await this.notifyFrames({ v: 1, t: 'done' });
      this.markCooldown(centralId, from);
      this.inboundBusyUntil = Date.now() + 1500;
      this.log('info', `Bottle received from ${from.slice(0, 8)}.`);
    }
  }

  private prunePeers(): void {
    const cutoff = Date.now() - 90_000;
    for (const [id, peer] of this.peers) {
      if (Date.parse(peer.lastSeenAt) < cutoff && !this.queue.includes(id) && this.syncingWith !== id) {
        this.peers.delete(id);
      }
    }
  }

  private emitPeers(): void {
    this.host?.onPeers([...this.peers.values()], this.queue.length, this.syncingWith);
  }

  private log(level: RadioLogEntry['level'], message: string): void {
    this.host?.onLog({ at: nowIso(), level, message });
  }
}

export const radio = new RadioEngine();
