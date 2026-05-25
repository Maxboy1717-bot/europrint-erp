/**
 * @module types
 * @description React UI component.
 */

export interface WarehouseItem {
  id: string;
  code: string;
  name: string;
  nameRu: string | null;
  type: string;
  location: string | null;
  isActive: boolean;
}

export interface WarehouseStats {
  totalMaterials: number;
  totalQuantity: number;
  totalValue: number;
  lowStockItems: number;
}

export interface BarcodeItem {
  id: number;
  barcodeId: string;
  materialName: string;
  materialCode: string;
  quantity: number;
  actualWeight: number | null;
  unit: string;
  status: string;
  lotNumber: string | null;
  warehouseId: string | null;
  warehouseName: string | null;
  receivedDate: string;
}

export interface PickingTask {
  id: number;
  barcodeDbId: number;
  barcodeId: string;
  materialName: string;
  requestedQty: number;
  pickedQty: number | null;
  status: string;
  priority: string;
  createdAt: string;
}

export interface ExitLog {
  id: number;
  barcodeId: string;
  materialName: string;
  alertLevel: string;
  detectedWeight: number | null;
  expectedWeight: number | null;
  notes: string | null;
  createdAt: string;
}

export interface OperatorDebt {
  id: number;
  operatorId: string;
  operatorName: string;
  materialName: string;
  expectedQty: number;
  actualQty: number;
  variance: number;
  status: string;
}

export interface MaterialCardItem {
  id: number | string;
  code?: string;
  name?: string;
  unit?: string;
}

export interface StockItem {
  id: string;
  materialCardId: string;
  materialCode: string;
  materialName: string;
  unitOfMeasure: string;
  unitPrice: number;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  lastUpdatedAt: string;
  minStock: number;
  category: string;
  stockStatus: string;
}

export interface WarehouseStockData {
  warehouseId: string;
  totalItems: number;
  totalAvailable: number;
  totalReserved: number;
  items: StockItem[];
}

export interface RecentMovement {
  barcodeId?: string;
  materialName?: string;
  movementType?: string;
  quantity?: number;
  unit?: string;
  createdAt?: string;
}
