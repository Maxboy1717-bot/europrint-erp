/**
 * @module ShiftScheduleTypes
 * @description Interfaces, types, and constants for ShiftSchedule.
 */

import React from "react";
import { Sun, Sunrise, Moon } from "lucide-react";

export type ShiftType = "MORNING" | "EVENING" | "NIGHT";

export interface Employee {
  id: string;
  fullName: string;
  departmentId?: string;
  departmentName?: string;
  status?: string;
  shift?: string;
}

export interface Department {
  id: string;
  name: string;
}

export interface ShiftScheduleEntry {
  id: number;
  user_id: string;
  shift_date: string;
  shift_type: ShiftType;
  start_time: string;
  end_time: string;
  status: string;
  full_name?: string;
  department_id?: string;
  department_name?: string;
}

export interface ShiftSwapRequest {
  id: number;
  from_employee_id: string;
  to_employee_id?: string;
  shift_date: string;
  reason?: string;
  status: "pending" | "approved" | "rejected";
  from_employee_name?: string;
  to_employee_name?: string;
  approved_by_name?: string;
  created_at: string;
}

export const SHIFT_ICONS: Record<ShiftType, React.ReactElement> = {
  MORNING: React.createElement(Sun, { className: "h-3 w-3" }),
  EVENING: React.createElement(Sunrise, { className: "h-3 w-3" }),
  NIGHT: React.createElement(Moon, { className: "h-3 w-3" }),
};

export const SHIFT_COLORS: Record<ShiftType, string> = {
  MORNING: "bg-yellow-100 text-yellow-800 border-yellow-300",
  EVENING: "bg-orange-100 text-orange-800 border-orange-300",
  NIGHT: "bg-indigo-100 text-indigo-800 border-indigo-300",
};

export const SHIFT_TIMES: Record<ShiftType, string> = {
  MORNING: "08:00–17:00",
  EVENING: "17:00–02:00",
  NIGHT: "02:00–08:00",
};

export const SHIFT_LABELS: Record<ShiftType, string> = {
  MORNING: "Ertalab",
  EVENING: "Kechki",
  NIGHT: "Tungi",
};

export const PAGE_SIZE = 50;

export const DAY_NAMES = ["Dush", "Sesh", "Chor", "Pay", "Juma", "Shan", "Yak"];

export function getWeekDates(baseDate: Date): Date[] {
  const dates: Date[] = [];
  const start = new Date(baseDate);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1);
  start.setDate(diff);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d);
  }
  return dates;
}

export function fmt(date: Date): string {
  return date.toISOString().slice(0, 10);
}
