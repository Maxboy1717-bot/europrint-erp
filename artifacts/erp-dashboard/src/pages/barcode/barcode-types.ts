/**
 * @module barcode-types
 * @description React page component. Route-level UI.
 */

import { z } from "zod";

export interface BatchData {
  id: string;
  batchNumber: string;
  materialCardId: string | null;
  warehouseId: string | null;
  quantity: number;
  remainingQuantity: number;
  unitCost: number | null;
  productionDate: string | null;
  expiryDate: string | null;
  supplierId: string | null;
  supplierBatchNumber: string | null;
  goodsReceiptId: string | null;
  qcStatus: string | null;
  barcode: string | null;
  status: string | null;
  notes: string | null;
  createdAt: string;
  materialName?: string | null;
  materialCode?: string | null;
  warehouseName?: string | null;
}

export interface MaterialCard {
  id: string;
  kod: string;
  xomAshyo: string;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
}

export interface ScanResult {
  entityType: string;
  entityData: Record<string, unknown>;
  barcode: string;
  action?: string;
  suggestedActions: Record<string, { uz: string; ru: string; enabled: boolean }>;
  message: { uz: string; ru: string };
}

export interface BatchStats {
  activeBatches: number;
  expiringBatches: number;
  totalQuantity: number;
  totalValue: number;
}

export interface PrintData {
  type: string;
  id: string;
  batchNumber?: string;
  materialName: string;
  materialCode: string;
  warehouseName?: string;
  quantity?: number;
  remainingQuantity?: number;
  unitOfMeasure?: string;
  productionDate?: string;
  expiryDate?: string;
  barcode: string;
  barcodeDisplay: string;
  qrCode?: string;
  printedAt: string;
  labels: {
    uz: Record<string, string>;
    ru: Record<string, string>;
  };
}

export const batchFormSchema = z.object({
  batchNumber: z.string().min(1, "Partiya raqamini kiriting").max(100, "Partiya raqami 100 belgidan oshmasligi kerak"),
  materialCardId: z.string(),
  warehouseId: z.string(),
  quantity: z.number().min(0, "Miqdor 0 dan kam bo'lmasligi kerak"),
  remainingQuantity: z.number().min(0, "Qoldiq miqdor 0 dan kam bo'lmasligi kerak"),
  unitCost: z.number().min(0, "Narx 0 dan kam bo'lmasligi kerak"),
  productionDate: z.string(),
  expiryDate: z.string(),
  supplierBatchNumber: z.string().max(100, "Yetkazib beruvchi partiyasi 100 belgidan oshmasligi kerak"),
  qcStatus: z.string().min(1, "QC holatini tanlang"),
  status: z.string().min(1, "Statusni tanlang"),
  notes: z.string().max(1000, "Izoh 1000 belgidan oshmasligi kerak"),
});

export const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/20 text-green-400 border-green-500/40",
  depleted: "bg-gray-500/20 text-muted-foreground border-gray-500/40",
  blocked: "bg-red-500/20 text-red-400 border-red-500/40",
  expired: "bg-orange-500/20 text-orange-400 border-orange-500/40",
};

export const QC_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  approved: "bg-green-500/20 text-green-400 border-green-500/40",
  rejected: "bg-red-500/20 text-red-400 border-red-500/40",
};