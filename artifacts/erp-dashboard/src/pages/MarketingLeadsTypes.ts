/**
 * @module MarketingLeadsTypes
 * @description Interfaces, types, and constants for the MarketingLeads page. No JSX.
 */

import type { MarketingLead } from "@shared/schema";

// ─── Re-export shared type so sub-files can import from here ─────────────────
export type { MarketingLead };

// ─── Local types ─────────────────────────────────────────────────────────────

export type LeadFormPayload = {
  name: string;
  score: number;
  company?: string;
  phone?: string;
  email?: string;
  channel?: string;
  notes?: string;
  source: string;
  status: string;
  lostReason?: string;
};

export type ContactLog = {
  id: string;
  type: string;
  summary: string | null;
  outcome: string | null;
  contactedAt: string;
};

export type FunnelStage = {
  status: string;
  label: string;
  count: number;
  conversionRate: number;
  dropOff: number;
};

export type LossAnalysis = {
  total: number;
  breakdown: { reason: string; count: number; percent: number }[];
};

export type FilterKey = "all" | "hot" | "overdue" | "lost";

export type LeadFormState = {
  name: string;
  company: string;
  phone: string;
  email: string;
  source: string;
  channel: string;
  status: string;
  score: string;
  notes: string;
  lostReason: string;
};

export type ContactFormState = {
  type: string;
  summary: string;
  outcome: string;
  nextFollowUp: string;
};

// ─── Constants ───────────────────────────────────────────────────────────────

export const statusLabels: Record<string, string> = {
  new: "Yangi",
  contacted: "Aloqa qilingan",
  qualified: "Malakali",
  converted: "Konversiya",
  lost: "Yo'qolgan",
};

export const sourceLabels: Record<string, string> = {
  website: "Veb-sayt",
  referral: "Tavsiya",
  social: "Ijtimoiy tarmoq",
  exhibition: "Ko'rgazma",
  cold_call: "Sovuq qo'ng'iroq",
  other: "Boshqa",
};

export const contactTypeLabels: Record<string, string> = {
  call: "Qo'ng'iroq",
  meeting: "Uchrashuv",
  email: "Email",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
};

export const outcomeLabels: Record<string, string> = {
  interested: "Qiziqish bildirdi",
  not_interested: "Qiziqmadi",
  callback: "Qayta qo'ng'iroq",
  no_answer: "Javob bermadi",
  converted: "Konvertatsiya",
};

export const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

// ─── Score helper fns (no JSX — returns CSS class strings) ───────────────────

export function scoreColor(s: number | null): string {
  if (!s || s < 30) return "text-[var(--ep-red)]";
  if (s < 60) return "text-[var(--ep-yellow)]";
  return "text-[var(--ep-green)]";
}

export function scoreBadgeClass(s: number | null): string {
  if (!s || s < 30) return "bg-red-50 text-[var(--ep-red)]";
  if (s < 60) return "bg-amber-50 text-[var(--ep-yellow)]";
  return "bg-green-50 text-[var(--ep-green)]";
}

export function isLeadOverdue(l: MarketingLead): boolean {
  return (
    l.status === "new" &&
    !!l.updatedAt &&
    new Date().getTime() - new Date(l.updatedAt).getTime() > TWO_DAYS_MS
  );
}
