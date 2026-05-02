import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  ProductionOrder, Equipment, ProductionSession, DowntimeReasonCode,
  ChecklistMaterial, Employee, CrewAssignment, CompletionReportData, IotLang,
} from "./iot-types";
import { AlertTriangle, Package, Wrench, Coffee, Settings, Clock, Zap } from "lucide-react";
import { safeStorage } from '@/lib/safeStorage';

export const REASON_ICONS: Record<string, typeof AlertTriangle> = {
  material_shortage: Package,
  machine_breakdown: Wrench,
  break: Coffee,
  setup: Settings,
  quality_issue: AlertTriangle,
  shift_change: Clock,
  power_outage: Zap,
};

export function useIoTTablet() {
  const { toast } = useToast();
  const [lang, setLang] = useState<IotLang>(() => (safeStorage.getItem("iot_lang") as IotLang) || "uz");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [workerId, setWorkerId] = useState("");
  const [workerName, setWorkerName] = useState("");
  const [tabelNumber, setTabelNumber] = useState("");
  const [workerPassword, setWorkerPassword] = useState("");
  const [assignedEquipment, setAssignedEquipment] = useState<Equipment | null>(null);
  const [assignedOrders, setAssignedOrders] = useState<ProductionOrder[]>([]);
  const [showSchedule, setShowSchedule] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [activeSession, setActiveSession] = useState<ProductionSession | null>(null);
  const [showDefectDialog, setShowDefectDialog] = useState(false);
  const [showDowntimeDialog, setShowDowntimeDialog] = useState(false);
  const [showCompletionReport, setShowCompletionReport] = useState(false);
  const [completionReport, setCompletionReport] = useState<CompletionReportData | null>(null);
  const [defectQty, setDefectQty] = useState("");
  const [defectReason, setDefectReason] = useState("");
  const [selectedReasonCode, setSelectedReasonCode] = useState("");
  const [downtimeNotes, setDowntimeNotes] = useState("");
  const [downtimeMinutes, setDowntimeMinutes] = useState("");
  const [shiftRemaining, setShiftRemaining] = useState(0);
  const [shiftInfo, setShiftInfo] = useState<{ name: string; nameRu: string; startTime: string; endTime: string; coWorkers?: { id: string; name: string }[] } | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [setupTime, setSetupTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
  const [currentDate, setCurrentDate] = useState(new Date().toLocaleDateString("uz-UZ", { weekday: "long", year: "numeric", month: "long", day: "numeric" }));
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [checklistMaterials, setChecklistMaterials] = useState<ChecklistMaterial[]>([]);
  const [checklistKitBarcode, setChecklistKitBarcode] = useState("");
  const [crewAssignment, setCrewAssignment] = useState<CrewAssignment>({ masterId: null, polmasterId: null, shogirdId: null, roklerId: null });
  const [scanningItemId, setScanningItemId] = useState<string | null>(null);
  const [showSOSDialog, setShowSOSDialog] = useState(false);
  const [sosMessage, setSosMessage] = useState("");
  const [sosType, setSosType] = useState<"equipment" | "health" | "material" | "other">("equipment");
  const [tabletToken, setTabletToken] = useState<string>(() => safeStorage.getItem("iot_tablet_token") || "");
  const [defectStage, setDefectStage] = useState("");
  const [showHandoverDialog, setShowHandoverDialog] = useState(false);
  const [handoverNotes, setHandoverNotes] = useState({ machineStatus: "", pendingTasks: "", qualityIssues: "", safetyNotes: "", materialStatus: "" });
  const [handoverSignature, setHandoverSignature] = useState("");
  const [showQcFormDialog, setShowQcFormDialog] = useState(false);
  const [qcSampleSize, setQcSampleSize] = useState("");
  const [qcDefectCount, setQcDefectCount] = useState("");
  const [qcNotes, setQcNotes] = useState("");
  const [energySaving, setEnergySaving] = useState(false);
  const energyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [qcReminderVisible, setQcReminderVisible] = useState(false);
  const [lastQcCheckQty, setLastQcCheckQty] = useState(0);
  const QC_TRIGGER_INTERVAL = 500;

  const t = useCallback((uz: string, ru: string) => lang === "uz" ? uz : ru, [lang]);

  useEffect(() => { safeStorage.setItem("iot_lang", lang); }, [lang]);

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

  useEffect(() => { setQcReminderVisible(false); setLastQcCheckQty(0); }, [activeSession?.id]);

  useEffect(() => {
    if (!activeSession || activeSession.status !== "running") return;
    const currentQty = activeSession.actualQuantity || 0;
    if (currentQty === 0) return;
    const currentCheckpoint = Math.floor(currentQty / QC_TRIGGER_INTERVAL) * QC_TRIGGER_INTERVAL;
    const lastCheckpoint = Math.floor(lastQcCheckQty / QC_TRIGGER_INTERVAL) * QC_TRIGGER_INTERVAL;
    if (currentCheckpoint > lastCheckpoint && currentQty >= QC_TRIGGER_INTERVAL) {
      setQcReminderVisible(true);
      setLastQcCheckQty(currentQty);
    }
  }, [activeSession?.actualQuantity, activeSession?.status]);

  function getTabletToken(): string {
    return tabletToken || safeStorage.getItem("iot_tablet_token") || "";
  }

  async function tabletFetch(method: "GET" | "POST" | "PATCH", path: string, body?: unknown): Promise<Response> {
    const token = getTabletToken();
    if (!token) throw new Error(t("Sessiya muddati tugagan — iltimos qayta kiring", "Сессия истекла — войдите снова"));
    return fetch(path, {
      method,
      headers: { "Content-Type": "application/json", "x-tablet-token": token },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  // ===== Offline Queue: localStorage-da pending actions saqlash =====
  // Network o'chganda harakatlar queue'ga tushadi, online bo'lganda avtomatik sinxronlash
  const OFFLINE_QUEUE_KEY = "iot_offline_queue";
  type OfflineAction = { id: string; method: string; path: string; body?: unknown; ts: number };

  function enqueueOfflineAction(method: string, path: string, body?: unknown) {
    try {
      const existing: OfflineAction[] = JSON.parse(safeStorage.getItem(OFFLINE_QUEUE_KEY) || "[]");
      existing.push({ id: `oq-${Date.now()}-${Math.random().toString(36).slice(2)}`, method, path, body, ts: Date.now() });
      safeStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(existing));
    } catch { /* localStorage xatosi — ignore */ }
  }

  const flushOfflineQueue = useCallback(async () => {
    const token = getTabletToken();
    if (!token) return;
    try {
      const queue: OfflineAction[] = JSON.parse(safeStorage.getItem(OFFLINE_QUEUE_KEY) || "[]");
      if (queue.length === 0) return;
      const remaining: OfflineAction[] = [];
      for (const action of queue) {
        try {
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
        toast({ title: t(`${queue.length - remaining.length} ta offline action sinxronlandi`, `${queue.length - remaining.length} оффлайн-действий синхронизировано`) });
      }
    } catch { /* ignore */ }
  }, [toast, t]);

  useEffect(() => {
    const handleOnline = () => {
      toast({ title: t("Internet tiklandi — sinxronlash...", "Интернет восстановлен — синхронизация...") });
      flushOfflineQueue();
    };
    const handleOffline = () => {
      toast({ title: t("Internet aloqasi yo'q — offline rejimda davom etilmoqda", "Нет интернета — работа в оффлайн режиме"), variant: "destructive" });
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    // Startup: agar online bo'lsa va queue bo'lsa — flush
    if (navigator.onLine) flushOfflineQueue();
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [isLoggedIn, flushOfflineQueue, toast, t]);

  // tabletFetch'da offline qo'llab-quvvatlash (wrapper)
  async function tabletFetchWithOffline(method: "GET" | "POST" | "PATCH", path: string, body?: unknown): Promise<Response | null> {
    if (!navigator.onLine) {
      if (method !== "GET") enqueueOfflineAction(method, path, body);
      return null;
    }
    try {
      return await tabletFetch(method, path, body);
    } catch (netErr) {
      if (method !== "GET") enqueueOfflineAction(method, path, body);
      return null;
    }
  }

  async function handleSOSSend() {
    if (!sosMessage.trim()) {
      toast({ title: t("Xabar kiriting", "Введите сообщение"), variant: "destructive" });
      return;
    }
    const token = tabletToken || safeStorage.getItem("iot_tablet_token") || "";
    if (!token) {
      toast({ title: t("Sessiya muddati tugagan, qayta kiring", "Сессия истекла, войдите снова"), variant: "destructive" });
      return;
    }
    try {
      const res = await fetch("/api/iot/tablet/sos-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tablet-token": token },
        body: JSON.stringify({ sessionId: activeSession?.id || null, equipmentId: assignedEquipment?.id || null, alertType: sosType, message: sosMessage.trim() }),
      });
      if (res.ok) {
        toast({ title: t("SOS xabari yuborildi!", "SOS-сообщение отправлено!"), description: t("Sex boshlig'i xabardor qilindi", "Начальник цеха уведомлён") });
      } else {
        toast({ title: t("Yuborishda xatolik", "Ошибка отправки"), variant: "destructive" });
      }
    } catch {
      toast({ title: t("Server bilan bog'lanishda xatolik", "Ошибка подключения к серверу"), variant: "destructive" });
    }
    setSosMessage("");
    setShowSOSDialog(false);
  }

  useEffect(() => {
    const savedWorkerId = safeStorage.getItem("iot_worker_id");
    const savedWorkerName = safeStorage.getItem("iot_worker_name");
    const savedEquipment = safeStorage.getItem("iot_assigned_equipment");
    const loginTimestamp = safeStorage.getItem("iot_login_at");
    const SESSION_12H_MS = 12 * 60 * 60 * 1000;
    const isSessionExpired = loginTimestamp && (Date.now() - Number(loginTimestamp)) > SESSION_12H_MS;
    if (isSessionExpired) {
      (["iot_worker_id", "iot_worker_name", "iot_assigned_equipment", "iot_login_at"]).forEach(k => safeStorage.removeItem(k));
      return;
    }
    if (savedWorkerId && savedWorkerName) {
      setWorkerId(savedWorkerId);
      setWorkerName(savedWorkerName);
      if (savedEquipment && savedEquipment !== "null") {
        try { const eq = JSON.parse(savedEquipment); setAssignedEquipment(eq); setSelectedEquipment(eq); } catch { /* ignore */ }
      }
      setIsLoggedIn(true);
    }
  }, []);

  const { data: ordersData = [], isLoading: ordersLoading, isError, refetch } = useQuery({
    queryKey: ["/api/iot/tablet/orders", workerId],
    queryFn: async () => {
      const res = await tabletFetch("GET", `/api/iot/tablet/orders?workerId=${workerId}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isLoggedIn && !!workerId,
    refetchInterval: 30000,
  });
  const orders = ordersData as ProductionOrder[];

  const { data: defectReasonsData = [], isLoading: defectReasonsLoading } = useQuery<Array<{ code: string; labelUz: string; labelRu: string; stage: string }>>({
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

  useEffect(() => {
    const SESSION_12H_MS = 12 * 60 * 60 * 1000;
    const check = () => {
      const loginAt = safeStorage.getItem("iot_login_at");
      if (loginAt && (Date.now() - Number(loginAt)) > SESSION_12H_MS) {
        (["iot_worker_id", "iot_worker_name", "iot_assigned_equipment", "iot_login_at", "iot_tablet_token"]).forEach(k => safeStorage.removeItem(k));
        setWorkerId(""); setWorkerName(""); setAssignedEquipment(null); setTabletToken(""); setIsLoggedIn(false);
        toast({ title: t("Sessiya muddati tugadi. Iltimos qayta kiring.", "Время сессии истекло. Войдите снова."), variant: "destructive" });
      }
    };
    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const { data: workerScheduleData = [] } = useQuery({
    queryKey: ["/api/iot/tablet/worker-schedule", workerId],
    queryFn: async () => {
      const res = await tabletFetch("GET", `/api/iot/tablet/worker-schedule?workerId=${workerId}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isLoggedIn && !!workerId,
    refetchInterval: 60000,
  });

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

  const { data: reasonCodesData = [] } = useQuery({
    queryKey: ["/api/iot/downtime-reason-codes"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: isLoggedIn,
  });
  const reasonCodes = reasonCodesData as DowntimeReasonCode[];

  const { data: employeesData = { data: [] } } = useQuery({
    queryKey: ["/api/employees"],
    queryFn: async () => {
      const res = await fetch("/api/employees", { credentials: "include" });
      if (!res.ok) return { data: [] };
      return res.json();
    },
    enabled: isLoggedIn && showChecklistModal,
  });
  const employees = Array.isArray(employeesData) ? employeesData : ((employeesData as { data: Employee[] })?.data || []) as Employee[];

  const { data: shiftData } = useQuery({
    queryKey: ["/api/iot/tablet/shift"],
    queryFn: async () => {
      const res = await tabletFetch("GET", "/api/iot/tablet/shift");
      if (!res.ok) return null;
      return res.json();
    },
    enabled: isLoggedIn,
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (shiftData?.shift) {
      setShiftInfo({ name: shiftData.shift.name, nameRu: shiftData.shift.nameRu, startTime: shiftData.startTime, endTime: shiftData.endTime, coWorkers: shiftData.coWorkers || [] });
      setShiftRemaining(shiftData.remainingSeconds || 0);
    }
  }, [shiftData]);

  useEffect(() => {
    if (shiftRemaining > 0) {
      const interval = setInterval(() => {
        setShiftRemaining(prev => {
          const next = prev - 1;
          if (next <= 0) queryClient.invalidateQueries({ queryKey: ["/api/iot/tablet/shift"] });
          return Math.max(0, next);
        });
      }, 1000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [shiftRemaining > 0]);

  const { data: sessionsData = [] } = useQuery({
    queryKey: ["/api/iot/tablet/sessions", workerId],
    queryFn: async () => {
      const res = await tabletFetch("GET", `/api/iot/tablet/sessions?workerId=${workerId}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isLoggedIn && !!workerId,
    refetchInterval: 5000,
  });
  const sessions = sessionsData as ProductionSession[];

  useEffect(() => {
    if (sessions.length > 0) { setActiveSession(sessions[0]); setShowSchedule(false); }
  }, [sessions]);

  useEffect(() => {
    if (activeSession?.status === "running" && activeSession.startedAt) {
      const startTime = new Date(activeSession.startedAt).getTime();
      const interval = setInterval(() => setElapsedTime(Math.floor((Date.now() - startTime) / 1000)), 1000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [activeSession]);

  const setupStartedAt = activeSession?.setupStartedAt;
  const setupEndedAt = activeSession?.setupEndedAt;
  const setupTimeRef = useRef(0);
  useEffect(() => {
    if (setupStartedAt) {
      const startTime = new Date(setupStartedAt).getTime();
      if (setupEndedAt) {
        const duration = Math.floor((new Date(setupEndedAt).getTime() - startTime) / 1000);
        setupTimeRef.current = duration; setSetupTime(duration);
        return undefined;
      } else {
        const currentDuration = Math.floor((Date.now() - startTime) / 1000);
        setupTimeRef.current = currentDuration; setSetupTime(currentDuration);
        const interval = setInterval(() => {
          const dur = Math.floor((Date.now() - startTime) / 1000);
          setupTimeRef.current = dur; setSetupTime(dur);
        }, 1000);
        return () => clearInterval(interval);
      }
    } else if (activeSession === null) { setupTimeRef.current = 0; setSetupTime(0); }
    return undefined;
  }, [setupStartedAt, setupEndedAt, activeSession]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString(lang === "uz" ? "uz-UZ" : "ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setCurrentDate(now.toLocaleDateString(lang === "uz" ? "uz-UZ" : "ru-RU", { weekday: "long", year: "numeric", month: "long", day: "numeric" }));
    }, 1000);
    return () => clearInterval(timer);
  }, [lang]);

  const handleLogin = async () => {
    if (!tabelNumber || tabelNumber.length < 3) {
      toast({ title: t("Tabel raqamini to'liq kiriting", "Введите табельный номер полностью"), variant: "destructive" });
      return;
    }
    if (!workerPassword || workerPassword.length < 4) {
      toast({ title: t("Parol kamida 4 belgi bo'lishi kerak", "Пароль должен быть не менее 4 символов"), variant: "destructive" });
      return;
    }
    try {
      const res = await fetch("/api/iot/tablet/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tabelNumber, password: workerPassword }) });
      if (res.ok) {
        const data = await res.json();
        setWorkerId(data.id); setWorkerName(data.name);
        if (data.equipment) { setAssignedEquipment(data.equipment); setSelectedEquipment(data.equipment); }
        if (data.orders) setAssignedOrders(data.orders);
        safeStorage.setItem("iot_worker_id", data.id);
        safeStorage.setItem("iot_worker_name", data.name);
        safeStorage.setItem("iot_assigned_equipment", JSON.stringify(data.equipment || null));
        safeStorage.setItem("iot_login_at", String(Date.now()));
        if (data.tabletToken) { setTabletToken(data.tabletToken); safeStorage.setItem("iot_tablet_token", data.tabletToken); }
        setIsLoggedIn(true); setTabelNumber(""); setWorkerPassword("");
        toast({ title: t("Xush kelibsiz!", "Добро пожаловать!") });
      } else {
        const errorData = await res.json();
        toast({ title: errorData.error || t("Noto'g'ri ma'lumotlar", "Неверные данные"), variant: "destructive" });
      }
    } catch {
      toast({ title: t("Server bilan bog'lanishda xatolik", "Ошибка подключения к серверу"), variant: "destructive" });
    }
  };

  const handleLogout = () => {
    (["iot_worker_id", "iot_worker_name", "iot_assigned_equipment", "iot_login_at", "iot_tablet_token"]).forEach(k => safeStorage.removeItem(k));
    setTabletToken(""); setIsLoggedIn(false); setWorkerId(""); setWorkerName("");
    setActiveSession(null); setSelectedOrder(null); setSelectedEquipment(null); setAssignedEquipment(null);
    setAssignedOrders([]); setShowSchedule(true);
  };

  const createSession = useMutation({
    mutationFn: async () => {
      if (!selectedOrder || !selectedEquipment) throw new Error("Order and equipment required");
      const res: Response = await tabletFetch("POST", "/api/iot/production-sessions", { productionOrderId: selectedOrder.id, equipmentId: selectedEquipment.id, targetQuantity: selectedOrder.quantity });
      return res.json() as Promise<ProductionSession>;
    },
    onSuccess: async (data) => {
      setActiveSession(data);
      queryClient.invalidateQueries({ queryKey: ["/api/iot/production-sessions"] });
      try {
        const kitData = await apiRequest("POST", "/api/iot/material-kits/generate", { orderId: selectedOrder?.id, scheduledDate: new Date().toISOString().split("T")[0], scheduledTime: new Date().toTimeString().slice(0, 5), equipmentId: selectedEquipment?.id });
        if (kitData.kit) {
          const kitDetailsRes = await fetch(`/api/iot/material-kits/${kitData.kit.id}`, { credentials: "include" });
          const kitDetails = await kitDetailsRes.json();
          setChecklistKitBarcode(kitDetails.barcode || kitData.kit.barcode || "");
          setChecklistMaterials(kitDetails.items || kitData.materials?.map((m: { name: string; quantity: number; unit: string }, idx: number) => ({ id: `temp-${idx}`, materialName: m.name, requiredQuantity: m.quantity, unit: m.unit, itemBarcode: `ITEM-${Date.now()}-${idx}`, isScanned: false })) || []);
        } else {
          setChecklistMaterials([]);
          setChecklistKitBarcode(`KIT-${data.sessionNumber || Date.now()}`);
        }
      } catch {
        setChecklistMaterials([]);
        setChecklistKitBarcode(`KIT-${data.sessionNumber || Date.now()}`);
      }
      setCrewAssignment({ masterId: workerId, polmasterId: null, shogirdId: null, roklerId: null });
      setShowChecklistModal(true);
      toast({ title: t("Sozlash boshlandi - Cheklistni to'ldiring", "Настройка началась - Заполните чек-лист") });
    },
  });

  const scanMaterial = useMutation({
    mutationFn: async (materialId: string) => {
      setScanningItemId(materialId);
      await new Promise(resolve => setTimeout(resolve, 500));
      try {
        await apiRequest("PATCH", `/api/iot/material-kit-items/${materialId}/scan`, { scannedBy: workerId, barcode: (Array.isArray(checklistMaterials) ? checklistMaterials : []).find(m => m.id === materialId)?.itemBarcode });
      } catch { /* ignore */ }
      return materialId;
    },
    onSuccess: (materialId) => {
      setChecklistMaterials(prev => (Array.isArray(prev) ? prev : []).map(m => m.id === materialId ? { ...m, isScanned: true } : m));
      setScanningItemId(null);
      toast({ title: t("Material skanlandi", "Материал отсканирован") });
    },
    onError: () => { setScanningItemId(null); },
  });

  const startProductionFromChecklist = useMutation({
    mutationFn: async () => {
      if (!activeSession) throw new Error("No session");
      await tabletFetch("POST", `/api/iot/production-sessions/${activeSession.id}/crew`, crewAssignment);
      const res: Response = await tabletFetch("POST", `/api/iot/production-sessions/${activeSession.id}/start`);
      return res.json() as Promise<ProductionSession>;
    },
    onSuccess: (data) => {
      setActiveSession(data); setShowChecklistModal(false); setShowSchedule(false);
      queryClient.invalidateQueries({ queryKey: ["/api/iot/production-sessions"] });
      toast({ title: t("Ishlab chiqarish boshlandi!", "Производство началось!") });
    },
  });

  const startSession = useMutation({
    mutationFn: async () => {
      if (!activeSession) throw new Error("No session");
      const res: Response = await tabletFetch("POST", `/api/iot/production-sessions/${activeSession.id}/start`);
      return res.json() as Promise<ProductionSession>;
    },
    onSuccess: (data) => {
      setActiveSession(data);
      queryClient.invalidateQueries({ queryKey: ["/api/iot/production-sessions"] });
      toast({ title: t("Ishlab chiqarish boshlandi", "Производство началось") });
    },
  });

  const stopSession = useMutation({
    mutationFn: async () => {
      if (!activeSession) throw new Error("No session");
      const response: Response = await tabletFetch("POST", `/api/iot/production-sessions/${activeSession.id}/stop`, { runningTimeSeconds: elapsedTime });
      return response.json();
    },
    onSuccess: (data: { report?: CompletionReportData }) => {
      if (data?.report) { setCompletionReport(data.report); setShowCompletionReport(true); }
      setActiveSession(null); setSetupTime(0); setElapsedTime(0); setQcReminderVisible(false); setLastQcCheckQty(0);
      queryClient.invalidateQueries({ queryKey: ["/api/iot/production-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/iot/tablet/orders"] });
      toast({ title: t("Sessiya yakunlandi", "Сессия завершена") });
    },
  });

  const reportDefect = useMutation({
    mutationFn: async () => {
      if (!activeSession) throw new Error("No session");
      await tabletFetch("POST", `/api/iot/production-sessions/${activeSession.id}/defect`, { quantity: parseInt(defectQty), reason: defectReason, reasonCode: defectReason, stage: defectStage || "any" });
    },
    onSuccess: () => {
      setShowDefectDialog(false); setDefectQty(""); setDefectReason(""); setDefectStage("");
      queryClient.invalidateQueries({ queryKey: ["/api/iot/production-sessions"] });
      toast({ title: t("Brak qayd etildi", "Брак зафиксирован") });
    },
  });

  const submitHandover = useMutation({
    mutationFn: async () => {
      const token = tabletToken || safeStorage.getItem("iot_tablet_token") || "";
      if (!token) throw new Error("Tablet sessiyasi yo'q");
      if (!handoverSignature.trim()) throw new Error(t("Raqamli imzo majburiy", "Цифровая подпись обязательна"));
      const res = await fetch("/api/iot/tablet/handover", { method: "POST", headers: { "Content-Type": "application/json", "x-tablet-token": token }, body: JSON.stringify({ department: assignedEquipment?.name || "Ishlab chiqarish", ...handoverNotes, signatureData: `${workerName}::${Date.now()}::${handoverSignature.trim()}` }) });
      if (!res.ok) throw new Error((await res.json()).error || "Handover xatolik");
    },
    onSuccess: () => {
      setShowHandoverDialog(false); setHandoverNotes({ machineStatus: "", pendingTasks: "", qualityIssues: "", safetyNotes: "", materialStatus: "" }); setHandoverSignature("");
      toast({ title: t("Smena muvaffaqiyatli topshirildi", "Смена успешно сдана") });
    },
    onError: (err: Error) => { toast({ title: err.message, variant: "destructive" }); },
  });

  const submitInlineQC = useMutation({
    mutationFn: async () => {
      if (!activeSession) throw new Error("No session");
      await tabletFetch("POST", `/api/iot/production-sessions/${activeSession.id}/inline-qc`, { sampleSize: parseInt(qcSampleSize) || 10, defectCount: parseInt(qcDefectCount) || 0, notes: qcNotes, quantity: activeSession.actualQuantity });
    },
    onSuccess: () => {
      setShowQcFormDialog(false); setQcReminderVisible(false); setQcSampleSize(""); setQcDefectCount(""); setQcNotes("");
      toast({ title: t("QC tekshiruvi qayd etildi", "QC проверка зарегистрирована") });
    },
    onError: (err: Error) => { toast({ title: t("QC saqlanmadi — xatolik", "QC не сохранено — ошибка"), description: err.message, variant: "destructive" }); },
  });

  const reportDowntime = useMutation({
    mutationFn: async () => {
      if (!activeSession) throw new Error("No session");
      const minutes = Number(downtimeMinutes);
      if (isNaN(minutes) || minutes < 1 || minutes > 480) throw new Error("Invalid duration");
      await tabletFetch("POST", "/api/iot/downtime-events", { sessionId: activeSession.id, eventType: "manual_entry", durationMinutes: minutes, reasonCode: selectedReasonCode, notes: downtimeNotes });
    },
    onSuccess: () => {
      setShowDowntimeDialog(false); setSelectedReasonCode(""); setDowntimeNotes(""); setDowntimeMinutes("");
      toast({ title: t("To'xtash qayd etildi", "Остановка зафиксирована") });
    },
  });

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatEstimatedTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `~${hours}${t("s", "ч")} ${mins}${t("d", "м")}`;
    return `~${mins} ${t("daqiqa", "мин")}`;
  };

  return {
    lang, setLang, t,
    isLoggedIn, workerId, workerName,
    tabelNumber, setTabelNumber, workerPassword, setWorkerPassword,
    assignedEquipment, assignedOrders,
    showSchedule, setShowSchedule,
    selectedOrder, setSelectedOrder,
    selectedEquipment, setSelectedEquipment,
    activeSession, setActiveSession,
    showDefectDialog, setShowDefectDialog,
    showDowntimeDialog, setShowDowntimeDialog,
    showCompletionReport, setShowCompletionReport,
    completionReport, setCompletionReport,
    defectQty, setDefectQty,
    defectReason, setDefectReason,
    selectedReasonCode, setSelectedReasonCode,
    downtimeNotes, setDowntimeNotes,
    downtimeMinutes, setDowntimeMinutes,
    shiftRemaining, shiftInfo,
    elapsedTime, setupTime,
    currentTime, currentDate,
    showChecklistModal, setShowChecklistModal,
    checklistMaterials, setChecklistMaterials,
    checklistKitBarcode,
    crewAssignment, setCrewAssignment,
    scanningItemId,
    showSOSDialog, setShowSOSDialog,
    sosMessage, setSosMessage,
    sosType, setSosType,
    defectStage, setDefectStage,
    showHandoverDialog, setShowHandoverDialog,
    handoverNotes, setHandoverNotes,
    handoverSignature, setHandoverSignature,
    showQcFormDialog, setShowQcFormDialog,
    qcSampleSize, setQcSampleSize,
    qcDefectCount, setQcDefectCount,
    qcNotes, setQcNotes,
    energySaving, setEnergySaving,
    qcReminderVisible,
    orders, ordersLoading, isError, refetch,
    defectReasons, defectReasonsLoading,
    equipmentList, reasonCodes, employees,
    sessions: sessions as ProductionSession[],
    tabletToken,
    handleLogin, handleLogout, handleSOSSend,
    createSession, scanMaterial, startProductionFromChecklist,
    startSession, stopSession, reportDefect,
    submitHandover, submitInlineQC, reportDowntime,
    formatTime, formatEstimatedTime,
  };
}
