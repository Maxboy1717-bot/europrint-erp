/**
 * @module EmployeeDetailDialog.types
 * @description Interfaces, constants and icon mapping for EmployeeDetailDialog.
 * Split from EmployeeDetailDialog.tsx (Rule 16).
 */

import { Phone, BedDouble, UserX, HardHat, Coffee } from "lucide-react";

// ── Event/Alert interfaces ────────────────────────────────────────────────────

export interface CameraEvent {
  id: string | number;
  eventType: string;
  description: string;
  severity: string;
  eventDate: string;
  eventTime: string;
}

export interface CameraViolation {
  id: string | number;
  eventType: string;
  description: string;
  severity: string;
  eventDate: string;
  eventTime: string;
}

export interface CameraAlert {
  id: string | number;
  eventType: string;
  description: string;
  severity: string;
  eventDate: string;
  eventTime: string;
  screenshotUrl?: string;
  aiConfidence?: number;
}

// ── Employee data interfaces ──────────────────────────────────────────────────

export interface EmployeeInfo {
  avatarUrl?: string;
  fullName: string;
  employeeId?: string;
  department?: string;
  position?: string;
}

export interface EmployeeSummary {
  totalEvents?: number;
  violations?: number;
  safetyAlerts?: number;
  criticalEvents?: number;
}

export interface DailyActivityItem {
  date: string;
  events: number;
  violations: number;
}

export interface EmployeeDetailData {
  employee: EmployeeInfo;
  summary: EmployeeSummary;
  violationsByType: Record<string, number>;
  dailyActivity: DailyActivityItem[];
  recentEvents: CameraEvent[];
  violations: CameraViolation[];
  safetyAlerts: CameraAlert[];
}

export interface EmployeeDetailDialogProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ── Display constants ─────────────────────────────────────────────────────────

export const VIOLATION_LABELS: Record<string, string> = {
  telefon_ishlatish:  "Telefon ishlatish",
  uyqu:               "Uyqu",
  loqaydlik:          "Loqaydlik",
  himoya_kiyimi_yoq:  "Himoya kiyimi yo'q",
  bosh_turish:        "Bosh turish",
  unknown_face:       "Notanish yuz",
  near_miss:          "Near-miss",
  yiqilish:           "Yiqilish",
  toqnashish:         "To'qnashuv",
  kamera_yopilishi:   "Kamera yopilishi",
};

export const VIOLATION_ICONS: Record<string, React.ElementType> = {
  telefon_ishlatish: Phone,
  uyqu:              BedDouble,
  loqaydlik:         UserX,
  himoya_kiyimi_yoq: HardHat,
  bosh_turish:       Coffee,
};
