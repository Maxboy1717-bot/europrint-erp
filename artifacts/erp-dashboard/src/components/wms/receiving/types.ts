/**
 * @module types
 * @description React UI component.
 */

import { z } from "zod";

export interface GoodsReceipt {
  id: string;
  receiptNumber: string;
  receiptDate: string;
  supplierId?: string;
  supplierName?: string;
  warehouseId?: string;
  warehouseName?: string;
  purchaseOrderId?: string;
  status: string;
  totalItems: number;
  totalValue: number;
  qcRequiredItems: number;
  qcPassedItems: number;
  notes?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  createdAt: string;
  receivedAt?: string;
  lines?: GoodsReceiptLine[];
}

export interface GoodsReceiptLine {
  id: string;
  receiptId: string;
  materialCardId?: string;
  materialName?: string;
  materialCode?: string;
  unitOfMeasure?: string;
  orderedQuantity?: number;
  receivedQuantity: number;
  acceptedQuantity?: number;
  rejectedQuantity: number;
  unitCost: number;
  totalCost: number;
  batchNumber?: string;
  expiryDate?: string;
  qcStatus: string;
  qcNotes?: string;
  qcDate?: string;
  binId?: string;
  binCode?: string;
}

export interface Vendor {
  id: string;
  vendorCode: string;
  name: string;
  nameRu?: string;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  nameRu?: string;
}

export interface MaterialCard {
  id: string;
  kod: string;
  xomAshyo: string;
  unitOfMeasure: string;
  unitPrice?: number;
}

export interface WarehouseBin {
  id: string;
  binCode: string;
  zoneId: string;
}

export const goodsReceiptFormSchema = z.object({
  receiptNumber: z.string(),
  receiptDate: z.string().min(1, "Sanani kiriting"),
  warehouseId: z.string().min(1, "Omborni tanlang"),
  supplierId: z.string().min(1, "Yetkazib beruvchini tanlang"),
  supplierName: z.string(),
  invoiceNumber: z.string().max(100, "Hisob-faktura raqami 100 belgidan oshmasligi kerak"),
  invoiceDate: z.string(),
  notes: z.string().max(1000, "Izoh 1000 belgidan oshmasligi kerak"),
});

export const goodsReceiptLineSchema = z.object({
  materialCardId: z.string().min(1, "Materialni tanlang"),
  orderedQuantity: z.number().min(0, "Buyurtma miqdori 0 dan kam bo'lmasligi kerak"),
  receivedQuantity: z.number().min(1, "Qabul qilingan miqdorni kiriting"),
  unitCost: z.number().min(0, "Narx 0 dan kam bo'lmasligi kerak"),
  batchNumber: z.string().max(100, "Partiya raqami 100 belgidan oshmasligi kerak"),
  expiryDate: z.string(),
  binId: z.string(),
});

export const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-500/20 text-muted-foreground border-gray-500/40",
  pending_qc: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  qc_passed: "bg-green-500/20 text-green-400 border-green-500/40",
  qc_failed: "bg-red-500/20 text-red-400 border-red-500/40",
  received: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  cancelled: "bg-gray-500/20 text-muted-foreground border-gray-500/40",
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  passed: "bg-green-500/20 text-green-400 border-green-500/40",
  failed: "bg-red-500/20 text-red-400 border-red-500/40",
  not_required: "bg-gray-500/20 text-muted-foreground border-gray-500/40",
};
