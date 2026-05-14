/** @module MESExtendedTypes @description Interfaces, types, constants, and Zod schemas for the MES Extended page. No JSX. */

import { z } from "zod";
import { type LucideIcon, Activity, AlertTriangle, Wrench, Trophy, Settings, Clock, ClipboardList } from "lucide-react";

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
  reasons:      { title: "To'xtash Sabablar",             icon: AlertTriangle },
  zones:        { title: "Ishlab Chiqarish Vazifalari",   icon: ClipboardList },
  maintenance:  { title: "Texnik Xizmat",                 icon: Wrench },
  gamification: { title: "Gamifikatsiya",                 icon: Trophy },
  norms:        { title: "Uskuna Normalari",              icon: Settings },
  smena:        { title: "Smena O'tkazish",               icon: Clock },
};

export const MES_PILLS = [
  { key: "oee",          label: "OEE Monitor" },
  { key: "reasons",      label: "To'xtash Sabablar" },
  { key: "zones",        label: "Vazifalari" },
  { key: "maintenance",  label: "Texnik Xizmat" },
  { key: "gamification", label: "Gamifikatsiya" },
  { key: "norms",        label: "Normalari" },
  { key: "smena",        label: "Smena O'tkazish" },
] as const;

/** Static norms data shown on the Norms tab (no API yet). */
export const MACHINE_NORMS = [
  { m: "Heidelberg CD102", speed: "13,000/h", setup: "45 min", brak: "1.5%", oee: "85%" },
  { m: "KBA Rapida 106",   speed: "16,000/h", setup: "40 min", brak: "1.2%", oee: "88%" },
  { m: "Folding Machine",  speed: "8,000/h",  setup: "30 min", brak: "2.0%", oee: "80%" },
  { m: "Die Cutting",      speed: "12,000/h", setup: "35 min", brak: "1.0%", oee: "90%" },
  { m: "UV Lak",           speed: "6,000/h",  setup: "50 min", brak: "0.8%", oee: "85%" },
] as const;

// ─── Zod schemas ─────────────────────────────────────────────────────────────

export const MaintSchema = z.object({
  machineId: z.string().min(1),
  issue:     z.string().min(1),
  priority:  z.string().min(1),
});

export type MaintFormValues = z.infer<typeof MaintSchema>;
