/**
 * @module camera-alerts-types
 * @description Type definitions, constants, and helpers for camera-alerts page.
 */

import { Shield, CheckCircle, Factory, Activity, AlertTriangle } from "lucide-react";

export interface CameraAlert {
  id: number;
  cameraId: string;
  alertType: string;
  severity: string;
  title: string;
  titleRu: string;
  message: string;
  isAcknowledged: boolean;
  isResolved: boolean;
  acknowledgedBy: string | null;
  resolvedBy: string | null;
  createdAt: string;
}

export type Language = "uz" | "ru";

export const alertTypeIcons: Record<string, typeof Shield> = {
  safety: Shield,
  quality: CheckCircle,
  machine: Factory,
  productivity: Activity,
  system: AlertTriangle,
};

export const alertTypeLabels: Record<string, { uz: string; ru: string }> = {
  safety: { uz: "Xavfsizlik", ru: "Безопасность" },
  quality: { uz: "Sifat", ru: "Качество" },
  machine: { uz: "Mashina", ru: "Машина" },
  productivity: { uz: "Samaradorlik", ru: "Производительность" },
  system: { uz: "Tizim", ru: "Система" },
};

export const severityColors: Record<string, string> = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

export const severityLabels: Record<string, { uz: string; ru: string }> = {
  low: { uz: "Past", ru: "Низкий" },
  medium: { uz: "O'rta", ru: "Средний" },
  high: { uz: "Yuqori", ru: "Высокий" },
  critical: { uz: "Kritik", ru: "Критический" },
};

export interface AlertTranslations {
  title: string;
  subtitle: string;
  back: string;
  search: string;
  type: string;
  severity: string;
  status: string;
  all: string;
  pending: string;
  acknowledged: string;
  resolved: string;
  message: string;
  time: string;
  actions: string;
  acknowledge: string;
  resolve: string;
  noAlerts: string;
  total: string;
  unresolved: string;
  critical: string;
}

export function buildTranslations(language: Language): AlertTranslations {
  const uz = language === "uz";
  return {
    title: uz ? "Bildirishnomalar Markazi" : "Центр уведомлений",
    subtitle: uz ? "Barcha AI kamera ogohlantirishlarini boshqarish" : "Управление всеми уведомлениями AI камер",
    back: uz ? "Orqaga" : "Назад",
    search: uz ? "Qidirish..." : "Поиск...",
    type: uz ? "Turi" : "Тип",
    severity: uz ? "Darajasi" : "Уровень",
    status: uz ? "Holati" : "Статус",
    all: uz ? "Barchasi" : "Все",
    pending: uz ? "Kutilmoqda" : "Ожидает",
    acknowledged: uz ? "Tasdiqlangan" : "Подтверждено",
    resolved: uz ? "Hal qilingan" : "Решено",
    message: uz ? "Xabar" : "Сообщение",
    time: uz ? "Vaqt" : "Время",
    actions: uz ? "Amallar" : "Действия",
    acknowledge: uz ? "Tasdiqlash" : "Подтвердить",
    resolve: uz ? "Hal qilish" : "Решить",
    noAlerts: uz ? "Ogohlantirishlar topilmadi" : "Уведомления не найдены",
    total: uz ? "Jami" : "Всего",
    unresolved: uz ? "Hal qilinmagan" : "Нерешенные",
    critical: uz ? "Kritik" : "Критические",
  };
}

export function filterAlerts(
  alerts: CameraAlert[],
  searchTerm: string,
  filterType: string,
  filterSeverity: string,
  filterStatus: string,
): CameraAlert[] {
  return (Array.isArray(alerts) ? alerts : []).filter((alert) => {
    const matchesSearch =
      alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || alert.alertType === filterType;
    const matchesSeverity = filterSeverity === "all" || alert.severity === filterSeverity;
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "pending" && !alert.isAcknowledged) ||
      (filterStatus === "acknowledged" && alert.isAcknowledged && !alert.isResolved) ||
      (filterStatus === "resolved" && alert.isResolved);
    return matchesSearch && matchesType && matchesSeverity && matchesStatus;
  });
}
