/**
 * @module warehouse-kpi.types
 * @description Shared types for warehouse KPI (service + repository).
 *   Extracted to break the cyclic dependency.
 * @layer Types (POS)
 */

export interface WarehouseKpi {
  warehouseId:        number;
  warehouseCode:      string;
  warehouseName:      string;
  warehouseType:      string;
  totalMaterials:     number;
  totalQuantity:      number;
  totalValue:         number;
  lowStockCount:      number;
  outOfStockCount:    number;
  movementsToday:     number;
  movementsThisWeek:  number;
  pendingApprovals:   number;
  employeeCount:      number;
  primaryUnit:        string;
  units: Array<{ unit: string; count: number; quantity: number }>;
}

export interface SystemKpi {
  totalWarehouses:    number;
  totalMaterials:     number;
  totalStockValue:    number;
  lowStockAlerts:     number;
  pendingMovements:   number;
  qcPending:          number;
  todayMovements:     number;
  weeklyMovements:    number;
  monthlyMovements:   number;
  topWarehouses:      Array<{ code: string; name: string; valueShare: number }>;
  movementsByType:    Array<{ type: string; count: number; label: string }>;
}
