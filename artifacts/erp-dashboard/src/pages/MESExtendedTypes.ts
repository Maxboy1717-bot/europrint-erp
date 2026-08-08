/** @module MESExtendedTypes @description Interfaces, types, constants, and Zod schemas for the MES Extended page. No JSX. */

import { z } from "zod";
import { type LucideIcon, Activity, AlertTriangle, Wrench, Trophy, Settings, Clock, ClipboardList, AlertOctagon } from "lucide-react";

import { tLabel } from '@/lib/i18n/tLabel';
// ─── Domain interfaces ───────────────────────────────────────────────────────

export interface MESMachine {
  id: number | string;
  name?: string;
  machineName?: string;
  machineId?: number | string;
  status?: string;
  oee?: number | string;
  location?: string;
  availability?: number | string;
  avail?: number | string;
  performance?: number | string;
  perf?: number | string;
  quality?: number | string;
  qual?: number | string;
}

export interface MESShift {
  shiftName?: string;
  operatorName?: string;
  operatorId?: number;
  /** Raw snake_case field from the live mes_sessions row (no camelCase transform on the wire). */
  operator_id?: number;
  producedQty?: number | string;
  brakQty?: number | string;
  oee?: number | string;
  startTime?: string;
  machineStatus?: string;
  notes?: string;
}

export interface MESTask {
  id: number | string;
  title?: string;
  name?: string;
  taskName?: string;
  orderNumber?: string;
  status?: string;
  priority?: string;
  machineId?: number | string;
  machineName?: string;
  quantity?: number;
  plannedQuantity?: number;
  scheduledDate?: string;
  createdAt?: string;
  dueDate?: string;
}

export interface MaintenanceRequest {
  id: number | string;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  machineId?: number | string;
  equipmentId?: number | string;
  issue?: string;
  createdAt?: string;
  resolvedAt?: string;
}

export interface DowntimeReason {
  id?: number | string;
  reason?: string;
  name?: string;
  type?: string;
  duration?: number;
  avgDuration?: number;
  pct?: number;
  count?: number;
}

export interface MESLeaderboard {
  id?: number | string;
  name?: string;
  fullName?: string;
  username?: string;
  department?: string;
  score?: number | string;
  points?: number | string;
  tasks?: number | string;
  completedTasks?: number | string;
  efficiency?: number | string;
  quality?: number | string;
  qualityRate?: number | string;
}

export interface SosEvent {
  id: number;
  session_id: number | null;
  employee_id: number | null;
  reason: string;
  work_center_id: number | null;
  created_at: string;
  work_center_name?: string;
  employee_name?: string;
}

export const SosSchema = z.object({
  reason:         z.string().min(1, "Sabab kiritilishi shart").max(500),
  work_center_id: z.number().int().positive().optional(),
});
export type SosFormValues = z.infer<typeof SosSchema>;

// ─── Route → tab mapping ─────────────────────────────────────────────────────

export const URL_TAB_MAP: Record<string, string> = {
  "/mes/oee-monitor":        "oee",
  "/mes/reason-log":         "reasons",
  "/mes/zone-management":    "zones",
  "/mes/maintenance-request":"maintenance",
  "/mes/gamification":       "gamification",
  "/mes/machine-norms":      "norms",
  "/mes/smena-handover":     "smena",
};

export const tabMeta: Record<string, { title: string; icon: LucideIcon }> = {
  oee:          { title: "OEE Monitoring",                icon: Activity },
  reasons:      { title: tLabel('common.MESExtended.toxtashSabablar', "To'xtash Sabablar"),             icon: AlertTriangle },
  zones:        { title: tLabel('common.MESExtended.ishlabChiqarishVazifalari', "Ishlab Chiqarish Vazifalari"),   icon: ClipboardList },
  maintenance:  { title: "Texnik Xizmat",                 icon: Wrench },
  gamification: { title: "Gamifikatsiya",                 icon: Trophy },
  norms:        { title: "Uskuna Normalari",              icon: Settings },
  smena:        { title: tLabel('common.MESExtended.smenaOtkazish', "Smena O'tkazish"),               icon: Clock },
  sos:          { title: "SOS Signallar",                                                              icon: AlertOctagon },
};

export const MES_PILLS: Array<{ key: string; label: string }> = [
  { key: "oee",          label: "OEE Monitor" },
  { key: "reasons",      label: tLabel('common.MESExtended.toxtashSabablar', "To'xtash Sabablar") },
  { key: "zones",        label: "Vazifalari" },
  { key: "maintenance",  label: "Texnik Xizmat" },
  { key: "gamification", label: "Gamifikatsiya" },
  { key: "norms",        label: "Normalari" },
  { key: "smena",        label: tLabel('common.MESExtended.smenaOtkazish', "Smena O'tkazish") },
  { key: "sos",          label: "SOS" },
];

// ─── Zod schemas ─────────────────────────────────────────────────────────────

export const MaintSchema = z.object({
  title:          z.string().min(1),
  work_center_id: z.number().int().positive().optional(),
  priority:       z.string().min(1),
});

export type MaintFormValues = z.infer<typeof MaintSchema>;
