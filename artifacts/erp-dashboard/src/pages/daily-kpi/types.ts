/**
 * @module types
 * @description React page component. Route-level UI.
 */

import { AlertCircle, Lightbulb, LineChart, Brain } from "lucide-react";

export interface DailyMetrics {
  metricDate: string;
  cashBalance: number;
  bankBalance?: number;
  totalLiquidity?: number;
  dailyIncome: number;
  dailyExpense: number;
  dailyNetCash: number;
  totalReceivables?: number;
  totalPayables?: number;
  overdueReceivables?: number;
  overduePayables?: number;
  inventoryValue?: number;
  newOrdersCount?: number;
  newOrdersValue?: number;
  invoicedValue?: number;
  collectedValue?: number;
  dailyGrossProfit?: number;
  dailyGrossMargin?: number;
  cashTrend?: number;
  incomeTrend?: number;
  ordersTrend?: number;
}

export interface AiFinanceInsight {
  id: string;
  insightType: string;
  segment: string;
  insightDate: string;
  confidence?: number;
  priority: string;
  title: string;
  description: string;
  impact?: string;
  recommendation?: string;
  actionRequired: boolean;
  actionTaken: boolean;
}

export function formatShortCurrency(amount: number): string {
  if (amount >= 1000000000) return (amount / 1000000000).toFixed(1) + " mlrd";
  if (amount >= 1000000) return (amount / 1000000).toFixed(1) + " mln";
  if (amount >= 1000) return (amount / 1000).toFixed(0) + " ming";
  return amount.toFixed(0);
}

export function getPriorityBadgeVariant(priority: string): "error" | "warning" | "success" | "info" {
  switch (priority) {
    case "high":
    case "critical": return "error";
    case "medium": return "warning";
    case "low": return "success";
    default: return "info";
  }
}

export function getPriorityLabel(priority: string): string {
  switch (priority) {
    case "critical": return "Juda muhim";
    case "high": return "Yuqori";
    case "medium": return "O'rta";
    case "low": return "Past";
    default: return priority;
  }
}

export function getInsightTypeIcon(type: string) {
  switch (type) {
    case "alert": return AlertCircle;
    case "recommendation": return Lightbulb;
    case "forecast": return LineChart;
    case "anomaly": return AlertCircle;
    default: return Brain;
  }
}

export function getWeeklyDateRange(): { dateFrom: string; dateTo: string } {
  const today = new Date();
  const dateTo = today.toISOString().split('T')[0];
  const dateFrom = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  return { dateFrom, dateTo };
}
