/**
 * @module useOfflineSyncDb
 * @description IndexedDB types, constants, and helpers for useOfflineSync.
 * Extracted from useOfflineSync.ts (Rule 16).
 */

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

export interface CachedMaterial {
  id: number;
  barcode?: string;
  barcode128?: string;
  code?: string;
  nameUz?: string;
  unit?: string;
  [key: string]: unknown;
}

export interface CachedStock {
  warehouseId_materialId: string;
  warehouseId: string;
  materialId: number;
  balance: number;
  [key: string]: unknown;
}

// ─── IndexedDB Constants ──────────────────────────────────────────────────────

export const DB_NAME         = "pos_monitor_offline";
export const DB_VERSION      = 2;
export const STORE_NAME      = "queue";
export const MATERIALS_STORE = "materials_cache";
export const STOCK_STORE     = "stock_cache";

// ─── IndexedDB Helpers ────────────────────────────────────────────────────────

let _db: IDBDatabase | null = null;

export function openDb(): Promise<IDBDatabase> {
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

export async function getAllFromIDB<T>(storeName: string): Promise<T[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const req   = store.getAll();
    req.onsuccess = () => resolve((req.result ?? []) as T[]);
    req.onerror   = () => reject(req.error);
  });
}

export async function putToIDB<T>(storeName: string, item: T): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const req   = store.put(item);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

export async function deleteFromIDB(storeName: string, key: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const req   = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

export async function clearIDB(storeName: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const req   = store.clear();
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}
