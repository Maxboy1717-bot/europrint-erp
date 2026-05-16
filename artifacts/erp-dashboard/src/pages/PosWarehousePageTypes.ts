
import { tLabel } from '@/lib/i18n/tLabel';
/**
 * PosWarehousePageTypes — shared interfaces, types and constants
 * for the POS ↔ Warehouse integration page.
 */

export interface StockItem {
  id: number;
  warehouseId: number;
  warehouseCode: string;
  warehouseName: string;
  warehouseType: string;
  materialId: number;
  materialCode: string;
  materialName: string;
  materialNameRu: string;
  category: string;
  materialType: string;
  unit: string;
  quantity: string;
  reserved: string;
  available: string;
  minStock: string;
  maxStock: string;
  unitPrice: string;
  currency: string;
  stockStatus: 'OK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVER_STOCK';
}

export interface Warehouse {
  id: number;
  code: string;
  name: string;
  type: string;
}

export interface MovementHistory {
  id: number;
  materialId: number;
  materialName: string;
  movementType: string;
  quantity: string;
  unit: string;
  performedByName?: string;
  reason?: string;
  createdAt: string;
}

export interface MovementForm {
  movementType: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: string;
  reason: string;
  barcode: string;
}

export const MOVEMENT_FORM_DEFAULT: MovementForm = {
  movementType: "INTERNAL_ISSUE",
  fromWarehouseId: "",
  toWarehouseId: "",
  quantity: "",
  reason: "",
  barcode: "",
};

export const STOCK_STATUS_LABELS: Record<string, string> = {
  OK: "Yaxshi",
  LOW_STOCK: "Kam qoldi",
  OUT_OF_STOCK: "Tugadi",
  OVER_STOCK: "Ortiqcha",
};

export const STOCK_STATUS_COLORS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  OK: "secondary",
  LOW_STOCK: "outline",
  OUT_OF_STOCK: "destructive",
  OVER_STOCK: "default",
};

export const MOVEMENT_TYPES = [
  { value: "EXTERNAL_IN",       label: "Tashqi kirim",       requiresFrom: false, requiresTo: true  },
  { value: "EXTERNAL_OUT",      label: "Tashqi chiqim",      requiresFrom: true,  requiresTo: false },
  { value: "INTERNAL_ISSUE",    label: tLabel('warehouse.PosWarehousePage.bolimgaBerish', "Bo'limga berish"),    requiresFrom: true,  requiresTo: true  },
  { value: "INTERNAL_RETURN",   label: tLabel('warehouse.PosWarehousePage.qaytarish', "Qaytarish"),          requiresFrom: false, requiresTo: true  },
  { value: "INTERNAL_TRANSFER", label: tLabel('warehouse.PosWarehousePage.omborKochirish', "Ombor ko'chirish"),   requiresFrom: true,  requiresTo: true  },
  { value: "DAMAGE",            label: tLabel('warehouse.PosWarehousePage.zararAkti', "Zarar akti"),          requiresFrom: true,  requiresTo: false },
];
