/**
 * @module useIoTTabletAuth
 * @description Login and logout handlers for the IoT tablet. Accepts the
 * relevant state setters from useIoTTabletCore and returns `handleLogin` /
 * `handleLogout` as plain async functions — no React hooks called here.
 */

import { safeStorage } from "@/lib/safeStorage";
import { Equipment, ProductionOrder } from "./iot-types";

export interface UseIoTTabletAuthParams {
  tabelNumber: string;
  workerPassword: string;
  tabletToken: string;
  t: (uz: string, ru: string) => string;
  toast: (opts: { title: string; description?: string; variant?: "destructive" | "default" }) => void;
  setWorkerId: (v: string) => void;
  setWorkerName: (v: string) => void;
  setAssignedEquipment: (v: Equipment | null) => void;
  setSelectedEquipment: (v: Equipment | null) => void;
  setAssignedOrders: (v: ProductionOrder[]) => void;
  setTabletToken: (v: string) => void;
  setIsLoggedIn: (v: boolean) => void;
  setTabelNumber: (v: string) => void;
  setWorkerPassword: (v: string) => void;
  setActiveSession: (v: null) => void;
  setSelectedOrder: (v: null) => void;
  setShowSchedule: (v: boolean) => void;
}

export function buildIoTTabletAuth({
  tabelNumber, workerPassword, t, toast,
  setWorkerId, setWorkerName, setAssignedEquipment, setSelectedEquipment,
  setAssignedOrders, setTabletToken, setIsLoggedIn, setTabelNumber, setWorkerPassword,
  setActiveSession, setSelectedOrder, setShowSchedule,
}: UseIoTTabletAuthParams) {

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
      const res = await fetch("/api/iot/tablet/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tabelNumber, password: workerPassword }),
      });
      if (res.ok) {
        const d = await res.json();
        setWorkerId(d.id); setWorkerName(d.name);
        if (d.equipment) { setAssignedEquipment(d.equipment); setSelectedEquipment(d.equipment); }
        if (d.orders) setAssignedOrders(d.orders);
        safeStorage.setItem("iot_worker_id", d.id);
        safeStorage.setItem("iot_worker_name", d.name);
        safeStorage.setItem("iot_assigned_equipment", JSON.stringify(d.equipment || null));
        safeStorage.setItem("iot_login_at", String(Date.now()));
        if (d.tabletToken) { setTabletToken(d.tabletToken); safeStorage.setItem("iot_tablet_token", d.tabletToken); }
        setIsLoggedIn(true); setTabelNumber(""); setWorkerPassword("");
        toast({ title: t("Xush kelibsiz!", "Добро пожаловать!") });
      } else {
        const err = await res.json();
        toast({ title: err.error || t("Noto'g'ri ma'lumotlar", "Неверные данные"), variant: "destructive" });
      }
    } catch {
      toast({ title: t("Server bilan bog'lanishda xatolik", "Ошибка подключения к серверу"), variant: "destructive" });
    }
  };

  const handleLogout = () => {
    (["iot_worker_id", "iot_worker_name", "iot_assigned_equipment", "iot_login_at", "iot_tablet_token"]).forEach(
      k => safeStorage.removeItem(k),
    );
    setTabletToken(""); setIsLoggedIn(false);
    setWorkerId(""); setWorkerName("");
    setActiveSession(null); setSelectedOrder(null);
    setAssignedEquipment(null); setAssignedOrders([]); setShowSchedule(true);
  };

  return { handleLogin, handleLogout };
}
