import { useState, useEffect, useCallback, useRef } from "react";
import {
  savePendingSale,
  decreaseLocalStock,
  getCachedProducts,
  getCachedProductByBarcode,
  getAllPendingCount,
  type OfflinePosProduct,
  type OfflinePendingSale,
} from "@/lib/pos-db";
import {
  syncPendingSales,
  refreshProductCache,
  startOnlineWatcher,
  onSyncStatusChange,
  type SyncStatus,
} from "@/lib/pos-sync";
import { nanoid } from "@/lib/utils";

export function usePosOffline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsub = onSyncStatusChange((status, count) => {
      setSyncStatus(status);
      setPendingCount(count);
      if (status === "success") {
        setLastSyncAt(new Date());
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    getAllPendingCount().then(setPendingCount);
  }, []);

  useEffect(() => {
    const stopWatcher = startOnlineWatcher(
      async () => {
        setIsOnline(true);
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = setTimeout(async () => {
          await syncPendingSales();
          await refreshProductCache();
          const count = await getAllPendingCount();
          setPendingCount(count);
        }, 1500);
      },
      () => {
        setIsOnline(false);
        setSyncStatus("idle");
      }
    );

    if (navigator.onLine) {
      refreshProductCache().then(() => {
        getAllPendingCount().then(setPendingCount);
      });
    }

    return () => {
      stopWatcher();
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, []);

  const saveOfflineSale = useCallback(
    async (sale: {
      items: Array<{ productId: number; quantity: number }>;
      paymentMethod: string;
      customerName?: string;
      discountAmount?: number;
      total: number;
      cartSnapshot: OfflinePendingSale["cartSnapshot"];
    }) => {
      const localId = nanoid();
      await savePendingSale({
        localId,
        items: sale.items,
        paymentMethod: sale.paymentMethod,
        customerName: sale.customerName,
        discountAmount: sale.discountAmount,
        total: sale.total,
        cartSnapshot: sale.cartSnapshot,
        createdAt: Date.now(),
        status: "pending",
      });

      for (const item of sale.items) {
        await decreaseLocalStock(item.productId, item.quantity);
      }

      const count = await getAllPendingCount();
      setPendingCount(count);

      return localId;
    },
    []
  );

  const triggerSync = useCallback(async () => {
    if (!navigator.onLine) return { synced: 0, failed: 0, conflicts: 0 };
    return syncPendingSales();
  }, []);

  const getOfflineProducts = useCallback(
    async (search?: string) => getCachedProducts(search),
    []
  );

  const getOfflineProductByBarcode = useCallback(
    async (barcode: string) => getCachedProductByBarcode(barcode),
    []
  );

  return {
    isOnline,
    syncStatus,
    pendingCount,
    lastSyncAt,
    saveOfflineSale,
    triggerSync,
    getOfflineProducts,
    getOfflineProductByBarcode,
  };
}
