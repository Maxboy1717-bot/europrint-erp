/**
 * @module MarketingExtendedTypes
 * @description TypeScript interfaces, types, and constants for MarketingExtended page.
 */

import { type LucideIcon, TrendingUp, Globe, GitBranch, Scale, HeartPulse } from "lucide-react";

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

export interface AbTest {
  id?: string;
  name: string;
  variant: string;
  conversion: number;
  visitors: number;
  status: string;
}

export interface Competitor {
  id?: string;
  name: string;
  share?: number;
  price?: string;
  quality?: number;
  delivery?: string;
  weakness?: string;
  companyName?: string;
}

export interface SeoKeyword {
  keyword: string;
  pos: number;
  vol: number;
  trend: "up" | "down" | "stable";
}

export const RISK_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-[var(--ep-red)]",
  high: "bg-orange-100 text-[var(--ep-primary)]",
  medium: "bg-yellow-100 text-[var(--ep-yellow)]",
  low: "bg-green-100 text-[var(--ep-green)]",
};

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
  "comp": { title: "Raqobatchilar", icon: Scale },
  "nps": { title: "NPS / Churn", icon: HeartPulse },
};
