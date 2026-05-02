import { apiRequest } from "./queryClient";
import {
  posDb,
  getPendingSales,
  updateSaleStatus,
  cacheProducts,
  getAllPendingCount,
  type OfflinePosProduct,
} from "./pos-db";

export type SyncStatus = "idle" | "syncing" | "error" | "success";

let syncInProgress = false;
let syncListeners: Array<(status: SyncStatus, pendingCount: number) => void> = [];

export function onSyncStatusChange(cb: (status: SyncStatus, pendingCount: number) => void) {
  syncListeners.push(cb);
  return () => {
    syncListeners = (Array.isArray(syncListeners) ? syncListeners : []).filter(l => l !== cb);
  };
}

function notifyListeners(status: SyncStatus, pendingCount: number) {
  (Array.isArray(syncListeners) ? syncListeners : []).forEach(l => l(status, pendingCount));
}

export async function syncPendingSales(): Promise<{
  synced: number;
  failed: number;
  conflicts: number;
}> {
  if (syncInProgress) return { synced: 0, failed: 0, conflicts: 0 };
  syncInProgress = true;

  const pendingCount = await getAllPendingCount();
  notifyListeners("syncing", pendingCount);

  let synced = 0;
  let failed = 0;
  let conflicts = 0;

  try {
    const sales = await getPendingSales();
    for (const sale of sales) {
      try {
        await updateSaleStatus(sale.id!, "syncing");

        const result = await apiRequest<{ saleNumber: string; conflict?: boolean }>("POST", "/api/pos/sales", {
            items: sale.items,
            paymentMethod: sale.paymentMethod,
            customerName: sale.customerName,
            discountAmount: sale.discountAmount,
            offlineLocalId: sale.localId,
            offlineCreatedAt: new Date(sale.createdAt).toISOString(),
          });

        if (result.conflict) {
          conflicts++;
          await updateSaleStatus(sale.id!, "synced", {
            serverSaleNumber: result.saleNumber,
            syncError: "Konflikt aniqlandi — server tomonidan hal qilindi",
          });
        } else {
          synced++;
          await updateSaleStatus(sale.id!, "synced", {
            serverSaleNumber: result.saleNumber,
          });
        }
      } catch (err: unknown) {
        failed++;
        const msg = err instanceof Error ? err.message : String(err);
        await updateSaleStatus(sale.id!, "failed", { syncError: msg });
      }
    }
  } finally {
    syncInProgress = false;
    const remaining = await getAllPendingCount();
    notifyListeners(
      failed > 0 && synced === 0 ? "error" : "success",
      remaining
    );
  }

  return { synced, failed, conflicts };
}

export async function refreshProductCache() {
  try {
    const data = await apiRequest<OfflinePosProduct[] | { products: OfflinePosProduct[] }>("GET", "/api/pos/products?active=true&limit=1000");
    const products: OfflinePosProduct[] = Array.isArray(data) ? data : (data as { products?: OfflinePosProduct[] }).products ?? [];
    const withTimestamp = (Array.isArray(products) ? products : []).map(p => ({ ...p, cachedAt: Date.now() }));
    await cacheProducts(withTimestamp);
    return products.length;
  } catch {
    return 0;
  }
}

export function startOnlineWatcher(onOnline: () => void, onOffline: () => void) {
  const handleOnline = () => onOnline();
  const handleOffline = () => onOffline();
  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);
  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}

export async function getPendingCount(): Promise<number> {
  return getAllPendingCount();
}
