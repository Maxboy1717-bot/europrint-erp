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

// NOTE: values are i18n keys (common ns) resolved with t() at render site.
// Brand names (Email/WhatsApp/Telegram) stay literal — not translatable UI text.
export const statusLabels: Record<string, string> = {
  new: "leadStatusNew",
  contacted: "leadStatusContacted",
  qualified: "leadStatusQualified",
  converted: "leadStatusConverted",
  lost: "leadStatusLost",
};

export const sourceLabels: Record<string, string> = {
  website: "leadSourceWebsite",
  referral: "leadSourceReferral",
  social: "leadSourceSocial",
  exhibition: "leadSourceExhibition",
  cold_call: "leadSourceColdCall",
  other: "leadSourceOther",
};

export const contactTypeLabels: Record<string, string> = {
  call: "contactTypeCall",
  meeting: "contactTypeMeeting",
  email: "Email",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
};

export const outcomeLabels: Record<string, string> = {
  interested: "outcomeInterested",
  not_interested: "outcomeNotInterested",
  callback: "outcomeCallback",
  no_answer: "outcomeNoAnswer",
  converted: "outcomeConverted",
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
