/**
 * @module SDQuotaDashboardTypes
 * @description TypeScript interfaces, types, and constants for SDQuotaDashboard.
 * No JSX — pure type declarations.
 */

export interface QuotaData {
  period: string;
  year: number;
  month: number;
  daysLeft: number;
  daysInMonth: number;
  quota: {
    target: number;
    achieved: number;
    percent: number;
    remaining: number;
    dailyTarget: number;
    dailyActual: number;
    pace: number;
  };
  totalSales: number;
  quotaAmount: number;
  quotaPercent: number;
  ordersThisMonth: number;
  leadsWon: number;
  leadsTotal: number;
  conversionRate: number;
  leadsByStatus: Record<string, number>;
  proposalsByStatus: Record<string, number>;
  totalProposals: number;
}

export const LEAD_STATUS_UZ: Record<string, string> = {
  new: "Yangi",
  working: "Ishlanyapti",
  quoted: "Taklif berildi",
  negotiating: "Muzokaralar",
  won: "Yutilgan",
  lost: "Yo'qotilgan",
  frozen: "Muzlatilgan",
};

export const PROPOSAL_STATUS_UZ: Record<string, string> = {
  draft: "Qoralama",
  calculated: "Hisoblangan",
  sent: "Yuborilgan",
  revised: "Qayta ko'rilgan",
  approved: "Tasdiqlangan",
  declined: "Rad etilgan",
};

export const PROPOSAL_STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted/40 text-muted-foreground",
  calculated: "bg-blue-50 text-[var(--ep-blue)]",
  sent: "bg-amber-50 text-[var(--ep-yellow)]",
  revised: "bg-purple-50 text-[var(--ep-purple)]",
  approved: "bg-green-50 text-[var(--ep-green)]",
  declined: "bg-red-50 text-[var(--ep-red)]",
};
