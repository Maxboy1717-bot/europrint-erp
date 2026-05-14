/**
 * @module SDOverviewDashboardTypes
 * @description Type definitions and display constants for the SDOverviewDashboard page.
 */

import { Phone, Users, Activity, CheckSquare, AlertTriangle, Warehouse, FileText, Zap, TrendingDown } from "lucide-react";

export interface OverviewDashboardData {
  newOrders: { count: number; amount: number };
  inProduction: { count: number; amount: number };
  inWarehouse: { count: number; amount: number };
  delivering: { count: number };
  debitors: { amount: number; count: number };
  monthlyRevenue: number;
  monthlyCollected: number;
  monthlyOrders: number;
  leadFunnel: Record<string, number>;
  topManagers: { managerId: string; name: string; totalSales: number }[];
}

export interface ActionItem {
  type: string;
  priority: "high" | "medium" | "low";
  title: string;
  amount?: number;
  action: string;
  link: string;
}

export interface ManagerActionsData {
  overduePayments: { total: number; amount: number; items: unknown[] };
  warehouseRental: { total: number; amount: number };
  delayedOrders: { total: number; items: unknown[] };
  pendingProposals: { total: number; items: unknown[] };
  wonWithoutSO: { total: number };
  actionList: ActionItem[];
}

export interface CrmActivity {
  id: number;
  type: string;
  subject: string;
  dueDate: string | null;
  isDone: boolean;
  entityType: string | null;
  entityId: number | null;
}

export const ACTIVITY_TYPE_ICONS: Record<string, typeof Phone> = {
  call: Phone,
  meeting: Users,
  email: Activity,
  follow_up: CheckSquare,
  other: Activity,
};

export const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  call: "Qo'ng'iroq",
  meeting: "Uchrashuv",
  email: "Email",
  follow_up: "Kuzatuv",
  other: "Boshqa",
};

export const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-50 border-red-200 text-[var(--ep-red)]",
  medium: "bg-amber-50 border-amber-200 text-[var(--ep-yellow)]",
  low: "bg-blue-50 border-blue-200 text-[var(--ep-blue)]",
};

export const PRIORITY_LABELS: Record<string, string> = {
  high: "Yuqori",
  medium: "O'rta",
  low: "Past",
};

export const ACTION_ICONS: Record<string, typeof AlertTriangle> = {
  overdue_payment: AlertTriangle,
  delayed_order: TrendingDown,
  warehouse_rental: Warehouse,
  pending_proposal: FileText,
  won_without_so: Zap,
};
