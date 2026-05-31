/**
 * @module useIoTTabletAlerts
 * @description Alert and notification logic for the IoT tablet:
 *   - Offline action queue (enqueue, flush, online/offline event listeners)
 *   - SOS alert submission
 *   - QC reminder trigger (every QC_TRIGGER_INTERVAL pieces produced)
 *
 * All functions are pure side-effectful utilities — no JSX.
 */

import { useState, useEffect, useCallback } from "react";
import { safeStorage } from "@/lib/safeStorage";
import { useToast } from "@/hooks/use-toast";
import { ProductionSession, Equipment } from "./iot-types";
import {
  OFFLINE_QUEUE_KEY, QC_TRIGGER_INTERVAL, SosType,
  type OfflineAction,
} from "./useIoTTabletTypes";

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseIoTTabletAlertsParams {
  isLoggedIn: boolean;
  tabletToken: string;
  activeSession: ProductionSession | null;
  assignedEquipment: Equipment | null;
  sosMessage: string;
  setSosMessage: (v: string) => void;
  sosType: SosType;
  setShowSOSDialog: (v: boolean) => void;
  showQcFormDialog: boolean;
  setShowQcFormDialog: (v: boolean) => void;
  t: (uz: string, ru: string) => string;
}

export function useIoTTabletAlerts({
  isLoggedIn,
  tabletToken,
  activeSession,
  assignedEquipment,
  sosMessage,
  setSosMessage,
  sosType,
  setShowSOSDialog,
  t,
}: UseIoTTabletAlertsParams) {
  const { toast } = useToast();

  // ── QC reminder state ─────────────────────────────────────────────────────
  const [qcReminderVisible, setQcReminderVisible] = useState(false);
  const [lastQcCheckQty, setLastQcCheckQty] = useState(0);

  // Reset reminder when session changes
  useEffect(() => {
    setQcReminderVisible(false);
    setLastQcCheckQty(0);
  }, [activeSession?.id]);

  // Trigger reminder at every QC_TRIGGER_INTERVAL-piece checkpoint
  useEffect(() => {
    if (!activeSession || activeSession.status !== "running") return;
    const currentQty = activeSession.actualQuantity || 0;
    if (currentQty === 0) return;
    const currentCheckpoint =
      Math.floor(currentQty / QC_TRIGGER_INTERVAL) * QC_TRIGGER_INTERVAL;
    const lastCheckpoint =
      Math.floor(lastQcCheckQty / QC_TRIGGER_INTERVAL) * QC_TRIGGER_INTERVAL;
    if (currentCheckpoint > lastCheckpoint && currentQty >= QC_TRIGGER_INTERVAL) {
      setQcReminderVisible(true);
      setLastQcCheckQty(currentQty);
    }
  }, [activeSession?.actualQuantity, activeSession?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Offline queue helpers ─────────────────────────────────────────────────

  function enqueueOfflineAction(method: string, path: string, body?: unknown) {
    try {
      const existing: OfflineAction[] = JSON.parse(
        safeStorage.getItem(OFFLINE_QUEUE_KEY) || "[]",
      );
      existing.push({
        id: `oq-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        method, path, body, ts: Date.now(),
      });
      safeStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(existing));
    } catch { /* localStorage error — ignore */ }
  }

  const flushOfflineQueue = useCallback(async () => {
    const token = tabletToken || safeStorage.getItem("iot_tablet_token") || "";
    if (!token) return;
    try {
      const queue: OfflineAction[] = JSON.parse(
        safeStorage.getItem(OFFLINE_QUEUE_KEY) || "[]",
      );
      if (queue.length === 0) return;
      const remaining: OfflineAction[] = [];
      for (const action of queue) {
        try {
          // eslint-disable-next-line no-restricted-globals -- raw fetch: IoT tablet uses x-tablet-token auth, not ERP session cookie
          const res = await fetch(action.path, {
            method: action.method,
            headers: { "Content-Type": "application/json", "x-tablet-token": token },
            body: action.body !== undefined ? JSON.stringify(action.body) : undefined,
          });
          if (!res.ok) remaining.push(action);
        } catch {
          remaining.push(action);
        }
      }
      safeStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
      if (remaining.length < queue.length) {
        toast({
          title: t(
            `${queue.length - remaining.length} ta offline action sinxronlandi`,
            `${queue.length - remaining.length} оффлайн-действий синхронизировано`,
          ),
        });
      }
    } catch { /* ignore */ }
  }, [tabletToken, toast, t]);

  // Online / offline event listeners
  useEffect(() => {
    const handleOnline = () => {
      toast({ title: t("Internet tiklandi — sinxronlash...", "Интернет восстановлен — синхронизация...") });
      flushOfflineQueue();
    };
    const handleOffline = () => {
      toast({
        title: t(
          "Internet aloqasi yo'q — offline rejimda davom etilmoqda",
          "Нет интернета — работа в оффлайн режиме",
        ),
        variant: "destructive",
      });
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    if (navigator.onLine) flushOfflineQueue();
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [isLoggedIn, flushOfflineQueue, toast, t]);

  // ── Offline-aware fetch wrapper ────────────────────────────────────────────

  async function tabletFetchWithOffline(
    method: "GET" | "POST" | "PATCH",
    path: string,
    body?: unknown,
    tabletFetchFn?: (m: "GET" | "POST" | "PATCH", p: string, b?: unknown) => Promise<Response>,
  ): Promise<Response | null> {
    if (!navigator.onLine) {
      if (method !== "GET") enqueueOfflineAction(method, path, body);
      return null;
    }
    try {
      if (!tabletFetchFn) return null;
      return await tabletFetchFn(method, path, body);
    } catch {
      if (method !== "GET") enqueueOfflineAction(method, path, body);
      return null;
    }
  }

  // ── SOS submission ────────────────────────────────────────────────────────

  async function handleSOSSend() {
    if (!sosMessage.trim()) {
      toast({ title: t("Xabar kiriting", "Введите сообщение"), variant: "destructive" });
      return;
    }
    const token = tabletToken || safeStorage.getItem("iot_tablet_token") || "";
    if (!token) {
      toast({
        title: t("Sessiya muddati tugagan, qayta kiring", "Сессия истекла, войдите снова"),
        variant: "destructive",
      });
      return;
    }
    try {
      // eslint-disable-next-line no-restricted-globals -- raw fetch: IoT tablet uses x-tablet-token auth, not ERP session cookie
      const res = await fetch("/api/iot/tablet/sos-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tablet-token": token },
        body: JSON.stringify({
          sessionId: activeSession?.id || null,
          equipmentId: assignedEquipment?.id || null,
          alertType: sosType,
          message: sosMessage.trim(),
        }),
      });
      if (res.ok) {
        toast({
          title: t("SOS xabari yuborildi!", "SOS-сообщение отправлено!"),
          description: t("Sex boshlig'i xabardor qilindi", "Начальник цеха уведомлён"),
        });
      } else {
        toast({ title: t("Yuborishda xatolik", "Ошибка отправки"), variant: "destructive" });
      }
    } catch {
      toast({
        title: t("Server bilan bog'lanishda xatolik", "Ошибка подключения к серверу"),
        variant: "destructive",
      });
    }
    setSosMessage("");
    setShowSOSDialog(false);
  }

  return {
    qcReminderVisible, setQcReminderVisible,
    lastQcCheckQty, setLastQcCheckQty,
    enqueueOfflineAction,
    flushOfflineQueue,
    tabletFetchWithOffline,
    handleSOSSend,
  };
}
