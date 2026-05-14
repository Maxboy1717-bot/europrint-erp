/**
 * @module MaterialsAccountingTypes
 * @description TypeScript interfaces, types, and constants for MaterialsAccounting.
 */

export interface MaterialMovement {
  id: string;
  moveNumber: string;
  moveDate: string;
  moveType: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  reference: string;
  warehouseName: string;
  materialCode?: string;
  materialName?: string;
  batchLot?: string;
}

export interface InventoryItem {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  unitPrice: number;
  totalValue: number;
  warehouseName: string;
}

export interface InventoryValuationData {
  materials: InventoryItem[];
  summary: {
    totalItems: number;
    totalStock: number;
    totalValue: number;
  };
}

export interface OrderConsumption {
  orderId: string;
  orderNumber: string;
  customerName: string;
  materialsCount: number;
  totalValue: number;
  materials?: {
    materialCode: string;
    materialName: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
  }[];
}

export interface MovFormState {
  materialId: string;
  type: string;
  quantity: string;
  notes: string;
}

export const DEFAULT_MOV_FORM: MovFormState = {
  materialId: "",
  type: "incoming",
  quantity: "",
  notes: "",
};
