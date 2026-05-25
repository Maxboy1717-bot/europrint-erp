/**
 * @module @workspace/types/analytics
 * @description Canonical analytics/dashboard types — single source of truth.
 *   Previously scattered across 15+ components (Dashboard, KPI, WmsInventory, etc.)
 */

// ── Dashboard KPI ─────────────────────────────────────────────────────────────
export interface DashboardKpi {
  label: string;
  value: string | number;
  unit?: string;
  trend?: number;
  trendLabel?: string;
  icon?: string;
  color?: string;
  [key: string]: unknown;
}

// ── Dashboard Data ────────────────────────────────────────────────────────────
export interface DashboardData {
  kpis?: DashboardKpi[];
  revenue?: number;
  orders?: number;
  employees?: number;
  production?: number;
  period?: string;
  [key: string]: unknown;
}

// ── WMS Inventory Item ────────────────────────────────────────────────────────
export interface WmsInventoryItem {
  id: string | number;
  materialId?: number;
  materialCode?: string | null;
  materialName?: string;
  name?: string;
  category?: string | null;
  unitOfMeasure?: string | null;
  warehouseId?: number | null;
  warehouseName?: string | null;
  quantityOnHand?: number;
  totalStock?: number;
  stockValue?: number;
  minStock?: number | null;
  maxStock?: number | null;
  unitCost?: number | null;
  isActive?: boolean;
  [key: string]: unknown;
}

// ── Finance KPI ───────────────────────────────────────────────────────────────
export interface FinanceKpi {
  totalRevenue?: number;
  totalExpenses?: number;
  netProfit?: number;
  grossMargin?: number;
  accountsReceivable?: number;
  accountsPayable?: number;
  cashBalance?: number;
  period?: string;
  currency?: string;
  [key: string]: unknown;
}

// ── Production KPI ────────────────────────────────────────────────────────────
export interface ProductionKpi {
  ordersTotal?: number;
  ordersCompleted?: number;
  ordersPending?: number;
  efficiency?: number;
  defectRate?: number;
  outputUnits?: number;
  period?: string;
  [key: string]: unknown;
}

// ── Pagination Response ───────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page?: number;
  limit?: number;
  hasMore?: boolean;
}

// ── API Response wrapper ──────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusCode?: number;
}
