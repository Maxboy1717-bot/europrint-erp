/**
 * @module wms-types
 * @description React UI component.
 */

export interface MaterialBasic {
  kod?: string;
  xomAshyo?: string;
  xomAshyoRu?: string;
  category?: string;
  unitOfMeasure?: string;
  isActive?: boolean;
  formatA?: number;
  formatB?: number;
  grammage?: number;
  supplierName?: string;
  lastPurchaseDate?: string;
  description?: string;
  maxStock?: number;
  portret?: Record<string, unknown>;
}

export interface WarehouseStock {
  warehouseId?: string;
  warehouseName?: string;
  warehouseCode?: string;
  quantity?: number;
  availableQuantity?: number;
  reservedQuantity?: number;
  lastUpdatedAt?: string;
}

export interface StockData {
  totalQty?: number;
  totalAvailable?: number;
  totalReserved?: number;
  daysRemaining?: number | null;
  stockStatus?: string;
  reorderPoint?: number;
  maxStock?: number;
  reorderDate?: string;
  byWarehouse?: WarehouseStock[];
}

export interface MovementRecord {
  id?: string | number;
  transactionDate?: string;
  transactionType?: string;
  quantity?: number;
  balanceBefore?: number | null;
  balanceAfter?: number | null;
  documentNumber?: string;
}

export interface MonthlyTrendRecord {
  month?: string | number;
  totalIn?: number;
  totalOut?: number;
}

export interface MovementsData {
  recent?: MovementRecord[];
  monthlyTrend?: MonthlyTrendRecord[];
  last30Days?: {
    totalIn?: number;
    totalOut?: number;
    turnoverDays?: number | null;
  };
}

export interface FinanceData {
  currentAvgPrice?: number;
  lastPurchasePrice?: number;
  currentStockValue?: number;
  monthlySpendAvg?: number;
  annualSpendEstimate?: number;
  priceTrend?: string;
  currency?: string;
  supplierName?: string;
  vendor?: { city?: string };
}

export interface SupplierRecord {
  name?: string;
  currentPrice?: number;
  currency?: string;
  lastPurchaseDate?: string;
}

export interface SuppliersData {
  primarySupplier?: SupplierRecord;
  allSuppliers?: SupplierRecord[];
}

export interface ProductionUsageData {
  avgDailyConsumption?: number;
  avgMonthlyConsumption?: number;
  daysRemaining?: number | null;
  currentReservations?: number;
  next30DaysDemand?: number;
  usedInProducts?: unknown[];
}

export interface BatchRecord {
  id?: string | number;
  batchNumber?: string;
  remainingQuantity?: number;
  quantity?: number;
  qcStatus?: string;
  expiryDate?: string;
  createdAt?: string;
  daysLeft?: number | null;
  urgency?: string;
}

export interface QualityData {
  overallRating?: string;
  acceptanceRate?: number;
  totalBatches?: number;
  quarantineBatches?: number;
  recentBatches?: BatchRecord[];
}

export interface ForecastData {
  daysRemaining?: number | null;
  stockoutDate?: string;
  reorderDate?: string;
  reorderDateStatus?: string;
  recommendedOrderQty?: number;
  recommendedSupplier?: string;
  estimatedCost?: number;
  currency?: string;
}

export interface StorageData {
  count30Days?: number;
  count60Days?: number;
  fifoCompliance?: boolean;
  expiringBatches?: BatchRecord[];
}

export interface InventoryCountRecord {
  countId?: string | number;
  countDate?: string;
  countNumber?: string;
  bookQuantity?: number;
  countedQuantity?: number;
  variance?: number;
  countStatus?: string;
}

export interface InventoryData {
  lastCountDate?: string;
  lastCountResult?: string;
  discrepancyAnalysis?: {
    totalLoss12m?: number;
    totalSurplus12m?: number;
  };
  history?: InventoryCountRecord[];
}
