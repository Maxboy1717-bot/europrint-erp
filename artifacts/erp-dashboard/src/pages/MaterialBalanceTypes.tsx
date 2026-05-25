/**
 * @module MaterialBalanceTypes
 * @description Shared TypeScript interfaces, API response shapes, and the
 * StatCard presentational component used across the Material Balance feature.
 */

export { StatCard, type StatCardProps } from "@/components/shared/StatCard";

// ---------------------------------------------------------------------------
// Domain interfaces
// ---------------------------------------------------------------------------

export interface Overview {
  totalMaterials: number;
  totalStockValue: number;
  lowStockAlerts: number;
  criticalStockCount: number;
}

export interface StockAlert {
  id: string;
  kod: string;
  xomAshyo: string;
  xomAshyoRu: string | null;
  currentStock: number;
  minStock: number;
  maxStock: number | null;
  unitOfMeasure: string;
  unitPrice: number | null;
  warehouseName: string | null;
  warehouseCode: string | null;
  severity: "critical" | "warning";
  deficit: number;
}

export interface AlertsResponse {
  success: boolean;
  data: StockAlert[];
  total: number;
  criticalCount: number;
  warningCount: number;
}

export interface InternalRequest {
  id: string;
  materialId: string;
  materialName: string;
  requestedBy: string;
  requesterName: string | null;
  quantity: number;
  unitOfMeasure: string;
  purpose: string | null;
  status: string;
  priority: string;
  requestedAt: string;
  approvedBy: string | null;
  approverName: string | null;
}

export interface InternalRequestsResponse {
  success: boolean;
  data: InternalRequest[];
  total: number;
}

export interface ProductionStock {
  materialId: string;
  kod: string;
  xomAshyo: string;
  currentStock: number;
  minStock: number;
  unitOfMeasure: string;
  unitPrice: number | null;
  warehouseName: string | null;
}

// ---------------------------------------------------------------------------
// MovementForm shape used by the dialog
// ---------------------------------------------------------------------------

export interface MovementForm {
  material: string;
  quantity: string;
  type: string;
}

