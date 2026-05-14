/**
 * @module PerformanceTabTypes
 * @description Interfaces, types, and constants for PerformanceTab.
 */

import type { TranslationFn } from "./profile-types";
import type {
  AbcAnalysis,
  CourseProgressRecord,
  PerformanceMetric,
  AttendanceStats,
  MesSummary,
  WmsSummary,
} from "./profile-types";

// Re-export for convenience
export type {
  AbcAnalysis,
  CourseProgressRecord,
  PerformanceMetric,
  AttendanceStats,
  MesSummary,
  WmsSummary,
  TranslationFn,
};

export interface PerformanceTabProps {
  t: TranslationFn;
  tCommon: TranslationFn;
  loadingAbc: boolean;
  loadingProgress: boolean;
  abcData: AbcAnalysis | undefined;
  courseProgress: CourseProgressRecord[] | undefined;
  metrics: PerformanceMetric[] | undefined;
  attendanceStats: AttendanceStats;
  getGradeColor: (grade: string) => string;
  mesSummary?: MesSummary | null;
  loadingMes?: boolean;
  wmsSummary?: WmsSummary | null;
  loadingWms?: boolean;
}

export const REASON_LABELS: Record<string, string> = {
  breakdown: "Nosozlik",
  maintenance: "Texnik xizmat",
  material_shortage: "Material yetishmaydi",
  operator_absence: "Operator yo'q",
  quality_issue: "Sifat muammosi",
  changeover: "Mahsulot o'zgartirish",
  lunch: "Tushlik tanaffus",
  unknown: "Noma'lum sabab",
  planned: "Rejalashtirilgan to'xtash",
};
