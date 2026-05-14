/**
 * @module CandidateReportDialogTypes
 * @description Interfaces, types, and constants for CandidateReportDialog.
 */

// ─── Domain interfaces ────────────────────────────────────────────────────────

export interface ReportData {
  entry_id: number;
  funnel_stage: string;
  candidate_id: number;
  candidate_name: string;
  candidate_phone: string;
  candidate_email?: string | null;
  candidate_source?: string | null;
  vacancy_id?: number | null;
  vacancy_title?: string | null;
  vacancy_type?: string | null;
  recruiter_name?: string | null;
  created_at: string;
  tool_test_score?: number | null;
  tool_test_results?: Record<string, number> | null;
  tool_test_requirements?: { traits?: Record<string, number>; iq_min?: number } | null;
  productivity_score?: number | null;
  motivation_score?: number | null;
  competency_score?: number | null;
  avg_score?: number | null;
  motivation_level?: number | null;
  flow_direction?: string | null;
  tool_test_passed?: Record<string, boolean> | null;
  final_decision?: string | null;
  final_notes_text?: string | null;
  motivation_answers?: Record<string, string> | null;
  competency_answers?: Record<string, string> | null;
  checklist_data?: Record<string, { done: boolean; done_at?: string | null; note?: string }> | null;
  recommendation?: string | null;
  screening_score?: number | null;
  ai_session?: {
    status: string;
    overall_score?: number | null;
    communication_score?: number | null;
    confidence_score?: number | null;
    problem_solving_score?: number | null;
    ai_summary?: string | null;
    recommendation?: string | null;
  } | null;
}

export interface CandidateReportDialogProps {
  pipelineEntryId: number;
  candidateName: string;
  open: boolean;
  onClose: () => void;
}

// ─── Tool Test trait labels (A–J) ─────────────────────────────────────────────

export const TOOL_TRAIT_LABELS: Record<string, string> = {
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

export const MOTIVATION_LABELS: Record<number, { label: string; icon: string; color: string }> = {
  4: { label: "Burch", icon: "🏛", color: "text-[var(--ep-blue)]" },
  3: { label: "E'tiqod", icon: "💎", color: "text-[var(--ep-blue)]" },
  2: { label: "Manfaat", icon: "📈", color: "text-[var(--ep-yellow)]" },
  1: { label: "Pul", icon: "💰", color: "text-[var(--ep-primary)]" },
};

export const DECISION_INFO: Record<string, { label: string; color: string; bg: string; border: string }> = {
  qabul:      { label: "QABUL TAVSIYA ETILADI",    color: "text-[var(--ep-green)]", bg: "bg-green-50", border: "border-green-500" },
  kutish:     { label: "KUTISH / QABUL KUTING",    color: "text-[var(--ep-yellow)]", bg: "bg-amber-50", border: "border-amber-500" },
  rad:        { label: "RAD ETISH TAVSIYA ETILADI", color: "text-[var(--ep-red)]",   bg: "bg-red-50",   border: "border-red-500" },
  hech_qachon:{ label: "HECH QACHON QABUL ETMANG", color: "text-red-900",   bg: "bg-red-100",  border: "border-red-700" },
};

export const MOTIVATION_ANSWER_LABELS: Record<string, string> = {
  q1_work_meaning: "Bu ish sizga nima anglatadi?",
  q2_ideal_env:    "Ideal ish muhiti?",
  q3_achievement:  "Eng yaxshi natijangiz?",
  q4_future_goal:  "Kelajak maqsadingiz?",
};
