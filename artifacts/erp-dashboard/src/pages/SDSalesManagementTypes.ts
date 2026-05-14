/**
 * @module SDSalesManagementTypes
 * @description TypeScript interfaces, types, and constants for SDSalesManagement.
 * No JSX — pure type declarations.
 */

export const URL_TAB_MAP: Record<string, string> = {
  "/sd/invoices": "invoices",
  "/sd/forecast": "forecast",
  "/sd/analytics": "analytics",
  "/sd/commission": "commission",
  "/sd/sales-management": "invoices",
};

export interface Invoice {
  id: string;
  invoiceNumber?: string;
  customerId?: string;
  customerName?: string;
  orderId?: string;
  issueDate?: string;
  dueDate?: string;
  totalAmount?: number | string;
  paidAmount?: number | string;
  status?: string;
  currency?: string;
}

export interface ForecastHistory {
  id: string;
  period?: string;
  forecastType?: string;
  forecastedRevenue?: number | string;
  forecastedUnits?: number | string;
  actualRevenue?: number | string;
  accuracy?: number | string;
  generatedAt?: string;
}

export interface AnalyticsMonthly {
  month?: string;
  year?: number;
  totalRevenue?: number | string;
  totalOrders?: number;
  avgOrderValue?: number | string;
  newCustomers?: number;
}

export interface CommissionRecord {
  id: string;
  salesPersonId?: string;
  salesPersonName?: string;
  period?: string;
  totalSales?: number | string;
  commissionRate?: number | string;
  commissionAmount?: number | string;
  status?: string;
  approvedAt?: string;
}

export interface LeaderboardEntry {
  rank?: number;
  salesPersonId?: string;
  salesPersonName?: string;
  totalSales?: number | string;
  target?: number | string;
  achievementPct?: number | string;
  commissionEarned?: number | string;
}

export const statusVariant: Record<string, string> = {
  draft: "bg-muted/60 text-foreground",
  sent: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  partial: "bg-amber-100 text-amber-800",
  cancelled: "bg-muted/60 text-muted-foreground",
  approved: "bg-green-100 text-green-800",
  pending: "bg-amber-100 text-amber-800",
};

export const statusLabel: Record<string, string> = {
  draft: "Qoralama",
  sent: "Yuborilgan",
  paid: "To'langan",
  overdue: "Muddati o'tgan",
  partial: "Qisman",
  cancelled: "Bekor",
  approved: "Tasdiqlangan",
  pending: "Kutilmoqda",
};
