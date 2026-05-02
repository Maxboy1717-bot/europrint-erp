export interface AnomalyResult {
  hasAnomalies: boolean;
  anomalies: Array<{ description: string; severity: 'HIGH' | 'MEDIUM' | 'LOW'; amount?: number }>;
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

export interface BudgetVarianceExplanation {
  variancePercent: number;
  mainCauses: string[];
  isAcceptable: boolean;
  correctionActions: string[];
  trend: 'IMPROVING' | 'WORSENING' | 'STABLE';
}
