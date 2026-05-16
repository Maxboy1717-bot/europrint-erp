/**
 * @module CandidateChecklistTypes
 * @description Types, constants, and interfaces for CandidateChecklist.
 */

import { ProbationReview } from "@/components/hr/ProbationReviewDialog";

import { tLabel } from '@/lib/i18n/tLabel';
// ─── Cheklist bandlari (backend bilan mos kelishi kerak) ─────────────────────
export const CHECKLIST_ITEMS = [
  { key: "cv_received",               step: 4, stepLabel: "TEZ ISHLASH",     label: tLabel('production.CandidateChecklist.cvQabulQilindiVaRoyxatga', "CV qabul qilindi va ro'yxatga kiritildi"),          mandatory: true,  sla_hours: 4   },
  { key: "cv_screened",               step: 4, stepLabel: "TEZ ISHLASH",     label: tLabel('production.CandidateChecklist.cvSkriningOtkazildiMaterial52', "CV skrining o'tkazildi (Material №52)"),            mandatory: true,  sla_hours: 24  },
  { key: "phone_interview",           step: 4, stepLabel: "TEZ ISHLASH",     label: tLabel('production.CandidateChecklist.telefonSuhbatiOtkazildiMaterial53', "Telefon suhbati o'tkazildi (Material №53)"),        mandatory: true,  sla_hours: 48  },
  { key: "productivity_questionnaire",step: 4, stepLabel: "TEZ ISHLASH",     label: tLabel('production.CandidateChecklist.mahsuldorlikAnketaToldirildi', "Mahsuldorlik anketa to'ldirildi"),                  mandatory: false, sla_hours: 72  },
  { key: "background_check",          step: 5, stepLabel: "BAHOLASH",        label: tLabel('production.CandidateChecklist.fonTekshiruviIjtimoiyTarmoqlarMat', "Fon tekshiruvi (ijtimoiy tarmoqlar, Mat. №54)"),    mandatory: false, sla_hours: 48  },
  { key: "main_interview",            step: 5, stepLabel: "BAHOLASH",        label: tLabel('production.CandidateChecklist.asosiySuhbatOtkazildiMaterial11', "Asosiy suhbat o'tkazildi (Material №11)"),          mandatory: true,  sla_hours: 120 },
  { key: "tool_test",                 step: 5, stepLabel: "BAHOLASH",        label: tLabel('production.CandidateChecklist.hrCapitalToolTestOtkazildi', "HR Capital TOOL TEST o'tkazildi (A-J)"),            mandatory: true,  sla_hours: 120 },
  { key: "ai_interview",              step: 5, stepLabel: "BAHOLASH",        label: tLabel('production.CandidateChecklist.aiSuhbatErpTizimidaOtkazildi', "AI Suhbat (ERP tizimida) o'tkazildi"),              mandatory: false, sla_hours: 120 },
  { key: "productivity_form",         step: 5, stepLabel: "BAHOLASH",        label: tLabel('production.CandidateChecklist.material46MahsuldorlikShakliToldirildi', "Material №46 — Mahsuldorlik shakli to'ldirildi"),   mandatory: true,  sla_hours: 168 },
  { key: "reference_check",           step: 5, stepLabel: "BAHOLASH",        label: tLabel('production.CandidateChecklist.tavsiyalarTekshirildiReferenceCheck', "Tavsiyalar tekshirildi (Reference check)"),         mandatory: false, sla_hours: 168 },
  { key: "final_decision",            step: 6, stepLabel: "KIRISH",          label: "Yakuniy qaror qabul qilindi",                      mandatory: true,  sla_hours: 24  },
  { key: "offer_sent",                step: 6, stepLabel: "KIRISH",          label: tLabel('production.CandidateChecklist.taklifYuborildiOgzakiTaklifBerildi', "Taklif yuborildi / og'zaki taklif berildi"),        mandatory: true,  sla_hours: 48  },
  { key: "offer_accepted",            step: 6, stepLabel: "KIRISH",          label: "Taklif qabul qilindi",                             mandatory: true,  sla_hours: 72  },
  { key: "contract_signed",           step: 6, stepLabel: "KIRISH",          label: "Mehnat shartnomasi imzolandi",                     mandatory: true,  sla_hours: 120 },
  { key: "onboarding_scheduled",      step: 6, stepLabel: "KIRISH",          label: "Ishga kirish sanasi va rejasi belgilandi",         mandatory: true,  sla_hours: 48  },
  { key: "onboarding_started",        step: 7, stepLabel: "KUCHAYTIRISH",    label: "Ishga kirish (onboarding) boshlandi",              mandatory: true,  sla_hours: null },
  { key: "mentor_assigned",           step: 7, stepLabel: "KUCHAYTIRISH",    label: "Mentor / nastavnik tayinlandi",                    mandatory: false, sla_hours: 48  },
  { key: "day_30_review",             step: 7, stepLabel: "KUCHAYTIRISH",    label: tLabel('production.CandidateChecklist.30KunBaholashSuhbatiOtkazildi', "30-kun baholash suhbati o'tkazildi"),               mandatory: true,  sla_hours: null },
  { key: "day_90_review",             step: 7, stepLabel: "KUCHAYTIRISH",    label: "90-kun baholash (sinov muddati yakunlandi)",        mandatory: true,  sla_hours: null },
] as const;

export type ChecklistKey = typeof CHECKLIST_ITEMS[number]["key"];

export const REVIEW_KEYS: Record<string, "30" | "90"> = {
  day_30_review: "30",
  day_90_review: "90",
};

export interface ChecklistItem {
  done: boolean;
  done_at?: string | null;
  note?: string;
  done_by?: string;
}

export type ChecklistData = Partial<Record<ChecklistKey, ChecklistItem>>;

export interface ChecklistResponse {
  data: {
    pipeline_entry_id: number;
    checklist_data: ChecklistData;
    id: number | null;
  };
}

export interface ProbationReviewsResponse {
  data: ProbationReview[];
}

export const STEP_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  4: { bg: "bg-blue-50",   text: "text-[var(--ep-blue)]",   border: "border-blue-200" },
  5: { bg: "bg-amber-50",  text: "text-[var(--ep-yellow)]",  border: "border-amber-200" },
  6: { bg: "bg-green-50",  text: "text-[var(--ep-green)]",  border: "border-green-200" },
  7: { bg: "bg-purple-50", text: "text-[var(--ep-purple)]", border: "border-purple-200" },
};

export function getProgressInfo(data: ChecklistData) {
  const mandatory = CHECKLIST_ITEMS.filter(i => i.mandatory);
  const total = mandatory.length;
  const done = (Array.isArray(mandatory) ? mandatory : []).filter(i => data[i.key]?.done).length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}
