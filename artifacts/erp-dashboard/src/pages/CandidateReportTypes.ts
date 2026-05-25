
import { tLabel } from '@/lib/i18n/tLabel';
/**
 * @module CandidateReportTypes
 * @description Types and constants for CandidateReport.
 */

export interface CandidateDetail {
  id: number;
  fullName: string;
  phone: string;
  email?: string | null;
  source?: string | null;
  notes?: string | null;
  status?: string | null;
  createdAt?: string;
}

export interface FunnelEntry {
  id: number;
  funnel_stage: string;
  vacancy_title?: string | null;
  vacancy_type?: string | null;
  recruiter_name?: string | null;
  candidate_source?: string | null;
  tool_test_score?: number | null;
  tool_test_results?: Record<string, number> | null;
  recommendation?: string | null;
  screening_score?: number | null;
  created_at?: string;
}

export interface ToolTestRecord {
  id: number;
  testDate: string;
  totalScore: number;
  categoryResult: string;
  pointA: number; pointB: number; pointC: number; pointD: number; pointE: number;
  pointF: number; pointG: number; pointH: number; pointI: number; pointJ: number;
  iqScore?: number | null;
  positionMatchScore?: number | null;
  positionMatchNotes?: string | null;
  isValid: boolean;
}

export interface ProductivityInterview {
  id: number;
  conductedAt: string;
  overallScore: number;
  hasConcreteResults?: boolean;
  canWorkIndependently?: boolean;
  productivityInterview?: Record<string, unknown>;
}

export const STAGE_LABELS: Record<string, string> = {
  NEW: "Yangi ariza",
  QUESTIONNAIRE_SENT: "Anketa yuborildi",
  PHONE_SCREENING: "Telefon suhbati",
  TEST_SENT: "Test yuborildi",
  INTERVIEW_SCHEDULED: "Suhbat rejalashtirildi",
  INTERVIEWED: "Suhbat o'tkazildi",
  OFFER_SENT: "Taklif yuborildi",
  HIRED: "Qabul qilindi",
  REJECTED: "Rad etildi",
};

export const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  FLAGMAN:    { label: "Flagman",        color: "text-green-400" },
  PROCESSNIK: { label: "Processnik",     color: "text-blue-400" },
  UNPRODUCTIVE: { label: tLabel('common.CandidateReport.samarasiz', "Samarasiz"),    color: "text-red-400" },
  UNKNOWN:    { label: "Aniqlanmagan",   color: "text-muted-foreground" },
};

export const TOOL_TEST_TRAIT_LABELS: Record<string, string> = {
  A: "Diqqat",
  B: "Strategiya",
  C: "Nazorat",
  D: "Ishonch",
  E: "Energiya",
  F: "Qat'iyat",
  G: "Himoya",
  H: "Taktika",
  I: "Empatiya",
  J: "Muloqot",
};
