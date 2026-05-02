import type { User, AbcAnalysis } from "@shared/schema";

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
  { key: "alerts", label: "Alertlar" },
  { key: "risk", label: "AI Xavf" },
  { key: "turnover", label: "Kadrlar" },
  { key: "discipline", label: "Intizom" },
  { key: "safety", label: "Xavfsizlik" },
  { key: "v2", label: "HR V2 Tizim" },
];

export const SEVERITY_CONFIG = {
  critical: { color: "text-red-600", bg: "bg-red-50", border: "border-red-200", label: "Kritik" },
  warning: { color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", label: "Ogohlantirish" },
  info: { color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", label: "Ma'lumot" },
};

export const RISK_CONFIG = {
  critical: { color: "text-red-600", bg: "bg-red-100", label: "Kritik", barColor: "#ef4444" },
  high: { color: "text-orange-600", bg: "bg-orange-100", label: "Yuqori", barColor: "#f97316" },
  medium: { color: "text-amber-600", bg: "bg-amber-100", label: "O'rta", barColor: "#f59e0b" },
  low: { color: "text-green-600", bg: "bg-green-100", label: "Past", barColor: "#22c55e" },
};

export function getGradeBadge(grade: string | null) {
  if (!grade) return null;
  const map: Record<string, string> = {
    A: "bg-green-100 text-green-800",
    B: "bg-primary-container text-on-primary-container",
    C: "bg-amber-100 text-amber-800",
  };
  return map[grade] || "bg-surface-container text-on-surface-variant";
}
