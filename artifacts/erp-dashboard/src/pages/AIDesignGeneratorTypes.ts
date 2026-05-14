/** @module AIDesignGeneratorTypes @description TypeScript interfaces, type aliases, and shared constants for the AI Design Generator feature. No JSX. */

// ─── Status zanjiri konstantalari ────────────────────────────────────────────
export const STATUS_LABELS: Record<string, string> = {
  new:                       "Yangi",
  ai_generated:              "AI Generatsiya",
  designer_review:           "Dizayner ko'rmoqda",
  waiting_customer_approval: "Mijoz tasdig'i",
  revision_requested:        "Tahrirlash",
  approved:                  "Tasdiqlangan",
  rejected:                  "Rad etilgan",
  archived:                  "Arxiv",
};

export const STATUS_COLORS: Record<string, string> = {
  new:                       "bg-slate-100 text-slate-700 border-slate-300",
  ai_generated:              "bg-purple-100 text-[var(--ep-purple)] border-purple-300",
  designer_review:           "bg-blue-100 text-[var(--ep-blue)] border-blue-300",
  waiting_customer_approval: "bg-yellow-100 text-[var(--ep-yellow)] border-yellow-300",
  revision_requested:        "bg-orange-100 text-[var(--ep-primary)] border-orange-300",
  approved:                  "bg-green-100 text-[var(--ep-green)] border-green-300",
  rejected:                  "bg-red-100 text-[var(--ep-red)] border-red-300",
  archived:                  "bg-gray-100 text-gray-500 border-gray-300",
};

export const STATUS_CHAIN = [
  "new", "ai_generated", "designer_review",
  "waiting_customer_approval", "revision_requested", "approved",
] as const;

export const AI_CHECK_LABELS: Record<string, string> = {
  spelling_uz:  "UZ imlosi",
  spelling_ru:  "RU imlosi",
  spelling_en:  "EN imlosi",
  bleed:        "Bleed (3mm)",
  cmyk:         "CMYK rang",
  logo_quality: "Logo sifati",
  overall:      "Umumiy",
};

export const TOOLING_LABELS: Record<string, string> = {
  cliche:   "Kleche",
  plate:    "Plastina",
  mold:     "Qolip",
  die_cut:  "Biglovka",
  cylinder: "Silindr",
  screen:   "Trubka",
  flexo:    "Flexo val",
  gravure:  "Gravür",
  offset:   "Offset",
  digital:  "Raqamli",
};

export const TOOLING_STATUS_BADGE: Record<string, string> = {
  active:      "bg-green-100 text-[var(--ep-green)]",
  maintenance: "bg-blue-100 text-[var(--ep-blue)]",
  worn:        "bg-red-100 text-[var(--ep-red)]",
  retired:     "bg-gray-100 text-gray-500",
  ordered:     "bg-yellow-100 text-[var(--ep-yellow)]",
};

// ─── Interfacelar ─────────────────────────────────────────────────────────────
export interface DesignOrder {
  order: {
    id: string;
    orderNumber: string;
    productName: string;
    clientName: string;
    status: string;
    productType: string;
  };
}

export interface GeneratedDesign {
  id: string;
  imageUrl?: string;
  title: string;
  slogan?: string;
  version: number;
  orderId: string;
  status: string;
}

export interface AiCheckResult {
  check_type: string;
  status: string;
  score: number;
  issues: string[];
  details: Record<string, unknown>;
}

export interface RevisionRecord {
  id: string;
  revision_number: number;
  from_status?: string;
  to_status: string;
  change_summary?: string;
  requested_by_name?: string;
  requested_at: string;
  revision_type: string;
}

export interface DashboardSummary {
  byStatus: Record<string, number>;
  totalOrders: number;
  pendingApproval: number;
  failedChecks: number;
  wornTooling: number;
}

export type ToolingRecord = Record<string, unknown>;
