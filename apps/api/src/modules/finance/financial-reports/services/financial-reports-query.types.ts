/**
 * @module financial-reports-query.types
 * @description Shared report types for financial-reports query service (Rule 16 split).
 */

export interface CashSummary {
  totalInflow: number;
  totalOutflow: number;
  netCashFlow: number;
  openingBalance: number;
  closingBalance: number;
  date: string;
}

export interface WarehouseBalance {
  totalItems: number;
  totalQuantity: number;
  totalValue: number;
  averageValue30d: number;
  warehouseId?: number;
}

export interface AgingBucket {
  entityId?: number;
  entityName?: string;
  total: number;
  current: number;
  overdue30: number;
  overdue60: number;
  overdue90plus: number;
}

export interface BalanceSheet {
  totalAssets: number;
  currentAssets: number;
  nonCurrentAssets: number;
  totalLiabilities: number;
  currentLiabilities: number;
  nonCurrentLiabilities: number;
  equity: number;
  retainedEarnings: number;
  date: string;
}

export interface ProductionMetrics {
  plannedQuantity: number;
  actualQuantity: number;
  goodQuantity: number;
  scrapQuantity: number;
  efficiencyPct: number;
  scrapRatePct: number;
  downtimeMinutes: number;
  date: string;
}
