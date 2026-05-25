/**
 * MarketingDashboardTypes.ts
 * Interfaces, types and constants for MarketingDashboard.
 */
import { Phone, Mail, MessageCircle, Globe, UserCheck, HelpCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MARKETING_RISK_COLORS } from '@/constants/status';
/** @deprecated Use MARKETING_RISK_COLORS from '@/constants/status' directly */
export { MARKETING_RISK_COLORS as RISK_COLORS };

export type Segment = {
  segment: string;
  label: string;
  count: number;
  percent: number;
  color: string;
};

export type HotLead = {
  id: string;
  name: string;
  company: string | null;
  score: number | null;
  closeProbability: number;
  reason: string;
};

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

export interface LeadSourceChannel {
  key: string;
  label: string;
  icon: string;
  count: number;
  converted: number;
  percent: number;
  conversionRate: number;
}

export interface LeadSourceSummary {
  total: number;
  channels: LeadSourceChannel[];
  topChannel: string;
}

export interface NpsStats {
  avgScore: number;
  monthlyAvg: number;
  totalResponses: number;
  recentResponses: number;
  lastComments: { id: string; score: number; comment: string | null; createdAt: string }[];
}

export interface DashboardStats {
  activeCampaigns: number;
  totalLeads: number;
  recentLeads: number;
  totalContent: number;
  exhibitions: number;
  totalBudget: string;
  totalSpent: string;
  channelStats: { channel: string; count: number }[];
  convertedLeads: number;
  conversionRate: number;
}

export const RISK_LABELS: Record<string, string> = {
  critical: "Kritik", high: "Yuqori", medium: "O'rta", low: "Past",
};

// RISK_COLORS re-exported above from '@/constants/status' as MARKETING_RISK_COLORS

export const CHANNEL_ICONS: Record<string, LucideIcon> = {
  phone: Phone,
  telegram: MessageCircle,
  website: Globe,
  email: Mail,
  referral: UserCheck,
  other: HelpCircle,
};
