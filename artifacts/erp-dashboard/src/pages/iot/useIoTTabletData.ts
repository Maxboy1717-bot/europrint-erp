/**
 * @module useIoTTabletData
 * @description All useQuery hooks for the IoT tablet: production orders, defect
 * reasons, equipment list, downtime reason codes, employees, active shift, and
 * production sessions. Relies on core state (isLoggedIn, workerId, tabletToken)
 * passed in as parameters.
 */

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient, getQueryFn } from "@/lib/queryClient";
import { safeStorage } from "@/lib/safeStorage";
import { apiRequest } from "@/lib/queryClient";
import {
  ProductionOrder, Equipment, ProductionSession,
  DowntimeReasonCode, Employee,
} from "./iot-types";

// ---------------------------------------------------------------------------
// Helper: typed fetch with tablet token
// ---------------------------------------------------------------------------

function makeTabletFetch(tabletToken: string, t: (uz: string, ru: string) => string) {
  return async function tabletFetch(
    method: "GET" | "POST" | "PATCH",
    path: string,
    body?: unknown,
  ): Promise<Response> {
    const token = tabletToken || safeStorage.getItem("iot_tablet_token") || "";
    if (!token) throw new Error(t("Sessiya muddati tugagan — iltimos qayta kiring", "Сессия истекла — войдите снова"));
    return fetch(path, {
      method,
      headers: { "Content-Type": "application/json", "x-tablet-token": token },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseIoTTabletDataParams {
  isLoggedIn: boolean;
  workerId: string;
  tabletToken: string;
  showChecklistModal: boolean;
  t: (uz: string, ru: string) => string;
  setShiftInfo: React.Dispatch<React.SetStateAction<{
    name: string; nameRu: string; startTime: string; endTime: string;
    coWorkers?: { id: string; name: string }[];
  } | null>>;
  setShiftRemaining: React.Dispatch<React.SetStateAction<number>>;
  setActiveSession: React.Dispatch<React.SetStateAction<ProductionSession | null>>;
  setShowSchedule: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useIoTTabletData({
  isLoggedIn,
  workerId,
  tabletToken,
  showChecklistModal,
  t,
  setShiftInfo,
  setShiftRemaining,
  setActiveSession,
  setShowSchedule,
}: UseIoTTabletDataParams) {
  const tabletFetch = makeTabletFetch(tabletToken, t);

  // ── Production orders ────────────────────────────────────────────────────
  const {
    data: ordersData = [],
    isLoading: ordersLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["/api/iot/tablet/orders", workerId],
    queryFn: async () => {
      const res = await tabletFetch("GET", `/api/iot/tablet/orders?workerId=${workerId}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isLoggedIn && !!workerId,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });
  const orders = ordersData as ProductionOrder[];

  // ── Defect reasons ───────────────────────────────────────────────────────
  const { data: defectReasonsData = [], isLoading: defectReasonsLoading } = useQuery<
    Array<{ code: string; labelUz: string; labelRu: string; stage: string }>
  >({
    queryKey: ["/api/iot/tablet/defect-reasons"],
    queryFn: async () => {
      const token = tabletToken || safeStorage.getItem("iot_tablet_token") || "";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["x-tablet-token"] = token;
      const res = await fetch("/api/iot/tablet/defect-reasons", { headers });
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
  });
  const defectReasons = defectReasonsData;

  // ── Equipment list ───────────────────────────────────────────────────────
  const { data: equipmentData = [] } = useQuery({
    queryKey: ["/api/iot/tablet/equipment"],
    queryFn: async () => {
      const res = await tabletFetch("GET", "/api/iot/tablet/equipment");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isLoggedIn,
  });
  const equipmentList = equipmentData as Equipment[];

  // ── Downtime reason codes ─────────────────────────────────────────────────
  const { data: reasonCodesData = [] } = useQuery({
    queryKey: ["/api/iot/downtime-reason-codes"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: isLoggedIn,
  });
  const reasonCodes = reasonCodesData as DowntimeReasonCode[];

  // ── Employees (for crew checklist) ────────────────────────────────────────
  const { data: employeesData = { data: [] } } = useQuery({
    queryKey: ["/api/employees"],
    queryFn: async () => {
      try {
        return await apiRequest('GET', "/api/employees");
      } catch {
        return { data: [] };
      }
    },
    enabled: isLoggedIn && showChecklistModal,
  });
  const employees = (
    Array.isArray(employeesData)
      ? employeesData
      : ((employeesData as { data: Employee[] })?.data || [])
  ) as Employee[];

  // ── Worker schedule ───────────────────────────────────────────────────────
  const { data: workerScheduleData = [] } = useQuery({
    queryKey: ["/api/iot/tablet/worker-schedule", workerId],
    queryFn: async () => {
      const res = await tabletFetch("GET", `/api/iot/tablet/worker-schedule?workerId=${workerId}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isLoggedIn && !!workerId,
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
  });

  // ── Active shift ──────────────────────────────────────────────────────────
  const { data: shiftData } = useQuery({
    queryKey: ["/api/iot/tablet/shift"],
    queryFn: async () => {
      const res = await tabletFetch("GET", "/api/iot/tablet/shift");
      if (!res.ok) return null;
      return res.json();
    },
    enabled: isLoggedIn,
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    if (shiftData?.shift) {
      setShiftInfo({
        name: shiftData.shift.name,
        nameRu: shiftData.shift.nameRu,
        startTime: shiftData.startTime,
        endTime: shiftData.endTime,
        coWorkers: shiftData.coWorkers || [],
      });
      setShiftRemaining(shiftData.remainingSeconds || 0);
    }
  }, [shiftData, setShiftInfo, setShiftRemaining]);

  // ── Shift countdown (invalidate query when shift ends) ────────────────────
  useEffect(() => {
    // The countdown itself lives in core; here we only handle the refetch trigger.
    // This effect is a no-op stub — the countdown is managed in useIoTTabletCore
    // via the shiftRemaining state and its own interval.
  }, []);

  // ── Production sessions ───────────────────────────────────────────────────
  const { data: sessionsData = [] } = useQuery({
    queryKey: ["/api/iot/tablet/sessions", workerId],
    queryFn: async () => {
      const res = await tabletFetch("GET", `/api/iot/tablet/sessions?workerId=${workerId}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isLoggedIn && !!workerId,
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });
  const sessions = sessionsData as ProductionSession[];

  useEffect(() => {
    if (sessions.length > 0) {
      setActiveSession(sessions[0]);
      setShowSchedule(false);
    }
  }, [sessions, setActiveSession, setShowSchedule]);

  // ── Shift remaining countdown (drives queryClient invalidation) ───────────
  // NOTE: The actual shiftRemaining state lives in core; we expose a helper
  // so the main hook can wire the countdown → query invalidation.
  function buildShiftCountdown(
    shiftRemaining: number,
    setShiftRemainingFn: React.Dispatch<React.SetStateAction<number>>,
  ) {
    if (shiftRemaining <= 0) return undefined;
    const interval = setInterval(() => {
      setShiftRemainingFn(prev => {
        const next = prev - 1;
        if (next <= 0) queryClient.invalidateQueries({ queryKey: ["/api/iot/tablet/shift"] });
        return Math.max(0, next);
      });
    }, 1000);
    return () => clearInterval(interval);
  }

  return {
    orders, ordersLoading, isError, refetch,
    defectReasons, defectReasonsLoading,
    equipmentList,
    reasonCodes,
    employees,
    workerScheduleData,
    sessions,
    buildShiftCountdown,
    /** Exposed so the main hook can re-use the authenticated fetch. */
    tabletFetch,
  };
}
