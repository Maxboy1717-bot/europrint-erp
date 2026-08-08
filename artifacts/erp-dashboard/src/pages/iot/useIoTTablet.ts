/**
 * @module useIoTTablet
 * @description Main IoT-tablet hook. Composes sub-hooks and owns all
 * useMutation calls (session lifecycle, defect/downtime reporting, handover,
 * inline QC). Re-exports the full API surface consumed by IoTTablet page
 * components.
 *
 * Sub-modules:
 *   - useIoTTabletCore       — state, auth, timers
 *   - useIoTTabletData       — all useQuery hooks
 *   - useIoTTabletAlerts     — offline queue, SOS, QC reminder
 *   - useIoTTabletFormatters — pure time-format utilities
 *   - useIoTTabletTypes      — constants / types (no hook)
 */

import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { safeStorage } from "@/lib/safeStorage"; // needed for submitHandover token lookup
import { tabletFetch as sharedTabletFetch } from "./tabletFetch";
import { useToast } from "@/hooks/use-toast";
import { ProductionSession, CompletionReportData } from "./iot-types";
import { REASON_ICONS } from "./useIoTTabletTypes";
import { useIoTTabletCore } from "./useIoTTabletCore";
import { useIoTTabletData } from "./useIoTTabletData";
import { useIoTTabletAlerts } from "./useIoTTabletAlerts";
import { formatTime, formatEstimatedTime } from "./useIoTTabletFormatters";
import { buildIoTTabletAuth } from "./useIoTTabletAuth";

export { REASON_ICONS };

export function useIoTTablet() {
  const { toast } = useToast();

  // ── Sub-hooks ────────────────────────────────────────────────────────────
  const core = useIoTTabletCore();

  const data = useIoTTabletData({
    isLoggedIn: core.isLoggedIn,
    workerId: core.workerId,
    tabletToken: core.tabletToken,
    showChecklistModal: core.showChecklistModal,
    t: core.t,
    setShiftInfo: core.setShiftInfo,
    setShiftRemaining: core.setShiftRemaining,
    setActiveSession: core.setActiveSession,
    setShowSchedule: core.setShowSchedule,
  });

  const alerts = useIoTTabletAlerts({
    isLoggedIn: core.isLoggedIn,
    tabletToken: core.tabletToken,
    activeSession: core.activeSession,
    assignedEquipment: core.assignedEquipment,
    sosMessage: core.sosMessage,
    setSosMessage: core.setSosMessage,
    sosType: core.sosType,
    setShowSOSDialog: core.setShowSOSDialog,
    showQcFormDialog: core.showQcFormDialog,
    setShowQcFormDialog: core.setShowQcFormDialog,
    t: core.t,
  });

  // ── Shift countdown ───────────────────────────────────────────────────────
  useEffect(() => {
    const cleanup = data.buildShiftCountdown(core.shiftRemaining, core.setShiftRemaining);
    return cleanup;
  }, [core.shiftRemaining > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auth: login / logout ──────────────────────────────────────────────────

  const { handleLogin, handleLogout } = buildIoTTabletAuth({
    tabelNumber: core.tabelNumber, workerPassword: core.workerPassword,
    tabletToken: core.tabletToken, t: core.t, toast,
    setWorkerId: core.setWorkerId, setWorkerName: core.setWorkerName,
    setAssignedEquipment: core.setAssignedEquipment, setSelectedEquipment: core.setSelectedEquipment,
    setAssignedOrders: core.setAssignedOrders, setTabletToken: core.setTabletToken,
    setIsLoggedIn: core.setIsLoggedIn, setTabelNumber: core.setTabelNumber,
    setWorkerPassword: core.setWorkerPassword,
    setActiveSession: (v) => core.setActiveSession(v as null),
    setSelectedOrder: (v) => core.setSelectedOrder(v as null),
    setShowSchedule: core.setShowSchedule,
  });

  // ── Helper: generate material kit after session creation ─────────────────

  type KitMaterial = { name: string; quantity: number; unit: string };
  type KitGenerateResponse = {
    kit?: { id: string; barcode?: string };
    materials?: KitMaterial[];
  };
  type KitDetailsResponse = {
    barcode?: string;
    items?: Array<{
      id: string;
      materialName: string;
      requiredQuantity: number;
      unit: string;
      itemBarcode: string;
      isScanned: boolean;
    }>;
  };
  async function applyKitChecklist(session: ProductionSession) {
    const fallbackBarcode = `KIT-${session.sessionNumber || Date.now()}`;
    try {
      const kitData = await apiRequest<KitGenerateResponse>("POST", "/api/iot/material-kits/generate", {
        orderId: core.selectedOrder?.id,
        scheduledDate: new Date().toISOString().split("T")[0],
        scheduledTime: new Date().toTimeString().slice(0, 5),
        equipmentId: core.selectedEquipment?.id,
      });
      if (kitData.kit) {
        const kitDetails = await apiRequest<KitDetailsResponse>('GET', `/api/iot/material-kits/${kitData.kit.id}`);
        core.setChecklistKitBarcode(kitDetails.barcode || kitData.kit.barcode || "");
        core.setChecklistMaterials(kitDetails.items || kitData.materials?.map(
          (m, idx) => ({
            id: `temp-${idx}`, materialName: m.name, requiredQuantity: m.quantity,
            unit: m.unit, itemBarcode: `ITEM-${Date.now()}-${idx}`, isScanned: false,
          })) || []);
        return;
      }
    } catch { /* fall through to defaults */ }
    core.setChecklistMaterials([]);
    core.setChecklistKitBarcode(fallbackBarcode);
  }

  // ── Mutations ─────────────────────────────────────────────────────────────

  const createSession = useMutation({
    mutationFn: async () => {
      if (!core.selectedOrder || !core.selectedEquipment) throw new Error("Order and equipment required");
      const res: Response = await data.tabletFetch("POST", "/api/iot/production-sessions", {
        productionOrderId: core.selectedOrder.id, equipmentId: core.selectedEquipment.id,
        targetQuantity: core.selectedOrder.quantity,
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || "Session xatolik");
      return res.json() as Promise<ProductionSession>;
    },
    onSuccess: async (session) => {
      core.setActiveSession(session);
      queryClient.invalidateQueries({ queryKey: ["/api/iot/production-sessions"] });
      await applyKitChecklist(session);
      core.setCrewAssignment({ masterId: core.workerId, polmasterId: null, shogirdId: null, roklerId: null });
      core.setShowChecklistModal(true);
      toast({ title: core.t("ttSetupStartedFillChecklist") });
    },
    onError: (err: Error) => { toast({ title: err.message, variant: "destructive" }); },
  });

  const scanMaterial = useMutation({
    mutationFn: async (materialId: string) => {
      core.setScanningItemId(materialId);
      await new Promise(resolve => setTimeout(resolve, 500));
      // B14/Decision 1 (2026-07-06): was using apiRequest (ERP JWT/cookie auth), but
      // this route now requires the tablet token (x-tablet-token) -- a bare kiosk
      // tablet has no ERP session, so this call always silently failed.
      // IOT-TABLET-PAGE-DEEP-DIVE-2026-07-04 Q13: the failure used to be swallowed
      // (try/catch{ignore}, no res.ok check) and the mutation always resolved as if
      // the scan had succeeded — a frontend green-lie (item shown "scanned" even on
      // a rejected scan, since fetch only rejects on network failure, not HTTP error
      // status). Same res.ok-check pattern as submitHandover above.
      const res = await data.tabletFetch("POST", `/api/iot/material-kit-items/${materialId}/scan`, {
        scannedBy: core.workerId,
        barcode: (Array.isArray(core.checklistMaterials) ? core.checklistMaterials : []).find(m => m.id === materialId)?.itemBarcode,
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || "Scan xatolik");
      return materialId;
    },
    onSuccess: (materialId) => {
      core.setChecklistMaterials(prev =>
        (Array.isArray(prev) ? prev : []).map(m => m.id === materialId ? { ...m, isScanned: true } : m),
      );
      core.setScanningItemId(null);
      toast({ title: core.t("ttMaterialScanned") });
    },
    onError: (err: Error) => {
      core.setScanningItemId(null);
      toast({ title: core.t("ttMaterialScanFailed"), description: err.message, variant: "destructive" });
    },
  });

  const startProductionFromChecklist = useMutation({
    mutationFn: async () => {
      if (!core.activeSession) throw new Error("No session");
      const crewRes: Response = await data.tabletFetch("POST", `/api/iot/production-sessions/${core.activeSession.id}/crew`, core.crewAssignment);
      if (!crewRes.ok) throw new Error((await crewRes.json().catch(() => null))?.error || "Brigada xatolik");
      const res: Response = await data.tabletFetch("POST", `/api/iot/production-sessions/${core.activeSession.id}/start`);
      // Third-party audit finding (2026-08-06): BE returns 422 BLOCKED when the
      // safety checklist isn't complete (iot-tablet.controller.ts start handler).
      // Without this check, res.json() on a 422 still resolves — the safety gate
      // was silently swallowed and the FE showed "started" regardless.
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || "Xavfsizlik checklist bloklandi");
      return res.json() as Promise<ProductionSession>;
    },
    onSuccess: (session) => {
      core.setActiveSession(session); core.setShowChecklistModal(false); core.setShowSchedule(false);
      queryClient.invalidateQueries({ queryKey: ["/api/iot/production-sessions"] });
      toast({ title: core.t("ttProductionStartedExcl") });
    },
    onError: (err: Error) => { toast({ title: err.message, variant: "destructive" }); },
  });

  const startSession = useMutation({
    mutationFn: async () => {
      if (!core.activeSession) throw new Error("No session");
      const res: Response = await data.tabletFetch("POST", `/api/iot/production-sessions/${core.activeSession.id}/start`);
      // Same safety-checklist-gate bypass as startProductionFromChecklist above.
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || "Xavfsizlik checklist bloklandi");
      return res.json() as Promise<ProductionSession>;
    },
    onSuccess: (session) => {
      core.setActiveSession(session);
      queryClient.invalidateQueries({ queryKey: ["/api/iot/production-sessions"] });
      toast({ title: core.t("ttProductionStarted") });
    },
    onError: (err: Error) => { toast({ title: err.message, variant: "destructive" }); },
  });

  const stopSession = useMutation({
    mutationFn: async () => {
      if (!core.activeSession) throw new Error("No session");
      const response: Response = await data.tabletFetch(
        "POST", `/api/iot/production-sessions/${core.activeSession.id}/stop`,
        { runningTimeSeconds: core.elapsedTime },
      );
      if (!response.ok) throw new Error((await response.json().catch(() => null))?.error || "To'xtatishda xatolik");
      return response.json();
    },
    onSuccess: (res: { report?: CompletionReportData }) => {
      if (res?.report) { core.setCompletionReport(res.report); core.setShowCompletionReport(true); }
      core.setActiveSession(null); core.setSetupTime(0); core.setElapsedTime(0);
      alerts.setQcReminderVisible(false); alerts.setLastQcCheckQty(0);
      queryClient.invalidateQueries({ queryKey: ["/api/iot/production-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/iot/tablet/orders"] });
      toast({ title: core.t("ttSessionEnded") });
    },
    onError: (err: Error) => { toast({ title: err.message, variant: "destructive" }); },
  });

  const reportDefect = useMutation({
    mutationFn: async () => {
      if (!core.activeSession) throw new Error("No session");
      const res: Response = await data.tabletFetch("POST", `/api/iot/production-sessions/${core.activeSession.id}/defect`, {
        quantity: parseInt(core.defectQty), reason: core.defectReason,
        reasonCode: core.defectReason, stage: core.defectStage || "any",
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || "Brak qayd etishda xatolik");
    },
    onSuccess: () => {
      core.setShowDefectDialog(false); core.setDefectQty(""); core.setDefectReason(""); core.setDefectStage("");
      queryClient.invalidateQueries({ queryKey: ["/api/iot/production-sessions"] });
      toast({ title: core.t("ttDefectLogged") });
    },
    onError: (err: Error) => { toast({ title: err.message, variant: "destructive" }); },
  });

  const submitHandover = useMutation({
    mutationFn: async () => {
      const token = core.tabletToken || safeStorage.getItem("iot_tablet_token") || "";
      if (!token) throw new Error("Tablet sessiyasi yo'q");
      if (!core.handoverSignature.trim())
        throw new Error(core.t("ttSignatureRequired"));
      const res = await sharedTabletFetch("POST", "/api/iot/tablet/handover", {
        department: core.assignedEquipment?.name || "Ishlab chiqarish",
        ...core.handoverNotes,
        signatureData: `${core.workerName}::${Date.now()}::${core.handoverSignature.trim()}`,
      }, token);
      if (!res.ok) throw new Error((await res.json()).error || "Handover xatolik");
    },
    onSuccess: () => {
      core.setShowHandoverDialog(false);
      core.setHandoverNotes({ machineStatus: "", pendingTasks: "", qualityIssues: "", safetyNotes: "", materialStatus: "" });
      core.setHandoverSignature("");
      toast({ title: core.t("ttHandoverSuccess") });
    },
    onError: (err: Error) => { toast({ title: err.message, variant: "destructive" }); },
  });

  const submitInlineQC = useMutation({
    mutationFn: async () => {
      if (!core.activeSession) throw new Error("No session");
      const res: Response = await data.tabletFetch("POST", `/api/iot/production-sessions/${core.activeSession.id}/inline-qc`, {
        sampleSize: parseInt(core.qcSampleSize) || 10, defectCount: parseInt(core.qcDefectCount) || 0,
        notes: core.qcNotes, quantity: core.activeSession.actualQuantity,
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || "QC saqlashda xatolik");
    },
    onSuccess: () => {
      core.setShowQcFormDialog(false); alerts.setQcReminderVisible(false);
      core.setQcSampleSize(""); core.setQcDefectCount(""); core.setQcNotes("");
      toast({ title: core.t("ttQcLogged") });
    },
    onError: (err: Error) => {
      toast({ title: core.t("ttQcSaveError"), description: err.message, variant: "destructive" });
    },
  });

  const reportDowntime = useMutation({
    mutationFn: async () => {
      if (!core.activeSession) throw new Error("No session");
      const minutes = Number(core.downtimeMinutes);
      if (isNaN(minutes) || minutes < 1 || minutes > 480) throw new Error("Invalid duration");
      // VISION-3340 16.60/16.61: selectedReasonCode now holds the picked mes_downtime_reasons
      // id (Select value). Resolve the catalog row so we send reasonId (populates
      // downtime_events.reason_code_id) plus the catalog code as reasonCode (schema-required
      // string). Falls back to the raw value if the row is not found (defensive).
      const picked = (Array.isArray(data.reasonCodes) ? data.reasonCodes : [])
        .find(rc => String(rc.id) === core.selectedReasonCode);
      const res: Response = await data.tabletFetch("POST", "/api/iot/downtime-events", {
        sessionId: core.activeSession.id, eventType: "manual_entry",
        durationMinutes: minutes,
        reasonCode: picked?.code ?? core.selectedReasonCode,
        reasonId: picked ? Number(picked.id) : undefined,
        notes: core.downtimeNotes,
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || "Prostoy qayd etishda xatolik");
    },
    onSuccess: () => {
      core.setShowDowntimeDialog(false);
      core.setSelectedReasonCode(""); core.setDowntimeNotes(""); core.setDowntimeMinutes("");
      toast({ title: core.t("ttDowntimeLogged") });
    },
    onError: (err: Error) => { toast({ title: err.message, variant: "destructive" }); },
  });

  // ── Composed return ───────────────────────────────────────────────────────

  return {
    ...core,
    // Override toast (already in core — no duplication needed)
    // Data queries
    orders: data.orders, ordersLoading: data.ordersLoading, isError: data.isError, refetch: data.refetch,
    defectReasons: data.defectReasons, defectReasonsLoading: data.defectReasonsLoading,
    equipmentList: data.equipmentList, reasonCodes: data.reasonCodes, employees: data.employees,
    sessions: data.sessions as ProductionSession[],
    // Alerts
    qcReminderVisible: alerts.qcReminderVisible,
    // Auth actions
    handleLogin, handleLogout,
    handleSOSSend: alerts.handleSOSSend,
    // Mutations
    createSession, scanMaterial, startProductionFromChecklist,
    startSession, stopSession, reportDefect,
    submitHandover, submitInlineQC, reportDowntime,
    // Formatters (bound with t)
    formatTime,
    formatEstimatedTime: (seconds: number) => formatEstimatedTime(seconds, core.t),
  };
}
