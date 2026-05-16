/**
 * @module WMSExtendedTypes
 * @description Interfaces, types, Zod schemas, and constants for WMSExtended.
 */

import { z } from "zod";
import type { LucideIcon } from "lucide-react";
import { Package, GitBranch, Layers, BarChart3, Home, QrCode } from "lucide-react";

import { tLabel } from '@/lib/i18n/tLabel';
// ─── Domain interfaces ────────────────────────────────────────────────────────

export interface StockItem {
  id: number | string;
  name?: string;
  materialName?: string;
  quantity?: number | string;
  currentStock?: number | string;
  minQuantity?: number;
  minStock?: number;
  location?: string;
  unit?: string;
  unitOfMeasure?: string;
  warehouseName?: string;
}

export interface WarehouseTransfer {
  id: number | string;
  fromWarehouse?: string;
  toWarehouse?: string;
  materialName?: string;
  quantity?: number | string;
  status?: string;
  createdAt?: string;
}

export interface LotRecord {
  id: number | string;
  batchNumber?: string;
  lotNumber?: string;
  name?: string;
  materialName?: string;
  quantity?: number | string;
  remainingQty?: number | string;
  expiryDate?: string;
  receivedDate?: string;
  location?: string;
  status?: string;
  supplierName?: string;
  supplier?: string;
  unit?: string;
}

export interface InternalReq {
  id: number | string;
  description?: string;
  requestedBy?: string;
  department?: string;
  reason?: string;
  status?: string;
  quantity?: number | string;
  materialName?: string;
}

export interface WarehouseOccupancy {
  id?: number | string;
  name?: string;
  used?: number;
  capacity?: number;
  occupancyRate?: number;
}

export interface OccupancyData {
  occupancyRate?: number;
  averageOccupancy?: number;
  warehouses?: WarehouseOccupancy[];
}

export interface RentalRecord {
  id: string;
  orderId?: string;
  clientName?: string;
  orderNumber?: string;
  areaM2?: number | string;
  startDate?: string;
  endDate?: string;
  dailyRate?: number | string;
  totalAmount?: number | string;
  billed?: boolean;
}

// ─── Zod schemas ──────────────────────────────────────────────────────────────

export const TransferSchema = z.object({
  fromWarehouse: z.string().min(1),
  toWarehouse: z.string().min(1),
  materialName: z.string().min(1),
  quantity: z.number().positive(),
});

export const InternalRequestSchema = z.object({
  department: z.string().min(1),
  materialName: z.string().min(1),
  quantity: z.number().positive(),
  reason: z.string().min(1),
});

export type TransferFormValues = z.infer<typeof TransferSchema>;
export type InternalRequestFormValues = z.infer<typeof InternalRequestSchema>;

// ─── Tab constants ────────────────────────────────────────────────────────────

export const URL_TAB_MAP: Record<string, string> = {
  "/wms/production-balance": "balance",
  "/wms/transfer": "transfer",
  "/wms/lot-traceability": "lot",
  "/wms/internal-requests": "requests",
  "/wms/kpi": "kpi",
  "/wms/rental": "rental",
};

export interface WmsTab {
  key: string;
  label: string;
  icon: LucideIcon;
}

export const WMS_TABS: WmsTab[] = [
  { key: "balance", label: "Material Balansi", icon: Package },
  { key: "transfer", label: tLabel('warehouse.WMSExtended.kochirish', "Ko'chirish"), icon: GitBranch },
  { key: "lot", label: "Lot Traceability", icon: QrCode },
  { key: "requests", label: tLabel('warehouse.WMSExtended.ichkiSorovlar', "Ichki So'rovlar"), icon: Layers },
  { key: "kpi", label: "KPI", icon: BarChart3 },
  { key: "rental", label: "Ijara", icon: Home },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const STATUS_CLASS_MAP: Record<string, string> = {
  active: "bg-green-100 text-[var(--ep-green)] dark:bg-green-950 dark:text-green-400",
  approved: "bg-green-100 text-[var(--ep-green)] dark:bg-green-950 dark:text-green-400",
  depleted: "bg-muted/40 text-muted-foreground dark:bg-slate-800 dark:text-muted-foreground",
  rejected: "bg-red-100 text-[var(--ep-red)] dark:bg-red-950 dark:text-red-400",
  pending: "bg-yellow-100 text-[var(--ep-yellow)] dark:bg-yellow-950 dark:text-yellow-400",
};

export const STATUS_LABEL_MAP: Record<string, string> = {
  active: "Faol",
  approved: "Tasdiqlangan",
  depleted: "Tugagan",
  rejected: "Rad etilgan",
  pending: "Kutilmoqda",
};
