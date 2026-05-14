/**
 * @module useOfflineSync
 * @description React custom hook.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { movementsApi, requestsApi, materialsApi, stockApi } from "../api/pos-monitor.api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QueueItem {
  id: string;
  type: "movement" | "request" | "scan";
  data: Record<string, unknown>;
  ts: number;
  retries: number;
  status: "pending" | "syncing" | "synced" | "failed";
  error?: string;
}

export interface OfflineSyncState {
  isOnline: boolean;
  queueCount: number;
  isSyncing: boolean;
  lastSyncAt: Date | null;
  conflicts: QueueItem[];
  failedItems: QueueItem[];
}

interface CachedMaterial {
  id: number;
  barcode?: string;
  barcode128?: string;
  code?: string;
  nameUz?: string;
  unit?: string;
  [key: string]: unknown;
}

interface CachedStock {
  warehouseId_materialId: string;
  warehouseId: string;
  materialCardId: number;
  balance: number;
  [key: string]: unknown;
}

// ─── IndexedDB Constants ──────────────────────────────────────────────────────

const DB_NAME          = "pos_monitor_offline";
const DB_VERSION       = 2;
const STORE_NAME       = "queue";
const MATERIALS_STORE  = "materials_cache";
const STOCK_STORE      = "stock_cache";

// ─── IndexedDB Helpers ────────────────────────────────────────────────────────

let _db: IDBDatabase | null = null;

function openDb(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(MATERIALS_STORE)) {
        db.createObjectStore(MATERIALS_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STOCK_STORE)) {
        db.createObjectStore(STOCK_STORE, { keyPath: "warehouseId_materialId" });
      }
    };
    req.onsuccess = () => { _db = req.result; resolve(req.result); };
    req.onerror   = () => reject(req.error);
  });
}

async function getAllFromIDB<T>(storeName: string): Promise<T[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const req   = store.getAll();
    req.onsuccess = () => resolve((req.result ?? []) as T[]);
    req.onerror   = () => reject(req.error);
  });
}

async function putToIDB<T>(storeName: string, item: T): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const req   = store.put(item);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

async function deleteFromIDB(storeName: string, key: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const req   = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

async function clearIDB(storeName: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const req   = store.clear();
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useOfflineSync() {
  const [state, setState] = useState<OfflineSyncState>({
    isOnline:    navigator.onLine,
    queueCount:  0,
    isSyncing:   false,
    lastSyncAt:  null,
    conflicts:   [],
    failedItems: [],
  });

  const isSyncingRef = useRef(false);

  // ── Refresh counts from IDB ──────────────────────────────────────────────

  const refreshCounts = useCallback(async () => {
    try {
      const all = await getAllFromIDB<QueueItem>(STORE_NAME);
      const pending   = all.filter(i => i.status === "pending" || i.status === "syncing");
      const conflicts = all.filter(i => i.status === "failed" && i.error === "CONFLICT");
      const failed    = all.filter(i => i.status === "failed" && i.error !== "CONFLICT");
      setState(s => ({
        ...s,
        queueCount:  pending.length,
        conflicts,
        failedItems: failed,
      }));
    } catch { /* noop */ }
  }, []);

  // ── Online/offline listeners ─────────────────────────────────────────────

  useEffect(() => {
    const handleOnline  = () => setState(s => ({ ...s, isOnline: true }));
    const handleOffline = () => setState(s => ({ ...s, isOnline: false }));
    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online",  handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // ── Initial load + periodic refresh ─────────────────────────────────────

  useEffect(() => {
    void refreshCounts();
    const interval = setInterval(() => void refreshCounts(), 5000);
    return () => clearInterval(interval);
  }, [refreshCounts]);

  // ── Cache refresh on mount ───────────────────────────────────────────────

  useEffect(() => {
    if (navigator.onLine) {
      void refreshMaterialsCache();
      void refreshStockCache();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sync logic ───────────────────────────────────────────────────────────

  const syncNow = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    setState(s => ({ ...s, isSyncing: true }));

    try {
      const all     = await getAllFromIDB<QueueItem>(STORE_NAME);
      const pending = all.filter(i => i.status === "pending");

      for (const item of pending) {
        // Mark as syncing
        await putToIDB<QueueItem>(STORE_NAME, { ...item, status: "syncing" });

        try {
          if (item.type === "movement") {
            await movementsApi.create(item.data);
          } else if (item.type === "request") {
            await requestsApi.create(item.data);
          }
          // Success — mark synced
          await putToIDB<QueueItem>(STORE_NAME, { ...item, status: "synced" });
        } catch (e: unknown) {
          const err = e as { status?: number; message?: string } & Error;
          // Detect HTTP 409 Conflict
          const isConflict =
            err?.status === 409 ||
            (err?.message ?? "").includes("409") ||
            (err?.message ?? "").toLowerCase().includes("conflict");

          if (isConflict) {
            await putToIDB<QueueItem>(STORE_NAME, {
              ...item,
              status: "failed",
              error:  "CONFLICT",
            });
          } else if (item.retries < 3) {
            await putToIDB<QueueItem>(STORE_NAME, {
              ...item,
              status:  "pending",
              retries: item.retries + 1,
            });
          } else {
            await putToIDB<QueueItem>(STORE_NAME, {
              ...item,
              status: "failed",
              error:  err?.message ?? "Unknown error",
            });
          }
        }
      }

      setState(s => ({ ...s, lastSyncAt: new Date() }));
      await refreshCounts();
    } finally {
      isSyncingRef.current = false;
      setState(s => ({ ...s, isSyncing: false }));
    }
  }, [refreshCounts]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (state.isOnline && state.queueCount > 0) {
      void syncNow();
    }
    // Only react to isOnline changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isOnline]);

  // ── Enqueue ──────────────────────────────────────────────────────────────

  const enqueue = useCallback(async (
    type: QueueItem["type"],
    data: Record<string, unknown>,
    id?: string,
  ) => {
    const item: QueueItem = {
      id:      id ?? crypto.randomUUID(),
      type,
      data,
      ts:      Date.now(),
      retries: 0,
      status:  "pending",
    };
    await putToIDB<QueueItem>(STORE_NAME, item);
    await refreshCounts();
    return item.id;
  }, [refreshCounts]);

  // ── Resolve conflict ──────────────────────────────────────────────────────

  const resolveConflict = useCallback(async (
    item: QueueItem,
    useServer: boolean,
  ) => {
    if (useServer) {
      // Accept server version — just remove our queued item
      await deleteFromIDB(STORE_NAME, item.id);
    } else {
      // Force push our local version
      try {
        if (item.type === "movement") {
          await movementsApi.create({ ...item.data, forceClientVersion: true });
        } else if (item.type === "request") {
          await requestsApi.create({ ...item.data, forceClientVersion: true });
        }
        await deleteFromIDB(STORE_NAME, item.id);
      } catch {
        // Leave it as failed if force push also fails
      }
    }
    await refreshCounts();
  }, [refreshCounts]);

  // ── Clear failed ─────────────────────────────────────────────────────────

  const clearFailed = useCallback(async () => {
    const all    = await getAllFromIDB<QueueItem>(STORE_NAME);
    const failed = all.filter(i => i.status === "failed");
    for (const item of failed) {
      await deleteFromIDB(STORE_NAME, item.id);
    }
    await refreshCounts();
  }, [refreshCounts]);

  // ── Cache helpers ─────────────────────────────────────────────────────────

  async function refreshMaterialsCache() {
    try {
      const materials = await materialsApi.getAll();
      if (!Array.isArray(materials)) return;
      await clearIDB(MATERIALS_STORE);
      for (const m of materials) {
        await putToIDB<unknown>(MATERIALS_STORE, m);
      }
    } catch { /* noop — offline refresh silently fails */ }
  }

  async function refreshStockCache() {
    try {
      const stock = await stockApi.getAll();
      if (!Array.isArray(stock)) return;
      await clearIDB(STOCK_STORE);
      for (const row of stock as Array<{ warehouseId: string; materialCardId: number; balance: number }>) {
        const key = `${row.warehouseId}_${row.materialCardId}`;
        await putToIDB<CachedStock>(STOCK_STORE, {
          ...row,
          warehouseId_materialId: key,
        });
      }
    } catch { /* noop */ }
  }

  const lookupMaterialByBarcode = useCallback(async (
    barcode: string,
  ): Promise<CachedMaterial | null> => {
    try {
      const all = await getAllFromIDB<CachedMaterial>(MATERIALS_STORE);
      return (
        all.find(
          m =>
            m.barcode === barcode ||
            m.barcode128 === barcode ||
            m.code === barcode,
        ) ?? null
      );
    } catch {
      return null;
    }
  }, []);

  const getStockLevel = useCallback(async (
    warehouseId: string,
    materialId: number,
  ): Promise<CachedStock | null> => {
    try {
      const db  = await openDb();
      const key = `${warehouseId}_${materialId}`;
      return new Promise((resolve, reject) => {
        const tx    = db.transaction(STOCK_STORE, "readonly");
        const store = tx.objectStore(STOCK_STORE);
        const req   = store.get(key);
        req.onsuccess = () => resolve((req.result as CachedStock) ?? null);
        req.onerror   = () => reject(req.error);
      });
    } catch {
      return null;
    }
  }, []);

  return {
    ...state,
    enqueue,
    syncNow,
    resolveConflict,
    clearFailed,
    lookupMaterialByBarcode,
    getStockLevel,
    refreshMaterialsCache,
    refreshStockCache,
  };
}
