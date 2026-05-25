/**
 * @module types
 * @description React UI component.
 */

import type { ComponentType } from "react";

export const fmtNum = (n: unknown) => parseFloat(String(n || 0)) || 0;

export const fmtQty = (n: unknown, unit = "") => {
  const v = fmtNum(n);
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K ${unit}`.trim();
  return `${v.toLocaleString("uz-UZ", { maximumFractionDigits: 2 })} ${unit}`.trim();
};

export const fmtMoney = (n: unknown, currency = "UZS") => {
  const v = fmtNum(n);
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B ${currency}`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M ${currency}`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K ${currency}`;
  return `${v.toLocaleString()} ${currency}`;
};

export const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

export interface BasicInfo {
  id: string;
  kod: string;
  xomAshyo: string;
  xomAshyoRu?: string | null;
  category?: string | null;
  unitOfMeasure: string;
  formatA?: string | null;
  formatB?: string | null;
  grammage?: string | null;
  supplierName?: string | null;
  minStock?: number;
  maxStock?: number;
  isActive?: boolean;
  materialType?: string | null;
  shelfLifeDays?: number | null;
  abcSegment?: string | null;
  lastPurchaseDate?: string | null;
  currentStock?: number;
  stockStatus?: string;
  description?: string | null;
}

export interface WarehouseRow {
  warehouseId: string;
  warehouseName: string;
  warehouseCode?: string | null;
  quantity: number;
  availableQuantity?: number;
  reservedQuantity?: number;
  lastUpdatedAt?: string | null;
}

export interface StockInfo {
  stockStatus?: string;
  totalQty?: number;
  totalAvailable?: number;
  totalReserved?: number;
  minStock?: number;
  maxStock?: number;
  stockValue?: number;
  reorderPoint?: number;
  daysRemaining?: number | null;
  reorderDate?: string | null;
  byWarehouse?: WarehouseRow[];
}

export interface MovementRow {
  id: string;
  transactionType: string;
  quantity: number;
  transactionDate?: string | null;
  balanceBefore?: number | null;
  balanceAfter?: number | null;
  documentNumber?: string | null;
}

export interface MovementsInfo {
  recent?: MovementRow[];
  monthlyTrend?: Array<{ month: string; totalIn?: number; totalOut?: number }>;
  last30Days?: { totalIn?: number; totalOut?: number; turnoverDays?: number | null };
}

export interface FinanceInfo {
  currentAvgPrice?: number;
  lastPurchasePrice?: number;
  currentStockValue?: number;
  monthlySpendAvg?: number;
  annualSpendEstimate?: number;
  currency?: string;
  priceTrend?: string;
  supplierName?: string | null;
  vendor?: Record<string, unknown> | null;
}

export interface SupplierRow {
  name: string;
  currentPrice?: number;
  lastPurchaseDate?: string | null;
  currency?: string | null;
}

export interface SuppliersInfo {
  primarySupplier?: SupplierRow | null;
  allSuppliers?: SupplierRow[];
}

export interface ProductionUsageInfo {
  avgDailyConsumption?: number;
  avgMonthlyConsumption?: number;
  daysRemaining?: number | null;
  currentReservations?: number;
  next30DaysDemand?: number;
  usedInProducts?: Array<{ productName: string; quantityPerUnit: number }>;
}

export interface ForecastInfo {
  daysRemaining?: number | null;
  reorderDateStatus?: string;
  stockoutDate?: string | null;
  reorderDate?: string | null;
  recommendedOrderQty?: number;
  recommendedSupplier?: string | null;
  estimatedCost?: number;
  currency?: string;
}

export interface StorageBatch {
  id: string;
  batchNumber: string;
  quantity?: number;
  expiryDate?: string | null;
  daysLeft?: number | null;
  urgency?: string;
}

export interface StorageInfo {
  expiringBatches?: StorageBatch[];
  count30Days?: number;
  count60Days?: number;
  fifoCompliance?: boolean;
}

export interface InventoryRecord {
  id?: string;
  countId?: string;
  countDate?: string | null;
  countNumber?: string | null;
  countStatus?: string;
  bookQuantity?: number;
  countedQuantity?: number;
  variance?: number;
}

export interface InventoryInfo {
  lastCountDate?: string | null;
  lastCountResult?: string | null;
  discrepancyAnalysis?: { totalLoss12m?: number; totalSurplus12m?: number } | null;
  history?: InventoryRecord[];
}

export interface QualityBatch {
  id: string;
  batchNumber: string;
  remainingQuantity: number;
  qcStatus: string;
  expiryDate?: string | null;
  createdAt?: string | null;
}

export interface QualityData {
  overallRating?: string;
  acceptanceRate?: number;
  totalBatches?: number;
  quarantineBatches?: number;
  /** On-time delivery rate (0–100). Null when backend has no data yet. */
  onTimeRate?: number | null;
  recentBatches?: QualityBatch[];
}

export interface Material360CardResponse {
  basic: BasicInfo;
  stock: StockInfo;
  movements: MovementsInfo;
  finance: FinanceInfo;
  suppliers: SuppliersInfo;
  productionUsage: ProductionUsageInfo;
  quality: QualityData | null;
  forecast: ForecastInfo;
  storage: StorageInfo;
  inventory: InventoryInfo;
}

export interface TabComponentProps {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  color?: string;
}
