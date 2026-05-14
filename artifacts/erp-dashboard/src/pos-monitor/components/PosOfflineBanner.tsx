/**
 * @module PosOfflineBanner
 * @description React UI component.
 */

import { usePosI18n } from "../i18n/usePosI18n";
import { useOfflineSync, type QueueItem } from "../hooks/useOfflineSync";
import { useTranslation } from '@/lib/i18n';

// Re-export the legacy type so other files don't break
export type { QueueItem as OfflineQueueItem };

// ─── Standalone IDB helpers (hookdan tashqari ishlatish uchun) ──────────────
// useOfflineSync hookida bir xil IDB schema ishlatiladi (DB_NAME=pos_monitor_offline,
// STORE_NAME=queue). Bu funksiya komponent contextidan tashqari (form submit
// callback ichida) ishlatiladi — masalan PosMovementKirim.tsx da.

const IDB_NAME       = "pos_monitor_offline";
const IDB_VERSION    = 2;
const IDB_STORE      = "queue";

let _enqueueDb: IDBDatabase | null = null;

function openEnqueueDb(): Promise<IDBDatabase> {
  if (_enqueueDb) return Promise.resolve(_enqueueDb);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => { _enqueueDb = req.result; resolve(req.result); };
    req.onerror   = () => reject(req.error);
  });
}

/**
 * idbEnqueue — offline rejimda harakatni navbatga qo'yish.
 *
 * Form submit callback ichidan chaqirilishi mumkin (hooks ishlatib bo'lmaganda).
 * useOfflineSync bir xil IDB ga yozadi; keyingi syncNow() avtomatik yuboradi.
 */
export async function idbEnqueue(input: {
  id?:   string;
  type?: QueueItem["type"];
  data:  Record<string, unknown>;
  ts?:   number;
}): Promise<string> {
  const item: QueueItem = {
    id:      input.id   ?? crypto.randomUUID(),
    type:    input.type ?? "movement",
    data:    input.data,
    ts:      input.ts   ?? Date.now(),
    retries: 0,
    status:  "pending",
  };
  const db = await openEnqueueDb();
  return new Promise<string>((resolve, reject) => {
    const tx    = db.transaction(IDB_STORE, "readwrite");
    const store = tx.objectStore(IDB_STORE);
    const req   = store.put(item);
    req.onsuccess = () => resolve(item.id);
    req.onerror   = () => reject(req.error);
  });
}

export default function PosOfflineBanner() {
  const { t } = useTranslation("common");
  const { t } = usePosI18n();
  const {
    isOnline,
    queueCount,
    isSyncing,
    lastSyncAt,
    conflicts,
    failedItems,
    syncNow,
    resolveConflict,
    clearFailed,
  } = useOfflineSync();

  const hasConflict = conflicts.length > 0;
  const firstConflict: QueueItem | null = hasConflict ? conflicts[0] : null;

  // Nothing to show while online and nothing pending
  if (isOnline && queueCount === 0 && !isSyncing && !hasConflict && failedItems.length === 0 && !lastSyncAt) {
    return null;
  }

  // ── Banner label ──────────────────────────────────────────────────────────

  let bannerLabel: string;
  if (isSyncing) {
    bannerLabel = `${t("offline.syncing")} (${queueCount} ta)`;
  } else if (!isOnline && queueCount > 0) {
    bannerLabel = t("offline.banner", { count: queueCount });
  } else if (!isOnline) {
    bannerLabel = "Oflayn rejim";
  } else if (queueCount > 0) {
    bannerLabel = `${queueCount} ta harakat sinxronlash kutmoqda`;
  } else if (lastSyncAt) {
    const timeStr = lastSyncAt.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
    bannerLabel = t("offline.synced", { count: 0 }) + ` (${timeStr})`;
  } else {
    bannerLabel = "";
  }

  const bannerColor = !isOnline
    ? "var(--pos-danger)"
    : isSyncing
      ? "var(--pos-warning)"
      : hasConflict
        ? "rgba(239,68,68,0.15)"
        : "var(--pos-success)";

  const bannerIcon = !isOnline ? "📡" : isSyncing ? "⏫" : queueCount > 0 ? "🕓" : "✅";

  return (
    <>
      {/* ── Main banner ── */}
      {(bannerLabel || !isOnline) && (
        <div
          className="pos-offline-banner"
          style={{
            borderLeft: `3px solid ${bannerColor}`,
            background: !isOnline ? "rgba(239,68,68,0.08)" : isSyncing ? "rgba(255,184,0,0.08)" : "rgba(16,185,129,0.08)",
          }}
        >
          <span>{bannerIcon}</span>
          <span style={{ flex: 1 }}>{bannerLabel}</span>

          {/* Sync progress bar */}
          {isSyncing && (
            <div style={{
              height:       3,
              borderRadius: 2,
              background:   "rgba(255,184,0,0.2)",
              overflow:     "hidden",
              width:        80,
              flexShrink:   0,
            }}>
              <div
                className="pos-live"
                style={{
                  height:     "100%",
                  width:      "60%",
                  background: "var(--pos-warning)",
                  borderRadius: 2,
                }}
              />
            </div>
          )}

          {/* Manual sync button — online with pending items */}
          {isOnline && queueCount > 0 && !isSyncing && (
            <button
              className="pos-btn pos-btn-ghost"
              style={{ padding: "2px 10px", fontSize: 11, flexShrink: 0 }}
              onClick={() => void syncNow()}
            >
              {t("hozirSinxronlash")}
            </button>
          )}

          {/* Last sync timestamp */}
          {!isSyncing && lastSyncAt && queueCount === 0 && (
            <span style={{ fontSize: 10, color: "var(--pos-text-muted)", flexShrink: 0 }}>
              {lastSyncAt.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
      )}

      {/* ── Failed items notice ── */}
      {failedItems.length > 0 && (
        <div
          className="pos-offline-banner"
          style={{ background: "rgba(239,68,68,0.08)", borderLeft: "3px solid var(--pos-danger)" }}
        >
          <span>❌</span>
          <span style={{ flex: 1, fontSize: 12 }}>
            {failedItems.length} ta harakat yuborilmadi
          </span>
          <button
            className="pos-btn pos-btn-ghost"
            style={{ padding: "2px 10px", fontSize: 11, color: "var(--pos-danger)" }}
            onClick={() => void clearFailed()}
          >
            {t("tozalash")}
          </button>
        </div>
      )}

      {/* ── Conflict resolution modal ── */}
      {firstConflict && (
        <div className="pos-modal-overlay">
          <div className="pos-modal" style={{ maxWidth: 420 }}>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>
              {t("serverVsMeningVersiyam")}
            </div>
            <div style={{ fontSize: 13, color: "var(--pos-text-muted)", marginBottom: 6 }}>
              {t("serverVersiyasiBilanToqnashuvYuz")}
            </div>
            <div style={{ fontSize: 11, color: "var(--pos-text-muted)", marginBottom: 16 }}>
              {t("tur1")}<strong>{firstConflict.type}</strong> &nbsp;·&nbsp;
              Sana: <strong>{new Date(firstConflict.ts).toLocaleString("uz-UZ")}</strong>
              {conflicts.length > 1 && (
                <span style={{ marginLeft: 8 }}>
                  (+{conflicts.length - 1} ta boshqa)
                </span>
              )}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="pos-btn pos-btn-ghost"
                style={{ flex: 1 }}
                onClick={() => void resolveConflict(firstConflict, true)}
              >
                {t("serverVersiyasi")}
              </button>
              <button
                className="pos-btn pos-btn-primary"
                style={{ flex: 1 }}
                onClick={() => void resolveConflict(firstConflict, false)}
              >
                {t("meningVersiyam")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
