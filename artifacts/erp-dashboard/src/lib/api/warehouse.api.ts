/**
 * Ombor konfiguratsiyasi FE client (BE: /api/pos/warehouse-config).
 * Config-driven: yangi ombor turi qo'shilsa, UI o'zi ko'rsatadi.
 */
import { apiRequest } from "@/lib/api-request";

export interface WarehouseType {
  code: string;
  nameUz: string;
  nameRu?: string;
  category: string;
  icon?: string;
  inboundFlow: string;
  outboundFlow: string;
  needsQuarantine: boolean;
  needsQc: boolean;
  unitBasis: string;
  labelTemplate: string;
  sortOrder: number;
  warehouseCount: number;
}

export interface WarehouseRow {
  id: string;
  code: string;
  name: string;
  nameRu?: string;
  type: string;
  location?: string;
  isActive?: boolean;
}

export interface WarehouseStockLine {
  id: number;
  materialId: number;
  kod: string | null;
  name: string;
  quantity: number;
  reserved: number;
  available: number;
  unit: string;
  lastUpdatedAt: string | null;
}

export interface WarehouseStock {
  warehouse: { id: number; code: string; name: string; nameRu?: string; type: string; location?: string };
  stock: WarehouseStockLine[];
  lineCount: number;
  totalQuantity: number;
}

export interface IssueStockInput {
  materialId: number;
  quantity: number;
  unit?: string;
  reason?: string;
  notes?: string;
}

export interface IssueStockResult {
  warehouseId: number;
  materialId: number;
  issued: number;
  newQuantity: number;
  newAvailable: number;
  movementId: number | null;
}

export interface MaterialMovement {
  id: number;
  movementType: string;
  quantity: number;
  unit: string | null;
  reason: string | null;
  notes: string | null;
  createdAt: string | null;
  performedByName: string | null;
}

export interface DashboardWarehouse {
  id: number;
  code: string;
  name: string;
  type: string;
  lineCount: number;
  totalQuantity: number;
  totalValue: number;
}

export interface DashboardMovement {
  id: number;
  materialId: number;
  materialName: string;
  movementType: string;
  quantity: number;
  unit: string | null;
  reason: string | null;
  createdAt: string | null;
  performedByName: string | null;
}

export interface WarehouseDashboard {
  totals: { warehouses: number; stockedWarehouses: number; stockLines: number; totalValue: number };
  warehouses: DashboardWarehouse[];
  recentMovements: DashboardMovement[];
}

const BASE = "/api/pos/warehouse-config";

export const warehouseApi = {
  /** Ombor turlari (config) + har turdagi ombor soni. */
  types: () => apiRequest<WarehouseType[]>("GET", `${BASE}/types`),
  /** Omborlar ro'yxati (ixtiyoriy tur filtri). */
  warehouses: (type?: string) =>
    apiRequest<WarehouseRow[]>("GET", `${BASE}/warehouses${type ? `?type=${encodeURIComponent(type)}` : ""}`),
  /** Bitta ombor qoldig'i (material kartochka bo'yicha joriy stok). */
  stock: (id: number | string) => apiRequest<WarehouseStock>("GET", `${BASE}/warehouses/${id}/stock`),
  /** Ombordan material chiqim (iste'mol/sarf) — qoldiqni kamaytiradi. */
  issue: (id: number | string, body: IssueStockInput) =>
    apiRequest<IssueStockResult>("POST", `${BASE}/warehouses/${id}/issue`, body),
  /** Material harakat tarixi (kirim/chiqim jurnali). */
  movements: (materialId: number | string) =>
    apiRequest<MaterialMovement[]>("GET", `${BASE}/materials/${materialId}/movements`),
  /** Moliya/Ombor umumiy dashboard (qoldiq + qiymat + so'nggi harakatlar). */
  dashboard: () => apiRequest<WarehouseDashboard>("GET", `${BASE}/dashboard`),
};
