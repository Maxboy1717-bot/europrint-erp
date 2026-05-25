
import { tLabel } from '@/lib/i18n/tLabel';
/**
 * @module ProductionOrder360Types
 * @description TypeScript interfaces, types, and constants for ProductionOrder360.
 * No JSX — pure type/value exports.
 */

export const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  created:     { label: "Yaratildi",    variant: "secondary" },
  released:    { label: "Chiqarildi",   variant: "default" },
  in_progress: { label: tLabel('production.ProductionOrder360.jarayonda', "Jarayonda"),   variant: "default" },
  completed:   { label: "Bajarildi",   variant: "default" },
  closed:      { label: "Yopildi",     variant: "secondary" },
  qc_hold:     { label: tLabel('production.ProductionOrder360.qcToxtatdi', "QC To'xtatdi"), variant: "destructive" },
};

export const TYPE_LABELS: Record<string, string> = {
  flexo: "Flexo bosma", offset: "Offset bosma", cutting: "Kesish",
  laminate: "Laminatsiya", digital: "Digital", other: "Boshqa",
};

export function fmt(n: number | null | undefined, d = 0) {
  if (n == null) return "—";
  return n.toLocaleString("uz-UZ", { maximumFractionDigits: d });
}

export function fmtMoney(n: number | null | undefined) {
  if (n == null) return "—";
  return n.toLocaleString("uz-UZ", { maximumFractionDigits: 0 }) + " so'm";
}

export interface Production360StatusHistoryEntry {
  id: string | number;
  oldStatus?: string;
  newStatus: string;
  changerName?: string;
  changedAt?: string;
  reason?: string;
}

export interface Production360Overview {
  status: string;
  orderNumber?: string;
  productionType?: string;
  productName?: string;
  notes?: string;
  priority?: number;
  responsibleManagerName?: string;
  shiftSupervisorName?: string;
  qcInspectorName?: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  statusHistory?: Production360StatusHistoryEntry[];
}

export interface Production360Kpi {
  completionRate: number;
  produced: number;
  planned: number;
  avgOee?: number | null;
  qcPassRate: number;
  defective?: number;
  scrapped?: number;
  costVariance: number;
  costVariancePct: number;
  leadTimeDays?: number | null;
  totalDowntimeMins?: number;
}

export interface Production360Response {
  overview: Production360Overview;
  kpi: Production360Kpi;
  shifts?: {
    sessions?: import("./ProductionOrder360Shifts").ShiftSession[];
    downtimes?: import("./ProductionOrder360Shifts").Downtime[];
    totalRunningHours?: number;
    totalStoppedHours?: number;
  };
  materials?: {
    totalPlannedCost?: number;
    totalActualCost?: number;
    components?: import("./ProductionOrder360Bom").MaterialComponent[];
  };
  quality?: {
    totalFailed?: number;
    totalChecked?: number;
    checks?: import("./ProductionOrder360Quality").QcCheck[];
  };
  equipment?: {
    list?: import("./ProductionOrder360Equipment").EquipItem[];
    sessions?: import("./ProductionOrder360Equipment").EquipSession[];
  };
  timeAnalysis?: {
    totalRunningSeconds?: number;
    totalStoppedSeconds?: number;
    plannedStartDate?: string;
    plannedEndDate?: string;
    actualStartDate?: string;
    actualEndDate?: string;
    downtimes?: import("./ProductionOrder360TimeAnalysis").Downtime[];
  };
  costAnalysis?: {
    plannedCost?: number;
    actualCost?: number;
    variance?: number;
    variancePct?: number;
    materialCost?: number;
    components?: import("./ProductionOrder360Cost").CostComponent[];
  };
}
