/**
 * @module WMSDashboardTypes
 * @description Types, interfaces and Zod schemas for WMSDashboard.
 */

import { z } from "zod";

export interface WMSKPIs {
  totalMaterials: number;
  totalValue: number;
  lowStockCount: number;
  pendingReceipts: number;
  pendingTransfers: number;
  overdueReservations: number;
}

export interface MovementSummary {
  totalIn: number;
  totalOut: number;
  netChange: number;
  transactionCount: number;
}

export interface AlertData {
  lowStock: { id: number; name: string; kod: string; currentStock: number; minStock: number }[];
  lowStockCount: number;
  pendingQC: number;
  expiringBatches: number;
  overdueTasks: number;
}

export interface TopMaterial {
  materialId: number;
  name: string;
  kod: string;
  value: number;
  movement: number;
}

export const WarehouseSchema = z.object({
  name: z.string().min(1, "Ombor nomi majburiy"),
  code: z.string().min(1, "Kod majburiy").max(20, "Kod 20 belgidan oshmasin"),
  type: z.enum([
    "main", "raw_material", "finished_goods", "transit", "semi_finished",
    "defective", "quarantine", "tools_equipment", "household_mro", "mro", "production",
  ]),
});

export const RequestSchema = z.object({
  materialId: z.coerce.number().int().positive("Material ID musbat bo'lishi kerak"),
  quantity:   z.coerce.number().positive("Miqdor musbat bo'lishi kerak"),
  reason:     z.string().min(1, "Sabab majburiy"),
});

export type WarehouseFormData = z.infer<typeof WarehouseSchema>;
export type RequestFormData   = z.infer<typeof RequestSchema>;
