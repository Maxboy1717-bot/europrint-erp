/**
 * @module useIoTTabletCore
 * @description Core IoT-tablet hook: auth state, worker identity, session
 * restoration from localStorage, clock/date ticker, energy-saving overlay,
 * and the bilingual `t()` helper. Does NOT contain data fetching or mutations.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { safeStorage } from "@/lib/safeStorage";
import { useTranslation } from "@/lib/i18n";
import {
  Equipment, ProductionOrder, ProductionSession,
  ChecklistMaterial, CrewAssignment, CompletionReportData,
} from "./iot-types";
import { SESSION_12H_MS, SosType } from "./useIoTTabletTypes";

export function useIoTTabletCore() {
  const { toast } = useToast();

  // ── Language ────────────────────────────────────────────────────────────
  // i18n F2 (2026-07-05): was a self-reinvented uz/ru-only useState + local
  // t(uz,ru) helper, persisted to its OWN "iot_lang" localStorage key --
  // disconnected from the rest of the app's language preference AND unable
  // to represent uz-cyr at all (the type itself excluded it), so Cyrillic
  // users on shop-floor tablets always saw Russian. Now uses the canonical
  // key-based i18n system (locales/*/iot.json), which already has all 3
  // languages and shares the app-wide language preference.
  const { language: lang, setLanguage: setLang, t } = useTranslation("iot");

  // ── Auth / identity ─────────────────────────────────────────────────────
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [workerId, setWorkerId] = useState("");
  const [workerName, setWorkerName] = useState("");
  const [tabelNumber, setTabelNumber] = useState("");
  const [workerPassword, setWorkerPassword] = useState("");
  const [tabletToken, setTabletToken] = useState<string>(
    () => safeStorage.getItem("iot_tablet_token") || "",
  );

  // ── Equipment & orders ──────────────────────────────────────────────────
  const [assignedEquipment, setAssignedEquipment] = useState<Equipment | null>(null);
  const [assignedOrders, setAssignedOrders] = useState<ProductionOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  // ── Session / UI ────────────────────────────────────────────────────────
  const [showSchedule, setShowSchedule] = useState(true);
  const [activeSession, setActiveSession] = useState<ProductionSession | null>(null);
  const [showDefectDialog, setShowDefectDialog] = useState(false);
  const [showDowntimeDialog, setShowDowntimeDialog] = useState(false);
  const [showCompletionReport, setShowCompletionReport] = useState(false);
  const [completionReport, setCompletionReport] = useState<CompletionReportData | null>(null);

  // ── Defect form ─────────────────────────────────────────────────────────
  const [defectQty, setDefectQty] = useState("");
  const [defectReason, setDefectReason] = useState("");
  const [defectStage, setDefectStage] = useState("");

  // ── Downtime form ────────────────────────────────────────────────────────
  const [selectedReasonCode, setSelectedReasonCode] = useState("");
  const [downtimeNotes, setDowntimeNotes] = useState("");
  const [downtimeMinutes, setDowntimeMinutes] = useState("");

  // ── Shift ────────────────────────────────────────────────────────────────
  const [shiftRemaining, setShiftRemaining] = useState(0);
  const [shiftInfo, setShiftInfo] = useState<{
    name: string; nameRu: string; startTime: string; endTime: string;
    coWorkers?: { id: string; name: string }[];
  } | null>(null);

  // ── Elapsed / setup timers ───────────────────────────────────────────────
  const [elapsedTime, setElapsedTime] = useState(0);
  const [setupTime, setSetupTime] = useState(0);
  const setupTimeRef = useRef(0);

  // ── Clock display ────────────────────────────────────────────────────────
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  );
  const [currentDate, setCurrentDate] = useState(
    new Date().toLocaleDateString("uz-UZ", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
  );

  // ── Checklist / crew ─────────────────────────────────────────────────────
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [checklistMaterials, setChecklistMaterials] = useState<ChecklistMaterial[]>([]);
  const [checklistKitBarcode, setChecklistKitBarcode] = useState("");
  const [crewAssignment, setCrewAssignment] = useState<CrewAssignment>({
    masterId: null, polmasterId: null, shogirdId: null, roklerId: null,
  });
  const [scanningItemId, setScanningItemId] = useState<string | null>(null);

  // ── SOS ──────────────────────────────────────────────────────────────────
  const [showSOSDialog, setShowSOSDialog] = useState(false);
  const [sosMessage, setSosMessage] = useState("");
  const [sosType, setSosType] = useState<SosType>("equipment");

  // ── Handover ─────────────────────────────────────────────────────────────
  const [showHandoverDialog, setShowHandoverDialog] = useState(false);
  const [handoverNotes, setHandoverNotes] = useState({
    machineStatus: "", pendingTasks: "", qualityIssues: "", safetyNotes: "", materialStatus: "",
  });
  const [handoverSignature, setHandoverSignature] = useState("");

  // ── QC form ───────────────────────────────────────────────────────────────
  const [showQcFormDialog, setShowQcFormDialog] = useState(false);
  const [qcSampleSize, setQcSampleSize] = useState("");
  const [qcDefectCount, setQcDefectCount] = useState("");
  const [qcNotes, setQcNotes] = useState("");

  // ── Energy saving ─────────────────────────────────────────────────────────
  const [energySaving, setEnergySaving] = useState(false);
  const energyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetEnergyTimer = useCallback(() => {
    if (energySaving) setEnergySaving(false);
    if (energyTimerRef.current) clearTimeout(energyTimerRef.current);
    energyTimerRef.current = setTimeout(() => setEnergySaving(true), 300000);
  }, [energySaving]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const events: string[] = ["touchstart", "mousedown", "keydown"];
    (Array.isArray(events) ? events : []).forEach(e => window.addEventListener(e, resetEnergyTimer));
    resetEnergyTimer();
    return () => {
      (Array.isArray(events) ? events : []).forEach(e => window.removeEventListener(e, resetEnergyTimer));
      if (energyTimerRef.current) clearTimeout(energyTimerRef.current);
    };
  }, [isLoggedIn, resetEnergyTimer]);

  // ── Session restoration from localStorage ────────────────────────────────
  useEffect(() => {
    const savedWorkerId = safeStorage.getItem("iot_worker_id");
    const savedWorkerName = safeStorage.getItem("iot_worker_name");
    const savedEquipment = safeStorage.getItem("iot_assigned_equipment");
    const loginTimestamp = safeStorage.getItem("iot_login_at");
    const isSessionExpired =
      loginTimestamp && (Date.now() - Number(loginTimestamp)) > SESSION_12H_MS;

    if (isSessionExpired) {
      (["iot_worker_id", "iot_worker_name", "iot_assigned_equipment", "iot_login_at"]).forEach(
        k => safeStorage.removeItem(k),
      );
      return;
    }

    if (savedWorkerId && savedWorkerName) {
      setWorkerId(savedWorkerId);
      setWorkerName(savedWorkerName);
      if (savedEquipment && savedEquipment !== "null") {
        try {
          const eq = JSON.parse(savedEquipment);
          setAssignedEquipment(eq);
          setSelectedEquipment(eq);
        } catch { /* ignore */ }
      }
      setIsLoggedIn(true);
    }
  }, []);

  // ── 12-hour session expiry check (runs every 60 s) ────────────────────────
  useEffect(() => {
    const check = () => {
      const loginAt = safeStorage.getItem("iot_login_at");
      if (loginAt && (Date.now() - Number(loginAt)) > SESSION_12H_MS) {
        (["iot_worker_id", "iot_worker_name", "iot_assigned_equipment", "iot_login_at", "iot_tablet_token"]).forEach(
          k => safeStorage.removeItem(k),
        );
        setWorkerId(""); setWorkerName(""); setAssignedEquipment(null);
        setTabletToken(""); setIsLoggedIn(false);
        toast({
          title: t("sessionExpired"),
          variant: "destructive",
        });
      }
    };
    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Clock ticker ──────────────────────────────────────────────────────────
  useEffect(() => {
    // i18n F2: uz-cyr shares uz-UZ's numeric/date shape (only weekday-name
    // script differs, no distinct Intl locale tag needed for that) -- only
    // ru gets ru-RU. Previously this ternary only had 2 branches, so a
    // uz-cyr tablet would have silently rendered the clock in ru-RU shape.
    const clockLocale = lang === "ru" ? "ru-RU" : "uz-UZ";
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString(clockLocale, {
          hour: "2-digit", minute: "2-digit", second: "2-digit",
        }),
      );
      setCurrentDate(
        now.toLocaleDateString(clockLocale, {
          weekday: "long", year: "numeric", month: "long", day: "numeric",
        }),
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [lang]);

  // ── Elapsed time (running session) ────────────────────────────────────────
  useEffect(() => {
    if (activeSession?.status === "running" && activeSession.startedAt) {
      const startTime = new Date(activeSession.startedAt).getTime();
      const interval = setInterval(
        () => setElapsedTime(Math.floor((Date.now() - startTime) / 1000)),
        1000,
      );
      return () => clearInterval(interval);
    }
    return undefined;
  }, [activeSession]);

  // ── Setup time ────────────────────────────────────────────────────────────
  const setupStartedAt = activeSession?.setupStartedAt;
  const setupEndedAt = activeSession?.setupEndedAt;

  useEffect(() => {
    if (setupStartedAt) {
      const startTime = new Date(setupStartedAt).getTime();
      if (setupEndedAt) {
        const duration = Math.floor((new Date(setupEndedAt).getTime() - startTime) / 1000);
        setupTimeRef.current = duration;
        setSetupTime(duration);
        return undefined;
      }
      const currentDuration = Math.floor((Date.now() - startTime) / 1000);
      setupTimeRef.current = currentDuration;
      setSetupTime(currentDuration);
      const interval = setInterval(() => {
        const dur = Math.floor((Date.now() - startTime) / 1000);
        setupTimeRef.current = dur;
        setSetupTime(dur);
      }, 1000);
      return () => clearInterval(interval);
    } else if (activeSession === null) {
      setupTimeRef.current = 0;
      setSetupTime(0);
    }
    return undefined;
  }, [setupStartedAt, setupEndedAt, activeSession]);

  return {
    lang, setLang, t,
    isLoggedIn, setIsLoggedIn, workerId, setWorkerId, workerName, setWorkerName,
    tabelNumber, setTabelNumber, workerPassword, setWorkerPassword,
    tabletToken, setTabletToken,
    assignedEquipment, setAssignedEquipment, assignedOrders, setAssignedOrders,
    selectedOrder, setSelectedOrder, selectedEquipment, setSelectedEquipment,
    showSchedule, setShowSchedule, activeSession, setActiveSession,
    showDefectDialog, setShowDefectDialog, showDowntimeDialog, setShowDowntimeDialog,
    showCompletionReport, setShowCompletionReport, completionReport, setCompletionReport,
    defectQty, setDefectQty, defectReason, setDefectReason, defectStage, setDefectStage,
    selectedReasonCode, setSelectedReasonCode, downtimeNotes, setDowntimeNotes,
    downtimeMinutes, setDowntimeMinutes,
    shiftRemaining, setShiftRemaining, shiftInfo, setShiftInfo,
    elapsedTime, setElapsedTime, setupTime, setSetupTime, setupTimeRef,
    currentTime, currentDate,
    showChecklistModal, setShowChecklistModal,
    checklistMaterials, setChecklistMaterials, checklistKitBarcode, setChecklistKitBarcode,
    crewAssignment, setCrewAssignment, scanningItemId, setScanningItemId,
    showSOSDialog, setShowSOSDialog, sosMessage, setSosMessage, sosType, setSosType,
    showHandoverDialog, setShowHandoverDialog, handoverNotes, setHandoverNotes,
    handoverSignature, setHandoverSignature,
    showQcFormDialog, setShowQcFormDialog,
    qcSampleSize, setQcSampleSize, qcDefectCount, setQcDefectCount, qcNotes, setQcNotes,
    energySaving, setEnergySaving,
    toast,
  };
}
