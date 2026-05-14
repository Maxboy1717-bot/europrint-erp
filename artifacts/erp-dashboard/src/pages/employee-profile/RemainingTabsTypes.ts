/**
 * @module RemainingTabsTypes
 * @description Shared TypeScript interfaces, prop types, and display-label constants
 * used across the RemainingTabs family of components (Discipline, Learning, Safety,
 * Documents tabs on the Employee Profile page).  No JSX — pure TS.
 */

import type {
  DisciplineRecord, Certificate, CourseProgressRecord, SafetyViolation,
  DisciplineStats, SkillGapData, MentorshipData,
  CustomerComplaint, AssessmentSkipRecord, TranslationFn,
} from "./profile-types";

// ---------------------------------------------------------------------------
// Display-label lookup tables
// ---------------------------------------------------------------------------

export const COMPLAINT_TYPE_LABELS: Record<string, string> = {
  quality:  "Sifat muammosi",
  delivery: "Yetkazib berish kechikdi",
  behavior: "Xizmat ko'rsatish",
  damage:   "Mahsulot zarari",
  billing:  "To'lov muammosi",
  other:    "Boshqa",
};

export const SEVERITY_LABELS: Record<string, { label: string; className: string }> = {
  low:    { label: "Past",   className: "border-yellow-300 text-[var(--ep-yellow)]" },
  medium: { label: "O'rta",  className: "border-orange-300 text-[var(--ep-primary)]" },
  high:   { label: "Yuqori", className: "border-red-300 text-[var(--ep-red)]" },
};

export const STATUS_LABELS: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  open:     { label: "Ochiq",       variant: "destructive" },
  resolved: { label: "Hal qilindi", variant: "secondary" },
  rejected: { label: "Rad etildi",  variant: "outline" },
};

// ---------------------------------------------------------------------------
// Component prop interfaces
// ---------------------------------------------------------------------------

export interface DisciplineTabProps {
  tCommon: TranslationFn;
  loadingDiscipline: boolean;
  disciplineData: DisciplineRecord[] | undefined;
  disciplineStats: DisciplineStats;
  customerComplaints?: CustomerComplaint[];
  loadingComplaints?: boolean;
  assessmentSkips?: AssessmentSkipRecord[];
  loadingSkips?: boolean;
}

export interface LearningTabProps {
  tCommon: TranslationFn;
  loadingCertificates: boolean;
  loadingProgress: boolean;
  certificatesData: Certificate[] | undefined;
  courseProgress: CourseProgressRecord[] | undefined;
  skillGapData?: SkillGapData | null;
  loadingSkillGap?: boolean;
  mentorshipData?: MentorshipData | null;
  loadingMentorship?: boolean;
}

export interface SafetyTabProps {
  loadingSafety: boolean;
  safetyViolations: SafetyViolation[] | undefined;
}
