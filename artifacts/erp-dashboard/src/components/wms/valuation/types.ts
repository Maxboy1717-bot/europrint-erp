export interface InventoryCount {
  id: string;
  countNumber: string;
  countDate: string;
  warehouseId: string | null;
  countType: string;
  status: string;
  totalItems: number;
  countedItems: number;
  varianceItems: number;
  totalBookValue: number;
  totalCountedValue: number;
  totalVariance: number;
  assignedTo: string | null;
  approvedBy: string | null;
  notes: string | null;
  createdAt: string;
  completedAt: string | null;
  approvedAt: string | null;
}

export interface InventoryCountLine {
  id: string;
  countId: string;
  materialId: string | null;
  productId: string | null;
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
}

export interface AssetInventoryItem {
  id: string;
  assetCode: string;
  assetName: string;
  assetNameRu: string | null;
  assetType: string;
  location: string | null;
  departmentId: string | null;
  responsibleId: string | null;
  purchaseDate: string | null;
  purchaseValue: number;
  currentValue: number;
  depreciationMethod: string;
  usefulLife: number | null;
  salvageValue: number;
  accumulatedDepreciation: number;
  condition: string;
  status: string;
  lastInventoryDate: string | null;
  serialNumber: string | null;
  notes: string | null;
}

export interface AssetSummary {
  totalAssets: number;
  totalPurchaseValue: number;
  totalCurrentValue: number;
  totalDepreciation: number;
  byType: Record<string, { count: number; value: number }>;
}

import { z } from "zod";

export const inventoryValuationCountSchema = z.object({
  countDate: z.string().min(1, "Sanani kiriting"),
  warehouseId: z.string().min(1, "Omborni tanlang"),
  countType: z.string().min(1, "Hisoblash turini tanlang"),
  notes: z.string().max(1000, "Izoh 1000 belgidan oshmasligi kerak"),
});

export const assetInventorySchema = z.object({
  assetCode: z.string().min(1, "Aktiv kodini kiriting").max(50, "Kod 50 belgidan oshmasligi kerak"),
  assetName: z.string().min(1, "Aktiv nomini kiriting").max(200, "Nom 200 belgidan oshmasligi kerak"),
  assetType: z.string().min(1, "Aktiv turini tanlang"),
  location: z.string().max(200, "Joylashuv 200 belgidan oshmasligi kerak"),
  purchaseDate: z.string(),
  purchaseValue: z.number().min(0, "Sotib olish qiymati 0 dan kam bo'lmasligi kerak"),
  currentValue: z.number().min(0, "Joriy qiymat 0 dan kam bo'lmasligi kerak"),
  usefulLife: z.number().min(1, "Foydalanish muddati kamida 1 yil").max(100, "Foydalanish muddati 100 yildan oshmasligi kerak"),
  salvageValue: z.number().min(0, "Qoldiq qiymat 0 dan kam bo'lmasligi kerak"),
  condition: z.string().min(1, "Holatni tanlang"),
  serialNumber: z.string().max(100, "Seriya raqami 100 belgidan oshmasligi kerak"),
  notes: z.string().max(1000, "Izoh 1000 belgidan oshmasligi kerak"),
});

export type InventoryValuationCountForm = z.infer<typeof inventoryValuationCountSchema>;
export type AssetInventoryForm = z.infer<typeof assetInventorySchema>;

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  nameRu: string | null;
  type: string;
  isActive: boolean;
}

export const countTypeLabels: Record<string, string> = {
  full: "To'liq",
  partial: "Qisman",
  cycle: "Davriy",
  spot: "Spot",
};

export const statusLabels: Record<string, string> = {
  draft: "Qoralama",
  planned: "Rejalashtirilgan",
  in_progress: "Jarayonda",
  completed: "Yakunlangan",
  approved: "Tasdiqlangan",
};

export const assetTypeLabels: Record<string, string> = {
  equipment: "Uskunalar",
  vehicle: "Transport",
  building: "Binolar",
  furniture: "Mebel",
  it_equipment: "IT uskunalar",
};

export const conditionLabels: Record<string, string> = {
  excellent: "A'lo",
  good: "Yaxshi",
  fair: "Qoniqarli",
  poor: "Yomon",
};

export const assetStatusLabels: Record<string, string> = {
  active: "Faol",
  disposed: "Chiqarilgan",
  under_repair: "Ta'mirda",
};
