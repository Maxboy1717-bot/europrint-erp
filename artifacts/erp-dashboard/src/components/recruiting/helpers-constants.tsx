/**
 * @module recruiting/helpers-constants
 * @description Stage/phase tables and channel maps for recruiting components.
 *   Split out of `helpers.tsx` so each file stays under 300 lines.
 */

import type { FunnelStage } from "@/components/recruiting/types";

export type { FunnelStage };

export const STAGES: { key: FunnelStage; label: string; accent: string }[] = [
  { key: "NEW", label: "Yangi ariza", accent: "bg-blue-500" },
  { key: "QUESTIONNAIRE_SENT", label: "Anketa Yuborildi", accent: "bg-cyan-500" },
  { key: "PHONE_SCREENING", label: "Telefon Suhbat", accent: "bg-violet-500" },
  { key: "INTERVIEW_SCHEDULED", label: "Suhbat Rejalandi", accent: "bg-indigo-500" },
  { key: "INTERVIEWED", label: "Suhbat O'tdi", accent: "bg-teal-500" },
  { key: "TEST_SENT", label: "Test Yuborildi", accent: "bg-amber-500" },
  { key: "REFERENCES", label: "Tavsiyalar Tekshiruvi", accent: "bg-sky-500" },
  { key: "OFFER_SENT", label: "Taklif Yuborildi", accent: "bg-orange-500" },
  { key: "HIRED", label: "Qabul qilindi", accent: "bg-green-500" },
  { key: "PROBATION", label: "Sinov Davri", accent: "bg-emerald-500" },
  { key: "SINOV_COMPLETE", label: "Sinov Yakunlandi", accent: "bg-lime-500" },
  { key: "REJECTED", label: "Rad etildi", accent: "bg-red-500" },
];

export const NEXT_STAGE: Partial<Record<FunnelStage, FunnelStage>> = {
  NEW: "QUESTIONNAIRE_SENT",
  QUESTIONNAIRE_SENT: "PHONE_SCREENING",
  PHONE_SCREENING: "INTERVIEW_SCHEDULED",
  INTERVIEW_SCHEDULED: "INTERVIEWED",
  INTERVIEWED: "TEST_SENT",
  TEST_SENT: "REFERENCES",
  REFERENCES: "OFFER_SENT",
  OFFER_SENT: "HIRED",
  HIRED: "PROBATION",
  PROBATION: "SINOV_COMPLETE",
};

export const TERMINAL_STAGES: FunnelStage[] = ["SINOV_COMPLETE", "REJECTED"];

export const HC_PHASES = [
  { num: 1, id: "PORTRET", label: "PORTRET", color: "bg-purple-500", desc: "Vakansiya profili yaratish, xodim portreti to'ldirish", stages: [] as FunnelStage[] },
  { num: 2, id: "UPAKOVKA", label: "UPAKOVKA", color: "bg-blue-500", desc: "Vakansiyani e'lon qilish, kanallarni faollashtirish", stages: [] as FunnelStage[] },
  { num: 3, id: "OQIM", label: "OQIM", color: "bg-cyan-500", desc: "Nomzodlar oqimini boshqarish (bosqich 1–3)", stages: ["NEW", "QUESTIONNAIRE_SENT", "PHONE_SCREENING"] as FunnelStage[] },
  { num: 4, id: "BAHOLASH", label: "BAHOLASH", color: "bg-amber-500", desc: "Suhbat, test va baholash (bosqich 4–6)", stages: ["INTERVIEW_SCHEDULED", "INTERVIEWED", "TEST_SENT"] as FunnelStage[] },
  { num: 5, id: "KIRITISH", label: "KIRITISH", color: "bg-orange-500", desc: "Tavsiyalar tekshiruvi va taklif (bosqich 7–8)", stages: ["REFERENCES", "OFFER_SENT"] as FunnelStage[] },
  { num: 6, id: "KUCHAYTIRISH", label: "KUCHAYTIRISH", color: "bg-emerald-600", desc: "Ishga qabul, sinov davri va yakunlash (bosqich 9–11)", stages: ["HIRED", "PROBATION", "SINOV_COMPLETE"] as FunnelStage[] },
];

export function getPhaseForStage(stage: FunnelStage) {
  return HC_PHASES.find((p) => p.stages.includes(stage));
}

export const CHANNEL_COLORS: Record<string, string> = {
  HH_UZ: "bg-red-500",
  UZJOB: "bg-blue-500",
  MYJOB: "bg-green-500",
  OLX_UZ: "bg-teal-500",
  TELEGRAM: "bg-sky-500",
  INSTAGRAM: "bg-pink-500",
  LINKEDIN: "bg-indigo-500",
  FACEBOOK: "bg-blue-700",
};

export const CHANNEL_LABELS: Record<string, string> = {
  LINKEDIN: "LinkedIn",
  HH_UZ: "HH.uz",
  UZJOB: "UZjob",
  MYJOB: "MyJob",
  OLX_UZ: "OLX.uz",
  TELEGRAM: "Telegram",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
};

export const CHANNEL_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  posted: { label: "E'lon berildi", color: "bg-green-500/15 text-green-400 border-green-500/40" },
  pending: { label: "Ждёт", color: "bg-amber-500/15 text-amber-400 border-amber-500/40" },
  not_posted: { label: "Berilmadi", color: "bg-muted/50 text-muted-foreground border-border/40" },
};

export const ALL_CHANNELS = ["LINKEDIN", "HH_UZ", "UZJOB", "MYJOB", "OLX_UZ", "TELEGRAM"];
