
import { tLabel } from '@/lib/i18n/tLabel';
/**
 * @module HRCapitalTabTypes
 * @description Shared types, constants and helpers for HRCapitalTab.
 */

export interface HRCapitalProfile {
  employeeId: string;
  visotskiyCategory?: string;
  toolTestScore?: string;
  psychologicalProfile?: string;
  onboardingStatus?: string;
  offboardingStatus?: string;
  recruitingChannel?: string;
  notes?: string;
  updatedAt: string;
}

export interface HRCapitalTabProps {
  employeeId: string;
}

export type FormState = {
  visotskiyCategory: string;
  toolTestScore: string;
  psychologicalProfile: string;
  onboardingStatus: string;
  offboardingStatus: string;
  recruitingChannel: string;
  notes: string;
};

export const EMPTY_FORM: FormState = {
  visotskiyCategory: "",
  toolTestScore: "",
  psychologicalProfile: "",
  onboardingStatus: "not_started",
  offboardingStatus: "",
  recruitingChannel: "",
  notes: "",
};

export function buildFormFromProfile(profile: HRCapitalProfile): FormState {
  return {
    visotskiyCategory: profile.visotskiyCategory || "",
    toolTestScore: profile.toolTestScore || "",
    psychologicalProfile: profile.psychologicalProfile || "",
    onboardingStatus: profile.onboardingStatus || "not_started",
    offboardingStatus: profile.offboardingStatus || "",
    recruitingChannel: profile.recruitingChannel || "",
    notes: profile.notes || "",
  };
}

export const VISOTSKIY_COLORS: Record<string, string> = {
  Flagman:      "bg-blue-500/10 text-[var(--ep-blue)] border-blue-500/30",
  Performer:    "bg-green-500/10 text-[var(--ep-green)] border-green-500/30",
  Troublemaker: "bg-red-500/10 text-[var(--ep-red)] border-red-500/30",
};

export const ONBOARDING_LABELS: Record<string, { label: string; color: string }> = {
  not_started: { label: "Boshlanmagan",   color: "bg-muted text-muted-foreground" },
  in_progress: { label: "Davom etmoqda",  color: "bg-yellow-500/10 text-[var(--ep-yellow)]" },
  completed:   { label: tLabel('hr.HRCapitalTab.yakunlangan', "Yakunlangan"),    color: "bg-green-500/10 text-[var(--ep-green)]" },
};

export const TOOL_TEST_SCORES = ["A","B","C","D","E","F","G","H","I","J"] as const;

export const TEST_TYPE_LABELS: Record<string, string> = {
  tool_test:   "TOOL TEST",
  iq:          "IQ Test",
  leadership:  "Liderlik",
  replication: "Takrorlash",
};

export const INDICATOR_KEYS = ["A","B","C","D","E","F","G","H","I","J"] as const;

export const INDICATOR_COLORS: Record<string, string> = {
  A: "#6366f1", B: "#22c55e", C: "#f59e0b", D: "#ef4444", E: "#8b5cf6",
  F: "#06b6d4", G: "#f97316", H: "#14b8a6", I: "#84cc16", J: "#ec4899",
};

export interface HRCSession {
  id: number;
  test_type: string;
  score: number;
  syndrome: string;
  iq_level: string;
  status: string;
  created_at: string;
  indicators: Record<string, number>;
}
