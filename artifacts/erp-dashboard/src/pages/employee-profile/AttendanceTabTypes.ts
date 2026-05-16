/**
 * @module AttendanceTabTypes
 * @description Interfaces, types, and constants for AttendanceTab.
 */

export type DayStatus = "present" | "late" | "absent" | "sick" | "leave" | "weekend" | "none";

export interface CalendarDay {
  date: number;
  status: DayStatus;
  checkIn?: string;
  checkOut?: string;
  minutesLate?: number;
}

export const SHIFT_STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: tLabel('common.AttendanceTab.kutilmoqda', "Kutilmoqda"), color: "bg-yellow-500" },
  approved: { label: tLabel('common.AttendanceTab.tasdiqlangan', "Tasdiqlangan"), color: "bg-green-500" },
  rejected: { label: "Rad etilgan", color: "bg-red-500" },
  cancelled: { label: tLabel('common.AttendanceTab.bekorQilingan', "Bekor qilingan"), color: "bg-muted-foreground" },
};

export const DAY_COLORS: Record<DayStatus, { bg: string; text: string; label: string }> = {
  present: { bg: "bg-green-500/20 border-green-500/40", text: "text-[var(--ep-green)] dark:text-green-300", label: "Keldi" },
  late: { bg: "bg-yellow-500/20 border-yellow-500/40", text: "text-[var(--ep-yellow)] dark:text-yellow-300", label: "Kechikdi" },
  absent: { bg: "bg-red-500/20 border-red-500/40", text: "text-[var(--ep-red)] dark:text-red-300", label: "Kelmadi" },
  sick: { bg: "bg-blue-500/20 border-blue-500/40", text: "text-[var(--ep-blue)] dark:text-blue-300", label: "Kasal" },
  leave: { bg: "bg-purple-500/20 border-purple-500/40", text: "text-[var(--ep-purple)] dark:text-purple-300", label: "Ta'til" },
  weekend: { bg: "bg-muted/30 border-border/20", text: "text-muted-foreground", label: "Dam olish" },
  none: { bg: "bg-muted/10 border-border/10", text: "text-muted-foreground/40", label: "" },
};

export const MONTH_NAMES = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr",
];

export const DAY_LABELS = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];

import type { AttendanceRecord } from "./profile-types";

import { tLabel } from '@/lib/i18n/tLabel';
export function getEarlyDepartures(attendanceData: AttendanceRecord[] | undefined): AttendanceRecord[] {
  if (!attendanceData) return [];
  return (Array.isArray(attendanceData) ? attendanceData : []).filter(r => {
    if (!r.checkOut || r.status !== "present") return false;
    const checkOutTime = r.checkOut.substring(0, 5);
    return checkOutTime < "17:00";
  });
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export function buildCalendarData(year: number, month: number, attendanceData: AttendanceRecord[] | undefined): CalendarDay[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  const recordMap = new Map<number, AttendanceRecord>();
  (attendanceData || []).forEach(r => {
    if (!r.date) return;
    const d = new Date(r.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      recordMap.set(d.getDate(), r);
    }
  });

  const days: CalendarDay[] = [];
  for (let i = 0; i < startOffset; i++) {
    days.push({ date: 0, status: "none" });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dayOfWeek = new Date(year, month, d).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const rec = recordMap.get(d);
    let status: DayStatus = "none";
    if (rec) {
      if (rec.status === "absent") status = "absent";
      else if (rec.status === "sick") status = "sick";
      else if (rec.status === "leave") status = "leave";
      else if (rec.isLate) status = "late";
      else status = "present";
    } else if (isWeekend) {
      status = "weekend";
    }
    days.push({ date: d, status, checkIn: rec?.checkIn, checkOut: rec?.checkOut, minutesLate: rec?.minutesLate });
  }
  return days;
}
