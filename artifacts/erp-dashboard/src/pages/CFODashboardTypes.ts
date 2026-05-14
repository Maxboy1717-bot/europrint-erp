/**
 * @module CFODashboardTypes
 * @description Interfaces, types, and constants for CFODashboard.
 */

export interface CFODashboardData {
  kpis: {
    currentRatio?: number;
    quickRatio?: number;
    grossProfitMargin?: number;
    netProfitMargin?: number;
    returnOnAssets?: number;
    returnOnEquity?: number;
  };
  revenue: number;
  expenses: number;
  grossProfit: number;
  cashBalance: number;
  accountsReceivable: number;
  accountsPayable: number;
  workingCapital: number;
}

export interface CashPositionData {
  accounts: Array<{
    id: string;
    accountName: string;
    accountNumber: string;
    bankName: string;
    currency: string;
    balance: number;
  }>;
  summary: {
    totalBalance: number;
    accountCount: number;
  };
  byCurrency: Array<{
    currency: string;
    total: number;
    accountCount: number;
  }>;
}

export interface ProfitabilityData {
  revenue: {
    total: number;
    netValue: number;
    taxAmount: number;
    invoiceCount: number;
  };
  costs: {
    total: number;
    material: number;
    labor: number;
    overhead: number;
  };
  grossProfit: number;
  grossMargin: number;
}

export interface RiskItem {
  category: string;
  level: "low" | "medium" | "high" | "critical";
  score: number;
  detail: string;
  recommendation: string;
}

export interface FinancialRiskData {
  generatedAt: string;
  overallRiskScore: number;
  overallRiskLevel: "low" | "medium" | "high" | "critical";
  summary: {
    totalAR: number;
    overdueAR: number;
    totalAP: number;
    overdueAP: number;
    cashBalanceUZS: number;
    cashRunwayDays: number;
    collectionRisk: number;
    profitMarginTrend: "improving" | "declining" | "stable";
    latestGrossProfitMargin: number | null;
  };
  risks: RiskItem[];
  bankAccounts: Array<{ bankName: string; currency: string; balance: number; accountNumber: string }>;
  aiInsight: string;
}

export interface ProfitabilityTrendItem {
  month: string;
  revenue: number;
  expenses: number;
}

export interface FinancialRatiosDto {
  period: string;
  liquidity: { currentRatio: number; quickRatio: number; cashRatio: number; workingCapital: number };
  profitability: { grossMarginPct: number; netMarginPct: number; roa: number; roe: number; roce: number };
  leverage: { debtToEquity: number; interestCoverage: number };
  altmanZ: { score: number; zone: 'Safe' | 'Grey Zone' | 'Distress'; x1: number; x2: number; x3: number; x4: number; x5: number };
  revenue: number; cogs: number; opex: number; netIncome: number;
  totalAssets: number; totalEquity: number; totalDebt: number;
}

export interface WeeklyForecast {
  week: number;
  weekStart: string;
  weekEnd: string;
  totalInflow: number;
  totalOutflow: number;
  netCashFlow: number;
  cumulativeCash: number;
  status: 'OK' | 'WARNING' | 'CRITICAL';
}

export interface CashflowForecastDto {
  openingBalance: number;
  minCash: number;
  scenarios: { base: WeeklyForecast[]; optimistic: WeeklyForecast[]; pessimistic: WeeklyForecast[] };
  generatedAt: string;
}

export const CURRENCY_COLORS: Record<string, string> = {
  UZS: "hsl(145, 65%, 50%)",
  USD: "hsl(210, 80%, 55%)",
  EUR: "hsl(270, 60%, 60%)",
  RUB: "hsl(45, 90%, 55%)",
};

export const DEFAULT_COLORS = [
  "hsl(145, 65%, 50%)",
  "hsl(210, 80%, 55%)",
  "hsl(270, 60%, 60%)",
  "hsl(45, 90%, 55%)",
  "hsl(0, 70%, 55%)",
  "hsl(200, 70%, 55%)",
];
