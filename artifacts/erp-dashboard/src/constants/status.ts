/**
 * Canonical status/colour maps shared across modules.
 *
 * STATUS_COLORS  — WMS stock/movement status → Tailwind classes
 * MARKETING_RISK_COLORS — shared Marketing risk level → Tailwind classes
 *   Used by: MarketingExtendedSections, MarketingDashboardDialogs, MarketingDashboardPanels
 *
 * Import: import { STATUS_COLORS, MARKETING_RISK_COLORS } from '@/constants/status';
 */
export const STATUS_COLORS = {
  normal:   "bg-green-500/20 text-green-400 border-green-500/40",
  low:      "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  critical: "bg-red-500/20 text-red-400 border-red-500/40",
  active:   "bg-green-500/20 text-green-400 border-green-500/40",
  slow:     "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  obsolete: "bg-red-500/20 text-red-400 border-red-500/40",
  ok:       "bg-green-500/20 text-green-400 border-green-500/40",
  warning:  "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  expired:  "bg-red-500/20 text-red-400 border-red-500/40",
} as const;

export type StatusColorKey = keyof typeof STATUS_COLORS;

export const ABC_COLORS = {
  A: "#22c55e",
  B: "#eab308",
  C: "#ef4444",
} as const;

export const PIE_COLORS = ["#22c55e", "#eab308", "#ef4444"] as const;

/**
 * Marketing module risk level → Tailwind CSS classes.
 * Identical copy formerly lived in MarketingExtendedTypes and MarketingDashboardTypes.
 * Single canonical source — do NOT redefine in module-level type files.
 */
export const MARKETING_RISK_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-[var(--ep-red)]",
  high:     "bg-orange-100 text-[var(--ep-primary)]",
  medium:   "bg-yellow-100 text-[var(--ep-yellow)]",
  low:      "bg-green-100 text-[var(--ep-green)]",
};
