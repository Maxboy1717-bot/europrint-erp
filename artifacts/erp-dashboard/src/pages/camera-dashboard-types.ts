/**
 * @module camera-dashboard-types
 * @description Shared interfaces, type aliases, and display constants for the
 * Camera AI Monitoring dashboard.  No JSX — safe to import from both .ts and
 * .tsx files.
 */

import {
  Shield,
  CheckCircle,
  Activity,
  Factory,
  Settings,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Domain interfaces
// ---------------------------------------------------------------------------

export interface DashboardStats {
  date: string;
  totalCameras: number;
  activeCameras: number;
  totalEvents: number;
  safetyViolationsCount: number;
  qualityDefectsCount: number;
  unresolvedAlerts: number;
  avgProductivityScore: number;
  runningMachines: number;
  stoppedMachines: number;
  idleMachines: number;
}

export interface CameraEvent {
  id: string;
  cameraId: string;
  eventType: string;
  severity: string;
  eventDate: string;
  eventTime: string;
  description: string;
  status: string;
  createdAt: string;
}

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
  createdAt: string;
}

export interface CameraInfo {
  id: string;
  code: string;
  name: string;
  nameRu: string;
  location: string;
  isActive: boolean;
}

// ---------------------------------------------------------------------------
// Display constants
// ---------------------------------------------------------------------------

/** Tailwind badge colour classes keyed by severity level. */
export const severityColors: Record<string, string> = {
  low: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

/** Lucide icon components keyed by alert type. */
export const alertTypeIcons: Record<string, typeof Shield> = {
  safety: Shield,
  quality: CheckCircle,
  productivity: Activity,
  machine: Factory,
  system: Settings,
};

/** Bilingual (uz/ru) labels for camera event types. */
export const eventTypeLabels: Record<string, { uz: string; ru: string }> = {
  telefon_ishlatish: { uz: "Telefon ishlatish", ru: "Использование телефона" },
  uyqu:              { uz: "Uxlash",            ru: "Сон" },
  loqaydlik:        { uz: "Loqaydlik",          ru: "Безразличие" },
  himoya_kiyimi_yoq: { uz: "Himoya kiyimi yo'q", ru: "Нет защитной одежды" },
  bosh_turish:      { uz: "Bo'sh turish",        ru: "Простой" },
  unknown_face:     { uz: "Noma'lum shaxs",      ru: "Неизвестное лицо" },
  near_miss:        { uz: "Xavfli holat",        ru: "Опасная ситуация" },
  safety_violation: { uz: "Xavfsizlik buzilishi", ru: "Нарушение безопасности" },
  quality_issue:    { uz: "Sifat muammosi",      ru: "Проблема качества" },
  downtime:         { uz: "To'xtab qolish",      ru: "Простой" },
};
