
import { tLabel } from '@/lib/i18n/tLabel';
/** @module EmployeeDailyKPIPanelTypes @description TypeScript interfaces, types, and pure helper utilities for EmployeeDailyKPIPanel. No JSX. */

export interface KpiRecord {
  id: string;
  userId: string;
  fullName: string;
  evaluationDate: string;
  departmentId: string | null;
  departmentName: string | null;
  attendanceScore: number | null;
  taskCompletionScore: number | null;
  qualityScore: number | null;
  productivityScore: number | null;
  teamworkScore: number | null;
  disciplineScore: number | null;
  overallScore: number | null;
  bonusPercent: number | null;
  penaltyPercent: number | null;
  netScore: number | null;
  evaluatorId: string | null;
  aiGenerated: boolean | null;
  aiConfidence: number | null;
  notes: string | null;
}

export interface TopPerformer {
  userId: string;
  fullName: string;
  departmentName: string | null;
  avgNetScore: number;
  avgOverall: number;
  recordCount: number;
}

export interface DepartmentSummary {
  departmentName: string;
  avgAttendance: number;
  avgTaskCompletion: number;
  avgQuality: number;
  avgProductivity: number;
  avgTeamwork: number;
  avgDiscipline: number;
  avgOverall: number;
}

export interface KpiApiResponse {
  count: number;
  records: KpiRecord[];
}

export interface TopPerformersApiResponse {
  topPerformers: TopPerformer[];
}

export interface EmployeesApiResponse {
  data: Array<{ id: string; fullName: string; departmentId: string | null }>;
}

export interface DeptSummaryApiResponse {
  departments: DepartmentSummary[];
}

export const RADAR_DIMENSIONS = [
  { key: "attendance", label: "Davomad" },
  { key: "tasks", label: tLabel('common.EmployeeDailyKPIPanel.vazifalar', "Vazifalar") },
  { key: "quality", label: "Sifat" },
  { key: "productivity", label: "Samaradorlik" },
  { key: "teamwork", label: "Jamoa ishi" },
  { key: "discipline", label: "Intizom" },
] as const;

export const DEFAULT_SCORES = {
  attendanceScore: 70,
  taskCompletionScore: 70,
  qualityScore: 70,
  productivityScore: 70,
  teamworkScore: 70,
  disciplineScore: 70,
  bonusPercent: 0,
  penaltyPercent: 0,
} as const;

export function getScoreColor(score: number): string {
  if (score > 80) return "text-[var(--ep-green)] dark:text-green-400";
  if (score >= 60) return "text-[var(--ep-yellow)] dark:text-amber-400";
  return "text-[var(--ep-red)] dark:text-red-400";
}

export function getScoreBg(score: number): string {
  if (score > 80) return "bg-green-500/10";
  if (score >= 60) return "bg-amber-500/10";
  return "bg-red-500/10";
}
