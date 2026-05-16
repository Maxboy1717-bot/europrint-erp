/**
 * @module types
 * @description React page component. Route-level UI.
 */

import type { User, AbcAnalysis } from "@shared/schema";

import { tLabel } from '@/lib/i18n/tLabel';
export type UserWithAnalysis = User & {
  abcAnalysis?: AbcAnalysis;
};

export type HRAlert = {
  id: string;
  type: string;
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  employeeId?: string;
  employeeName?: string;
  action?: string;
};

export type AlertsResponse = {
  alerts: HRAlert[];
  stats: { critical: number; warning: number; info: number; total: number };
};

export type RiskEmployee = {
  id: string;
  fullName: string;
  departmentName: string;
  positionName: string;
  overallScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  factors: Record<string, number>;
};

export type RiskScoresResponse = {
  scores: RiskEmployee[];
  stats: { low: number; medium: number; high: number; critical: number };
};

export type EmployeeWithGrade = {
  id: string;
  fullName: string;
  grade: string | null;
  score: number;
  performanceRate: number;
  attendanceRate: number;
  disciplineScore: number;
};

export const HR_TABS = [
  { key: "overview", label: "Umumiy" },
  { key: "performers", label: "Samaradorlik" },
  { key: "alerts", label: tLabel('hr..alertlar', "Alertlar") },
  { key: "risk", label: "AI Xavf" },
  { key: "turnover", label: tLabel('hr..kadrlar', "Kadrlar") },
  { key: "discipline", label: "Intizom" },
  { key: "safety", label: tLabel('hr..xavfsizlik', "Xavfsizlik") },
  { key: "v2", label: "HR V2 Tizim" },
];

export const SEVERITY_CONFIG = {
  critical: { color: "text-[var(--ep-red)]", bg: "bg-red-50", border: "border-red-200", label: "Kritik" },
  warning: { color: "text-[var(--ep-yellow)]", bg: "bg-amber-50", border: "border-amber-200", label: tLabel('hr..ogohlantirish', "Ogohlantirish") },
  info: { color: "text-[var(--ep-blue)]", bg: "bg-blue-50", border: "border-blue-200", label: "Ma'lumot" },
};

export const RISK_CONFIG = {
  critical: { color: "text-[var(--ep-red)]", bg: "bg-red-100", label: "Kritik", barColor: "#ef4444" },
  high: { color: "text-[var(--ep-primary)]", bg: "bg-orange-100", label: "Yuqori", barColor: "#f97316" },
  medium: { color: "text-[var(--ep-yellow)]", bg: "bg-amber-100", label: "O'rta", barColor: "#f59e0b" },
  low: { color: "text-[var(--ep-green)]", bg: "bg-green-100", label: "Past", barColor: "#22c55e" },
};

export function getGradeBadge(grade: string | null) {
  if (!grade) return null;
  const map: Record<string, string> = {
    A: "bg-green-100 text-green-800",
    B: "bg-primary/10 text-primary",
    C: "bg-amber-100 text-amber-800",
  };
  return map[grade] || "bg-muted/60 text-muted-foreground";
}
