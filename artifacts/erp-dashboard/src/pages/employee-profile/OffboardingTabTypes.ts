/**
 * @module OffboardingTabTypes
 * @description Types, interfaces and constants for OffboardingTab.
 */

// ── Domain interfaces ─────────────────────────────────────────────────────────
export interface OffboardingCase {
  id: number;
  employee_id: number;
  dismissal_type: string;
  last_working_day: string | null;
  status: string;
  exit_interview_done: boolean;
  exit_interview_notes: string | null;
  equipment_returned: boolean;
  settlement_done: boolean;
  nda_signed: boolean;
  blocks_settlement: boolean;
  completed_items: number;
  total_items: number;
  created_at: string;
  checklist: ChecklistItem[];
  exitInterview: ExitInterview | null;
}

export interface ChecklistItem {
  id: number;
  item_key: string;
  label: string;
  done: boolean;
  done_at: string | null;
  notes: string | null;
  return_status: string;
  order_num: number;
}

export interface ExitInterview {
  id: number;
  answers: Record<string, unknown> | null;
  blocks_settlement: boolean;
  created_at: string;
}

export interface Question {
  key: string;
  label: string;
  type: string;
  required: boolean;
}

// ── Look-up maps ──────────────────────────────────────────────────────────────
export const DISMISSAL_MAP: Record<string, string> = {
  resignation:  "O'z xohishi bilan",
  termination:  "Xizmat yaroqsizligi",
  contract_end: "Shartnoma tugashi",
  retirement:   "Pensiya",
  relocation:   "Ko'chib ketish",
  other:        "Boshqa sabab",
};

export const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active:    { label: "Faol",          variant: "secondary" },
  completed: { label: "Yakunlandi",    variant: "default" },
  cancelled: { label: "Bekor qilindi", variant: "destructive" },
};

export const RETURN_STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending:  { label: "Kutilmoqda",    color: "text-[var(--ep-primary)]" },
  returned: { label: "Qaytarildi",    color: "text-[var(--ep-green)]" },
  damaged:  { label: "Shikastlangan", color: "text-[var(--ep-yellow)]" },
  missing:  { label: "Yo'qolgan",     color: "text-[var(--ep-red)]" },
  "n/a":    { label: "Talab yo'q",    color: "text-muted-foreground" },
};
