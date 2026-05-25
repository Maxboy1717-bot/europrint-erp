/**
 * @module HROffboardingTypes
 * @description Shared interfaces, type maps, and constants for the HR Offboarding
 * feature. Contains no JSX — safe to import from both .ts and .tsx files.
 */

import type { ReactNode } from "react";
import {
  MessageSquare,
  Handshake,
  Package,
  BadgeCheck,
  Key,
  ScrollText,
  ClipboardList,
  FileSignature,
} from "lucide-react";
import { createElement } from "react";

import { tLabel } from '@/lib/i18n/tLabel';
// ── Domain types ──────────────────────────────────────────────────────────────

export interface OffboardingCase {
  id: number;
  employee_id: number;
  full_name: string;
  position: string;
  department: string;
  dismissal_type: string;
  last_working_day: string | null;
  status: string;
  exit_interview_done: boolean;
  equipment_returned: boolean;
  settlement_done: boolean;
  nda_signed: boolean;
  blocks_settlement: boolean;
  completed_items: number;
  total_items: number;
  created_at: string;
}

export interface ChecklistItem {
  id: number;
  case_id: number;
  item_key: string;
  label: string;
  done: boolean;
  done_at: string | null;
  notes: string | null;
  order_num: number;
}

export interface Stats {
  active: number | string;
  completed: number | string;
  cancelled: number | string;
  total: number | string;
}

export interface Employee {
  id: number;
  full_name?: string;
  first_name?: string;
  last_name?: string;
}

// ── Lookup maps ───────────────────────────────────────────────────────────────

export const DISMISSAL_MAP: Record<string, string> = {
  resignation:  "O'z xohishi bilan",
  termination:  "Xizmat yaroqsizligi",
  contract_end: "Shartnoma tugashi",
  retirement:   "Pensiya",
  relocation:   "Ko'chib ketish",
  other:        "Boshqa sabab",
};

export const STATUS_BADGE: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  active:    { label: tLabel('hr.HROffboarding.faol', "Faol"),          variant: "secondary" },
  completed: { label: "Yakunlandi",    variant: "default" },
  cancelled: { label: tLabel('hr.HROffboarding.bekorQilindi', "Bekor qilindi"), variant: "destructive" },
};

/**
 * Icon map for checklist item keys.
 * Built with createElement so this file stays pure TS (no JSX transform needed).
 */
export const CHECKLIST_ICONS: Record<string, ReactNode> = {
  exit_interview:     createElement(MessageSquare, { className: "h-3.5 w-3.5" }),
  work_handover:      createElement(Handshake,     { className: "h-3.5 w-3.5" }),
  equipment_returned: createElement(Package,       { className: "h-3.5 w-3.5" }),
  id_card_returned:   createElement(BadgeCheck,    { className: "h-3.5 w-3.5" }),
  erp_access_revoked: createElement(Key,           { className: "h-3.5 w-3.5" }),
  nda_reviewed:       createElement(ScrollText,    { className: "h-3.5 w-3.5" }),
  settlement_done:    createElement(ClipboardList, { className: "h-3.5 w-3.5" }),
  final_document:     createElement(FileSignature, { className: "h-3.5 w-3.5" }),
};

// ── Exit-interview question definitions ───────────────────────────────────────

export type QuestionType = "text" | "rating" | "choice";

export interface ExitQuestion {
  key: string;
  label: string;
  type: QuestionType;
  required: boolean;
}

/** Mirrors the backend EXIT_INTERVIEW_QUESTIONS constant. */
export const EXIT_QUESTIONS: readonly ExitQuestion[] = [
  { key: "reason_for_leaving", label: tLabel('hr.HROffboarding.ketishSababingizNima', "Ketish sababingiz nima?"),         type: "text",   required: true },
  { key: "management_rating",  label: "Rahbariyatga baho bering (1-5):", type: "rating", required: true },
  { key: "environment_rating", label: "Ish muhitiga baho bering (1-5):", type: "rating", required: true },
  { key: "would_recommend",    label: "Kompaniyani tavsiya qilasizmi?",  type: "choice", required: true },
] as const;
