import { useState, useEffect, useCallback } from "react";
import { usePosI18n } from "../i18n/usePosI18n";
import { syncApi } from "../api/pos-monitor.api";

export interface OfflineQueueItem { id: string; data: unknown; ts: number; }

const IDB_NAME    = "pos_offline_db";
const IDB_STORE   = "queue";
const IDB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

export async function idbGetQueue(): Promise<OfflineQueueItem[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(IDB_STORE, "readonly");
    const store = tx.objectStore(IDB_STORE);
    const req   = store.getAll();
    req.onsuccess = () => resolve((req.result ?? []) as OfflineQueueItem[]);
    req.onerror   = () => reject(req.error);
  });
}

export async function idbEnqueue(item: OfflineQueueItem): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(IDB_STORE, "readwrite");
    const store = tx.objectStore(IDB_STORE);
    const req   = store.put(item);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

export async function idbClearQueue(): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(IDB_STORE, "readwrite");
    const store = tx.objectStore(IDB_STORE);
    const req   = store.clear();
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

export default function PosOfflineBanner() {
  const { t } = usePosI18n();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueCount, setQueueCount] = useState(0);
  const [syncing, setSyncing]   = useState(false);
  const [syncMsg, setSyncMsg]   = useState("");
  const [conflictItem, setConflictItem] = useState<OfflineQueueItem | null>(null);

  const refreshCount = useCallback(async () => {
    try { const q = await idbGetQueue(); setQueueCount(q.length); } catch { /* noop */ }
  }, []);

  useEffect(() => {
    void refreshCount();
    const onOnline  = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online",  onOnline);
    window.addEventListener("offline", onOffline);
    return () => { window.removeEventListener("online", onOnline); window.removeEventListener("offline", onOffline); };
  }, [refreshCount]);

  useEffect(() => {
    const interval = setInterval(() => void refreshCount(), 5000);
    return () => clearInterval(interval);
  }, [refreshCount]);

  const doSync = useCallback(async () => {
    const queue = await idbGetQueue();
    if (queue.length === 0) return;
    setSyncing(true);
    setSyncMsg(t("offline.syncing"));
    let failed = 0;
    for (const item of queue) {
      try {
        const res = await syncApi.push({
          clientUuid:       item.id,
          terminalId:       "pos-web",
          offlineCreatedAt: new Date(item.ts).toISOString(),
          movements:        [item.data as Record<string, unknown>],
        } as Record<string, unknown>) as { synced?: number; conflicts?: number };
        if ((res?.conflicts ?? 0) > 0) {
          setConflictItem(item);
          failed++;
        }
      } catch { failed++; }
    }
    if (failed === 0) {
      await idbClearQueue();
      setQueueCount(0);
      setSyncMsg(t("offline.synced", { count: queue.length }));
    } else {
      setSyncMsg(`${queue.length - failed}/${queue.length} sync bo'ldi`);
    }
    setSyncing(false);
    setTimeout(() => setSyncMsg(""), 4000);
  }, [t]);

  useEffect(() => {
    if (isOnline && queueCount > 0) { void doSync(); }
  }, [isOnline, queueCount, doSync]);

  async function resolveConflict(useServer: boolean) {
    if (!conflictItem) return;
    if (useServer) {
      const queue = await idbGetQueue();
      const remaining = queue.filter(q => q.id !== conflictItem.id);
      await idbClearQueue();
      for (const r of remaining) { await idbEnqueue(r); }
    } else {
      try {
        await syncApi.push({
          clientUuid:       conflictItem.id,
          terminalId:       "pos-web",
          offlineCreatedAt: new Date(conflictItem.ts).toISOString(),
          movements:        [conflictItem.data as Record<string, unknown>],
          forceClientVersion: true,
        } as Record<string, unknown>);
        const queue = await idbGetQueue();
        const remaining = queue.filter(q => q.id !== conflictItem.id);
        await idbClearQueue();
        for (const r of remaining) { await idbEnqueue(r); }
      } catch { /* noop */ }
    }
    setConflictItem(null);
    void refreshCount();
  }

  if (isOnline && queueCount === 0 && !syncMsg && !conflictItem) return null;

  return (
    <>
      <div className="pos-offline-banner">
        {!isOnline && <span>📡</span>}
        {syncing && <span>⏫</span>}
        {syncMsg && !syncing && <span>✅</span>}
        <span>
          {syncMsg || (!isOnline ? t("offline.banner", { count: queueCount }) : queueCount > 0 ? `${queueCount} ta kutayotgan` : null)}
        </span>
        {isOnline && queueCount > 0 && !syncing && (
          <button className="pos-btn pos-btn-ghost" style={{ padding: "2px 8px", fontSize: 11 }} onClick={() => void doSync()}>
            Sync
          </button>
        )}
      </div>

      {conflictItem && (
        <div className="pos-modal-overlay">
          <div className="pos-modal" style={{ maxWidth: 400 }}>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>⚠️ Server vs Mening versiyam</div>
            <div style={{ fontSize: 13, color: "var(--pos-text-muted)", marginBottom: 16 }}>
              Server versiyasi bilan to'qnashuv yuz berdi. Qaysi versiyani saqlashni tanlang:
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="pos-btn pos-btn-ghost" style={{ flex: 1 }} onClick={() => void resolveConflict(true)}>
                🌐 Server versiyasi
              </button>
              <button className="pos-btn pos-btn-primary" style={{ flex: 1 }} onClick={() => void resolveConflict(false)}>
                💾 Mening versiyam
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
