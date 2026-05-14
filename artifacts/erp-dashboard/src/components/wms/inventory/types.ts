/**
 * @module types
 * @description React UI component.
 */

import { z } from "zod";

export interface InventoryCountLineData {
  id: string;
  countId: string;
  materialId: string | null;
  materialCode: string | null;
  materialName: string | null;
  itemType: string;
  bookQuantity: number;
  countedQuantity: number | null;
  variance: number | null;
  variancePercent: number | null;
  unitCost: number;
  bookValue: number;
  countedValue: number | null;
  valueVariance: number | null;
  reason: string | null;
  countedBy: string | null;
  countedAt: string | null;
  createdAt: string;
}

export interface InventoryCountData {
  id: string;
  countNumber: string;
  countDate: string;
  warehouseId: string | null;
  warehouseName: string | null;
  countType: string;
  status: string;
  totalItems: number;
  countedItems: number;
  varianceItems: number;
  totalBookValue: number;
  totalCountedValue: number;
  totalVariance: number;
  assignedTo: string | null;
  assignedToName: string | null;
  notes: string | null;
  createdAt: string;
  completedAt: string | null;
  approvedAt: string | null;
  lines?: InventoryCountLineData[];
}

export interface StatsData {
  totalThisMonth: number;
  completed: number;
  withVariances: number;
  totalVarianceValue: number;
}

export interface WarehouseData {
  id: string;
  name: string;
  code: string;
}

export interface UserData {
  id: string;
  fullName: string;
}

export const inventoryCountFormSchema = z.object({
  countDate: z.string().min(1, "Sanani kiriting"),
  warehouseId: z.string().min(1, "Omborni tanlang"),
  countType: z.string().min(1, "Hisoblash turini tanlang"),
  assignedTo: z.string().optional().or(z.literal("")),
  notes: z.string().max(1000, "Izoh 1000 belgidan oshmasligi kerak").optional().or(z.literal("")),
});

export type InventoryCountFormValues = z.infer<typeof inventoryCountFormSchema>;

export const STATUS_COLORS: Record<string, string> = {
  planned: "bg-gray-500/20 text-muted-foreground border-gray-500/40",
  in_progress: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  completed: "bg-green-500/20 text-green-400 border-green-500/40",
  approved: "bg-purple-500/20 text-purple-400 border-purple-500/40",
};
