
import { tLabel } from '@/lib/i18n/tLabel';
/**
 * @module MESHomeDashboardTypes
 * @description Shared types and pure helpers for MESHomeDashboard.
 */

export interface DashStats {
  activeSessions: number;
  completedToday: number;
  onlineDevices: number;
  averageOee: number;
}

export interface Session {
  id: string;
  sessionNumber: string;
  productionOrderId: string;
  equipmentId: string;
  equipmentName?: string;
  workerId: string;
  status: string;
  targetQuantity: number;
  actualQuantity: number;
  defectQuantity: number;
  runningTimeSeconds: number;
  stoppedTimeSeconds: number;
  oee?: number;
  orderNumber?: string;
  startedAt?: string;
}

export interface Downtime {
  id: string;
  sessionId: string;
  eventType: string;
  startedAt: string;
  endedAt?: string;
  durationSeconds?: number;
  reasonCode: string;
  reasonDescription?: string;
  isPlanned: boolean;
}

export interface ProductionOrder {
  id: string;
  orderNumber: string;
  status: string;
  productName?: string;
  plannedQuantity: number;
  confirmedQuantity: number;
}

// ─── Color helpers ─────────────────────────────────────────────────────────────

export function oeeColor(v: number) {
  if (v >= 0.85) return "text-[var(--ep-green)]";
  if (v >= 0.70) return "text-[var(--ep-yellow)]";
  return "text-[var(--ep-red)]";
}

export function oeeBar(v: number) {
  if (v >= 0.85) return "bg-emerald-500";
  if (v >= 0.70) return "bg-amber-500";
  return "bg-red-500";
}

export function statusInfo(s: string) {
  const map: Record<string, { label: string; color: string; dot: string }> = {
    running:   { label: tLabel('common.MESHomeDashboard.ishlamoqda', "Ishlamoqda"),   color: "text-[var(--ep-green)]",        dot: "bg-emerald-500" },
    active:    { label: "Aktiv",        color: "text-[var(--ep-green)]",        dot: "bg-emerald-500" },
    paused:    { label: tLabel('common.MESHomeDashboard.toxtatildi', "To'xtatildi"),  color: "text-[var(--ep-yellow)]",          dot: "bg-amber-500" },
    stopped:   { label: tLabel('common.MESHomeDashboard.toxtadi', "To'xtadi"),     color: "text-[var(--ep-red)]",            dot: "bg-red-500" },
    pending:   { label: tLabel('common.MESHomeDashboard.kutilmoqda', "Kutilmoqda"),   color: "text-muted-foreground",   dot: "bg-muted-foreground" },
    completed: { label: "Tugadi",       color: "text-[var(--ep-blue)]",           dot: "bg-blue-500" },
  };
  return map[s] ?? { label: s, color: "text-muted-foreground", dot: "bg-muted-foreground" };
}

export function fmt(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h}s ${m}d` : `${m} daqiqa`;
}
