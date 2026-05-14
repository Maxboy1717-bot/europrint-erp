/**
 * @module DirectorExtendedTypes
 * @description Interfaces, types, and constants for DirectorExtended.
 */

import type { LucideIcon } from "lucide-react";

export interface DirectorDashboard {
  orders?: { month?: number; completed?: number; overdue?: number; inProduction?: number };
  production?: { oee?: number };
  hr?: { attendanceRate?: number; present?: number; total?: number };
  alerts?: { iot?: number; minStock?: number };
  [key: string]: unknown;
}

export interface AiStats {
  oee?: number;
  totalOrders?: number;
  overdueOrders?: number;
  attendance?: { rate?: number };
}

export interface AiSummaryData {
  summary?: string;
  stats?: AiStats;
}

export interface OeeToday {
  avg?: number;
  min?: number;
  max?: number;
  snapshots?: unknown[];
}

export interface ProdData {
  orderBreakdown?: Record<string, number>;
  oeeToday?: OeeToday;
  overdueOrders?: ProductionOrder[];
  sessionsToday?: ProductionSession[];
}

export interface AttendanceData {
  present?: number;
  attendanceRate?: number;
  absent?: number;
  late?: number;
}

export interface HrData {
  employees?: { total?: number };
  attendance?: AttendanceData;
  byDepartment?: HRDepartment[];
}

export interface KpiData {
  oeeByEquipment?: KPIEquipment[];
}

export interface FinData {
  totalReceivable?: number;
  overdueAmount?: number;
  pendingAmount?: number;
  invoices?: Record<string, { count?: number; amount?: number }>;
}

export interface DirectorAlert {
  id?: number | string;
  title?: string;
  severity?: string;
  module?: string;
  message?: string;
  createdAt?: string;
}

export interface ProductionOrder {
  id: number | string;
  papkaNo?: string;
  status?: string;
  deadline?: string;
  tayyorBolishSanasi?: string;
}

export interface ProductionSession {
  id?: number | string;
  operatorName?: string;
  machineName?: string;
  startTime?: string;
  equipmentId?: number | string;
  status?: string;
  targetQty?: number;
  producedQty?: number;
  defectQty?: number;
  oee?: number;
}

export interface HRDepartment {
  department?: string;
  present?: number;
  total?: number;
  count?: number;
}

export interface KPIEquipment {
  equipmentName?: string;
  equipmentId?: number | string;
  oee?: number | string;
  avgOee?: number;
  avgAvailability?: number;
  avgPerformance?: number;
  avgQuality?: number;
}

export interface KpiListItem {
  name: string;
  value: string;
  target: string;
  pct: number;
  trend: "up" | "down";
}

export const URL_TAB_MAP: Record<string, string> = {
  "/director/ai-summary": "summary",
  "/director/problem-points": "problems",
  "/director/production": "production",
  "/director/hr-stats": "hr",
  "/director/finance": "finance",
  "/director/kpis": "kpis",
};

export const tabMeta: Record<string, { title: string; icon: LucideIcon }> = {} as Record<
  string,
  { title: string; icon: LucideIcon }
>;

export const escHtml = (v: unknown): string =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
