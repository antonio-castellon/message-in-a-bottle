import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { radio } from '../ble/radio';
import { isExpired, newUuid, nowIso, sanitizeText } from '../domain/ids';
import { broadcastable, ingestIncoming, MAX_CATALOG_IDS } from '../domain/pool';
import type {
  BlockedEntry,
  BottleMessage,
  Category,
  LocalMessage,
  NearbyPeer,
  RadioLogEntry,
  RadioStatus,
  Settings,
} from '../domain/types';
import { MAX_TEXT_LENGTH } from '../domain/types';
import {
  loadState,
  saveBlocked,
  saveLog,
  saveMessages,
  saveSettings,
} from '../storage/store';

interface ComposeInput {
  text: string;
  category: Category;
  bottleMode: boolean;
  expiresAt: string | null;
}

interface AppContextValue {
  ready: boolean;
  settings: Settings;
  messages: LocalMessage[];
  blocked: BlockedEntry[];
  status: RadioStatus;
  statusDetail: string | null;
  peers: NearbyPeer[];
  queueSize: number;
  syncingWith: string | null;
  log: RadioLogEntry[];
  inbox: LocalMessage[];
  pool: LocalMessage[];
  compose: (input: ComposeInput) => Promise<LocalMessage>;
  removeMessage: (messageId: string) => Promise<void>;
  setBottleForward: (messageId: string, enabled: boolean) => Promise<void>;
  setInPool: (messageId: string, inPool: boolean) => Promise<void>;
  markSeen: (messageId: string) => Promise<void>;
  blockUuid: (uuid: string, kind: BlockedEntry['kind'], note?: string) => Promise<void>;
  unblockUuid: (uuid: string) => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  regenerateDeviceId: () => Promise<string>;
  toggleRadio: (on: boolean) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [blocked, setBlocked] = useState<BlockedEntry[]>([]);
  const [status, setStatus] = useState<RadioStatus>('off');
  const [statusDetail, setStatusDetail] = useState<string | null>(null);
  const [peers, setPeers] = useState<NearbyPeer[]>([]);
  const [queueSize, setQueueSize] = useState(0);
  const [syncingWith, setSyncingWith] = useState<string | null>(null);
  const [log, setLog] = useState<RadioLogEntry[]>([]);

  const settingsRef = useRef(settings);
  const messagesRef = useRef(messages);
  const blockedRef = useRef(blocked);
  settingsRef.current = settings;
  messagesRef.current = messages;
  blockedRef.current = blocked;

  const persistMessages = useCallback(async (next: LocalMessage[]) => {
    setMessages(next);
    messagesRef.current = next;
    await saveMessages(next);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await loadState();
      if (cancelled) return;
      setSettings(loaded.settings);
      setMessages(loaded.messages);
      setBlocked(loaded.blocked);
      setLog(loaded.log);
      settingsRef.current = loaded.settings;
      messagesRef.current = loaded.messages;
      blockedRef.current = loaded.blocked;
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || !settings) return;

    radio.bind({
      getSettings: () => settingsRef.current!,
      getBlocked: () => blockedRef.current,
      catalogIds: () => messagesRef.current.slice(0, MAX_CATALOG_IDS).map((m) => m.messageId),
      offerFor: (have) => {
        const live = broadcastable(messagesRef.current, settingsRef.current!);
        const skip = new Set(have.map((id) => id.toLowerCase()));
        return live.filter((m) => !skip.has(m.messageId.toLowerCase()));
      },
      ingest: (incoming: BottleMessage[], fromDeviceId: string) => {
        const { next, added } = ingestIncoming(
          messagesRef.current,
          incoming,
          settingsRef.current!,
          blockedRef.current,
          fromDeviceId,
        );
        if (!added.length) return;
        void persistMessages(next);
      },
      onStatus: (next, detail) => {
        setStatus(next);
        setStatusDetail(detail ?? null);
      },
      onPeers: (nextPeers, nextQueue, nextSync) => {
        setPeers(nextPeers);
        setQueueSize(nextQueue);
        setSyncingWith(nextSync);
      },
      onLog: (entry) => {
        setLog((prev) => {
          const next = [...prev, entry].slice(-80);
          void saveLog(next);
          return next;
        });
      },
    });

    if (settings.radioEnabled) {
      void radio.start();
    } else {
      void radio.stop();
    }

    return () => {
      void radio.stop();
    };
  }, [ready, persistMessages, settings?.radioEnabled, settings?.deviceId]);

  const compose = useCallback(
    async (input: ComposeInput) => {
      const current = settingsRef.current!;
      const msg: LocalMessage = {
        messageId: newUuid(),
        originDeviceId: current.deviceId,
        text: sanitizeText(input.text, MAX_TEXT_LENGTH),
        category: input.category,
        bottleMode: input.bottleMode,
        createdAt: nowIso(),
        expiresAt: input.expiresAt,
        hopCount: 0,
        owned: true,
        receivedAt: null,
        receivedFromDeviceId: null,
        inBroadcastPool: true,
        bottleForwardEnabled: input.bottleMode,
        seen: true,
      };
      if (!msg.text) throw new Error('The message is empty.');
      await persistMessages([msg, ...messagesRef.current]);
      return msg;
    },
    [persistMessages],
  );

  const removeMessage = useCallback(
    async (messageId: string) => {
      await persistMessages(messagesRef.current.filter((m) => m.messageId !== messageId));
    },
    [persistMessages],
  );

  const setBottleForward = useCallback(
    async (messageId: string, enabled: boolean) => {
      await persistMessages(
        messagesRef.current.map((m) =>
          m.messageId === messageId
            ? {
                ...m,
                bottleForwardEnabled: enabled,
                inBroadcastPool: m.owned ? m.inBroadcastPool : enabled,
                bottleMode: m.owned ? enabled : m.bottleMode,
              }
            : m,
        ),
      );
    },
    [persistMessages],
  );

  const setInPool = useCallback(
    async (messageId: string, inPool: boolean) => {
      await persistMessages(
        messagesRef.current.map((m) =>
          m.messageId === messageId ? { ...m, inBroadcastPool: inPool, bottleForwardEnabled: inPool } : m,
        ),
      );
    },
    [persistMessages],
  );

  const markSeen = useCallback(
    async (messageId: string) => {
      const current = messagesRef.current;
      if (!current.some((m) => m.messageId === messageId && !m.seen)) return;
      await persistMessages(current.map((m) => (m.messageId === messageId ? { ...m, seen: true } : m)));
    },
    [persistMessages],
  );

  const blockUuid = useCallback(async (uuid: string, kind: BlockedEntry['kind'], note?: string) => {
    const id = uuid.trim().toLowerCase();
    if (!id) return;
    const next = [
      { uuid: id, kind, addedAt: nowIso(), note },
      ...blockedRef.current.filter((b) => b.uuid.toLowerCase() !== id),
    ];
    blockedRef.current = next;
    setBlocked(next);
    await saveBlocked(next);
    if (kind === 'device') {
      await persistMessages(
        messagesRef.current.filter((m) => m.originDeviceId.toLowerCase() !== id && m.receivedFromDeviceId !== id),
      );
    } else {
      await persistMessages(messagesRef.current.filter((m) => m.messageId.toLowerCase() !== id));
    }
  }, [persistMessages]);

  const unblockUuid = useCallback(async (uuid: string) => {
    const next = blockedRef.current.filter((b) => b.uuid.toLowerCase() !== uuid.toLowerCase());
    blockedRef.current = next;
    setBlocked(next);
    await saveBlocked(next);
  }, []);

  const updateSettings = useCallback(async (patch: Partial<Settings>) => {
    const next = { ...settingsRef.current!, ...patch };
    settingsRef.current = next;
    setSettings(next);
    await saveSettings(next);
  }, []);

  const regenerateDeviceId = useCallback(async () => {
    const nextId = newUuid();
    const nextSettings: Settings = {
      ...settingsRef.current!,
      deviceId: nextId,
      deviceIdCreatedAt: nowIso(),
    };
    settingsRef.current = nextSettings;
    setSettings(nextSettings);
    await saveSettings(nextSettings);
    await persistMessages(
      messagesRef.current.map((m) => (m.owned ? { ...m, originDeviceId: nextId } : m)),
    );
    await radio.refreshIdentity(nextId);
    return nextId;
  }, [persistMessages]);

  const toggleRadio = useCallback(
    async (on: boolean) => {
      await updateSettings({ radioEnabled: on });
    },
    [updateSettings],
  );

  const inbox = useMemo(
    () => messages.filter((m) => !m.owned).sort((a, b) => (b.receivedAt ?? '').localeCompare(a.receivedAt ?? '')),
    [messages],
  );
  const pool = useMemo(
    () =>
      messages
        .filter((m) => m.inBroadcastPool && !isExpired(m.expiresAt))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [messages],
  );

  const value = useMemo<AppContextValue | null>(() => {
    if (!settings) return null;
    return {
      ready,
      settings,
      messages,
      blocked,
      status,
      statusDetail,
      peers,
      queueSize,
      syncingWith,
      log,
      inbox,
      pool,
      compose,
      removeMessage,
      setBottleForward,
      setInPool,
      markSeen,
      blockUuid,
      unblockUuid,
      updateSettings,
      regenerateDeviceId,
      toggleRadio,
    };
  }, [
    ready,
    settings,
    messages,
    blocked,
    status,
    statusDetail,
    peers,
    queueSize,
    syncingWith,
    log,
    inbox,
    pool,
    compose,
    removeMessage,
    setBottleForward,
    setInPool,
    markSeen,
    blockUuid,
    unblockUuid,
    updateSettings,
    regenerateDeviceId,
    toggleRadio,
  ]);

  if (!value) return null;
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp used outside AppProvider');
  return ctx;
}
