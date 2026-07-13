/**
 * @module MarketingExtendedTypes
 * @description TypeScript interfaces, types, and constants for MarketingExtended page.
 */

import { type LucideIcon, TrendingUp, Globe, GitBranch, Scale, HeartPulse } from "lucide-react";

import { tLabel } from '@/lib/i18n/tLabel';
import { MARKETING_RISK_COLORS } from '@/constants/status';
/** @deprecated Use MARKETING_RISK_COLORS from '@/constants/status' directly */
export { MARKETING_RISK_COLORS as RISK_COLORS };
export interface ChurnCustomer {
  id: number;
  name: string;
  phone: string | null;
  lastOrderDate: string | null;
  daysSinceOrder: number | null;
  churnScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  npsAvg: number | null;
  totalOrders: number;
}

export interface ChurnData {
  total: number;
  customers: ChurnCustomer[];
  riskCounts: { critical: number; high: number; medium: number; low: number };
}

export interface MarketingCampaign {
  id: number;
  name?: string;
  type?: string;
  budget?: number | string;
  spent?: number | string;
  status?: string;
}

export interface NpsMonthly {
  month: string;
  score: number;
  responses: number;
  detractors: number;
  passives: number;
  promoters: number;
}

// Matches the marketing_ab_tests row shape (two variants A/B, per-variant counters).
// All counters optional — a freshly-created test has DB-default 0s; guard before use.
export interface AbTest {
  id?: string;
  name: string;
  variant_a?: string;
  variant_b?: string;
  impressions_a?: number;
  impressions_b?: number;
  clicks_a?: number;
  clicks_b?: number;
  conversions_a?: number;
  conversions_b?: number;
  status?: string;
}

export interface Competitor {
  name: string;
  customersCount: number;
  avgOurShare: number;
  avgTheirShare: number;
  switchRisk: string;
}

export interface SeoKeyword {
  keyword: string;
  pos: number;
  vol: number;
  trend: "up" | "down" | "stable";
}

// RISK_COLORS re-exported above from '@/constants/status' as MARKETING_RISK_COLORS

export const routeTabMap: Record<string, string> = {
  "/marketing/analytics": "roi",
  "/marketing/seo": "seo",
  "/marketing/ab-testing": "ab",
  "/marketing/competitors": "comp",
  "/marketing/nps-churn": "nps",
};

export const seoKeywords: SeoKeyword[] = [
  { keyword: "gofrokarton qadoq", pos: 3, vol: 1200, trend: "up" },
  { keyword: "karton quti narxi", pos: 7, vol: 850, trend: "up" },
  { keyword: "gofra korobka", pos: 12, vol: 620, trend: "down" },
  { keyword: "packaging uzbekistan", pos: 5, vol: 480, trend: "up" },
  { keyword: "euro print toshkent", pos: 1, vol: 320, trend: "up" },
  { keyword: "gofrolash xizmati", pos: 15, vol: 290, trend: "stable" },
];

export const tabMeta: Record<string, { title: string; icon: LucideIcon }> = {
  "roi": { title: "ROI / ROAS", icon: TrendingUp },
  "seo": { title: "SEO Tahlil", icon: Globe },
  "ab": { title: "A/B Test", icon: GitBranch },
  "comp": { title: tLabel('common.MarketingExtended.raqobatchilar', "Raqobatchilar"), icon: Scale },
  "nps": { title: "NPS / Churn", icon: HeartPulse },
};
