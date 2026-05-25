/**
 * @module AIFinancePageTypes
 * @description TypeScript interfaces, type aliases, Zod schemas, and utility
 * functions for the AI Finance analysis page.
 */

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface Anomaly {
  description: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  amount?: number;
}

export interface AnomalyResult {
  hasAnomalies: boolean;
  anomalies: Anomaly[];
  overallRiskScore: number;
  recommendation: string;
}

export interface CashflowForecast {
  nextMonthInflow: number;
  nextMonthOutflow: number;
  netCashflow: number;
  confidence: number;
  warnings: string[];
  opportunities: string[];
}

export interface BudgetVariance {
  variancePercent: number;
  mainCauses: string[];
  isAcceptable: boolean;
  correctionActions: string[];
  trend: "IMPROVING" | "WORSENING" | "STABLE";
}

export interface InvoiceClassification {
  category: string;
  subcategory: string;
  taxCode: string;
  confidence: number;
}

export interface FraudRisk {
  riskLevel: "HIGH" | "MEDIUM" | "LOW";
  riskScore: number;
  redFlags: string[];
}

export interface HistoricalMonth {
  month: string;
  inflow: number;
  outflow: number;
}

// ─── Utility functions ────────────────────────────────────────────────────────

/** Generate last N month labels (YYYY-MM) */
export function lastNMonths(n: number): HistoricalMonth[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (n - 1 - i));
    return {
      month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      inflow: 0,
      outflow: 0,
    };
  });
}

export function riskColor(score: number): string {
  if (score >= 70) return "bg-red-500";
  if (score >= 40) return "bg-yellow-500";
  return "bg-green-500";
}
