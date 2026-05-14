/** @module RecruiterKPIPageTypes @description Interfaces, types, constants and pure helper utilities for the Recruiter KPI page. No JSX. */

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface KPISummary {
  total_candidates: string;
  hired: string;
  rejected: string;
  via_referral: string;
  avg_time_to_fill_working_days: string | null;
  ai_pass_rate: string | null;
  offer_acceptance_rate: string | null;
  quality_of_hire: string | null;
}

export interface RecruiterRow {
  recruiter_id: number;
  recruiter_name: string;
  total: string;
  hired: string;
  rejected: string;
  hire_rate: string;
  avg_time_to_fill_working_days: string | null;
  offer_acceptance_rate: string | null;
  monthly_closed: string;
  quality_of_hire: string | null;
  ai_pass_rate: string | null;
}

export interface StageRow {
  stage: string;
  count: string;
}

export interface VacancyTypeRow {
  vacancy_type: string;
  applications: string;
  hired: string;
  conversion_rate: string;
}

export interface MonthlyTrendRow {
  month: string;
  monthly_hired: string;
  monthly_rejected: string;
  avg_fill_days: string | null;
}

export interface KPIData {
  period: { from: string; to: string };
  summary: KPISummary;
  byRecruiter: RecruiterRow[];
  byStage: StageRow[];
  byVacancyType: VacancyTypeRow[];
  monthlyTrend: MonthlyTrendRow[];
}

export interface UrgentVacancy {
  id: number;
  title: string;
  vacancy_type: string;
  department_name: string | null;
  candidate_count: string;
  deadline_working_days: number | null;
  working_days_elapsed: string | null;
}

export interface ChannelAnalyticsRow {
  ch_key: string;
  vacancy_count: string;
  total_views: string;
  total_applications: string;
  conversion_rate: string;
  phone_screening_count?: string;
  interview_count?: string;
  hired_count?: string;
}

export interface WorkerTypeStatsRow {
  worker_type: string;
  count: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const CONVERSION_TARGET = 60;

export const CHANNEL_META: Record<string, { label: string; color: string }> = {
  HH_UZ:     { label: "hh.uz",                     color: "bg-red-500"     },
  UZJOB:     { label: "UZjobs.uz",                  color: "bg-blue-500"    },
  MYJOB:     { label: "MyJob.uz",                   color: "bg-green-500"   },
  TELEGRAM:  { label: "Telegram",                   color: "bg-sky-500"     },
  INSTAGRAM: { label: "Instagram",                  color: "bg-pink-500"    },
  LINKEDIN:  { label: "LinkedIn",                   color: "bg-indigo-500"  },
  FACEBOOK:  { label: "Facebook",                   color: "bg-blue-700"    },
  REFERRAL:  { label: "Referral (xodim tavsiyasi)", color: "bg-purple-500"  },
  GAZETA:    { label: "Gazetalar / Matbuot",         color: "bg-amber-600"  },
};

export const STAGE_LABELS: Record<string, string> = {
  NEW:                  "Yangi ariza",
  QUESTIONNAIRE_SENT:   "Anketa yuborildi",
  PHONE_SCREENING:      "Telefon suhbati",
  INTERVIEW_SCHEDULED:  "Intervyu rejalashtirildi",
  INTERVIEWED:          "Intervyu o'tkazildi",
  TEST_SENT:            "Test yuborildi",
  REFERENCES:           "Tavsiyalar tekshiruvi",
  OFFER_SENT:           "Taklif yuborildi",
  HIRED:                "Qabul qilindi",
  PROBATION:            "Sinov davri",
  SINOV_COMPLETE:       "Sinov tugadi",
  REJECTED:             "Rad etildi",
};

export const TYPE_LABELS: Record<string, string> = {
  STANDARD:       "Standart",
  INTERNAL:       "Ichki",
  COMPLEX:        "Murakkab",
  TOP_MANAGEMENT: "Top Menejment",
};

export const TYPE_COLORS: Record<string, string> = {
  STANDARD:       "bg-blue-100 text-[var(--ep-blue)]",
  INTERNAL:       "bg-purple-100 text-[var(--ep-purple)]",
  COMPLEX:        "bg-orange-100 text-[var(--ep-primary)]",
  TOP_MANAGEMENT: "bg-red-100 text-[var(--ep-red)]",
};

export const WORKER_TYPE_PIE_COLORS = ["#22c55e", "#3b82f6", "#ef4444"] as const;

// ── Pure helpers ──────────────────────────────────────────────────────────────

/** Format a nullable/empty string value, appending an optional suffix. */
export function fmt(v: string | null | undefined, suffix = ""): string {
  if (v === null || v === undefined || v === "") return "–";
  return `${v}${suffix}`;
}
