/**
 * @module CapacityPlanningTypes
 * @description Zod schemas, inferred types, and domain interfaces for the
 * Capacity Planning feature. No JSX — safe to import from non-React files.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

export const capacityFormSchema = z.object({
  workCenterId: z.string().min(1, "Work center tanlash majburiy"),
  date: z.string().min(1, "Sana kiritish majburiy"),
  availableHours: z.number().min(0.1, "Available hours 0 dan katta bo'lishi kerak"),
  efficiency: z.number().min(0).max(100, "Efficiency 0-100 orasida bo'lishi kerak"),
  utilizationTarget: z.number().min(0).max(100, "Utilization target 0-100 orasida bo'lishi kerak"),
});

export const calendarFormSchema = z.object({
  workCenterId: z.string().min(1, "Work center tanlash majburiy"),
  shiftName: z.string().min(1, "Shift nomi kiritish majburiy"),
  startTime: z.string().min(1, "Boshlanish vaqti kiritish majburiy"),
  endTime: z.string().min(1, "Tugash vaqti kiritish majburiy"),
  workingDays: z
    .array(z.string())
    .default(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]),
});

// ---------------------------------------------------------------------------
// Inferred form value types
// ---------------------------------------------------------------------------

export type CapacityFormValues = z.infer<typeof capacityFormSchema>;
export type CalendarFormValues = z.infer<typeof calendarFormSchema>;

// ---------------------------------------------------------------------------
// Domain interfaces (mirrors API shapes)
// ---------------------------------------------------------------------------

export interface WorkCenter {
  id: string;
  code: string;
  name: string;
}

export interface Capacity {
  id: string;
  workCenterId: string;
  date: string;
  availableHours: number;
  efficiency: number;
  utilizationTarget: number;
}

export interface ShiftCalendar {
  id: string;
  workCenterId: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  workingDays: string[];
}

export interface WorkCenterLoad {
  workCenterName: string;
  workCenterCode?: string;
  availableHours: number;
  loadedHours: number;
  loadPercentage: number;
  isBottleneck: boolean;
  status: string;
}

export interface LoadAnalysis {
  workCenters: WorkCenterLoad[];
}

export interface CapacityListItem {
  capacity: Capacity;
  workCenter: WorkCenter;
}

// ---------------------------------------------------------------------------
// Recharts-ready chart row
// ---------------------------------------------------------------------------

export interface ChartRow {
  name: string;
  available: number;
  loaded: number;
  utilization: number;
}
