import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  getPendingSyncCount,
  syncOrderDrafts,
  syncQcRecheckQueue,
  syncPosMovements,
} from "@/lib/erp-offline-db";
import { apiRequest } from "@/lib/queryClient";

interface SyncStatus {
  orderDrafts:  number;
  qcRechecks:   number;
  posMovements: number;
  conflicts:    number;
  syncing:      boolean;
  isOnline:     boolean;
}

export function useErpOfflineSync() {
  const { toast } = useToast();
  const [status, setStatus] = useState<SyncStatus>({
    orderDrafts:  0,
    qcRechecks:   0,
    posMovements: 0,
    conflicts:    0,
    syncing:      false,
    isOnline:     navigator.onLine,
  });

  const refreshCounts = useCallback(async () => {
    const counts = await getPendingSyncCount().catch(() => ({
      orderDrafts: 0, qcRechecks: 0, posMovements: 0, conflicts: 0,
    }));
    setStatus((prev) => ({ ...prev, ...counts }));
  }, []);

  const syncAll = useCallback(async () => {
    if (!navigator.onLine) {
      toast({ title: "Internet yo'q", description: "Sinxronlash uchun tarmoqqa ulaning", variant: "destructive" });
      return;
    }
    setStatus((prev) => ({ ...prev, syncing: true }));
    try {
      const [ordRes, qcRes, posRes] = await Promise.all([
        syncOrderDrafts((path, body) => apiRequest('POST', `/api${path}`, body)),
        syncQcRecheckQueue((path, body) => apiRequest('POST', `/api${path}`, body)),
        syncPosMovements((path, body) => apiRequest('POST', `/api${path}`, body)),
      ]);

      const total     = ordRes.success + qcRes.success + posRes.success;
      const failed    = ordRes.failed  + qcRes.failed  + posRes.failed;
      const conflicts = posRes.conflicts;

      if (total > 0 || failed > 0 || conflicts > 0) {
        toast({
          title: `✅ ${total} ta sinxronlandi`,
          description: [
            failed    > 0 ? `⚠️ ${failed} xatolik`    : '',
            conflicts > 0 ? `🔀 ${conflicts} konflikt` : '',
          ].filter(Boolean).join(' | ') || undefined,
        });
      }
    } catch (err) {
      toast({ title: "Sinxronlash xatosi", description: String(err), variant: "destructive" });
    } finally {
      setStatus((prev) => ({ ...prev, syncing: false }));
      await refreshCounts();
    }
  }, [toast, refreshCounts]);

  useEffect(() => {
    refreshCounts();

    const handleOnline = () => {
      setStatus((prev) => ({ ...prev, isOnline: true }));
      void syncAll();
    };
    const handleOffline = () => {
      setStatus((prev) => ({ ...prev, isOnline: false }));
      toast({ title: "📵 Oflayn rejim", description: "Ma'lumotlar qurilmada saqlanmoqda", variant: "default" });
    };

    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online",  handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [refreshCounts, syncAll, toast]);

  const totalPending = status.orderDrafts + status.qcRechecks + status.posMovements;

  return { status, totalPending, syncAll, refreshCounts };
}
