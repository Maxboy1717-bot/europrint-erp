/**
 * @module WasteTrackingTypes
 * @description Types, interfaces, Zod schemas, constants, and shared hook for WasteTracking.
 */

import { z } from "zod";
import { useTranslation } from "@/lib/i18n";

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface WasteByTypeItem {
  wasteType: string;
  totalQuantity: string | number;
  totalCost?: string | number;
}

export interface WasteByMachineItem {
  machineId: string | null;
  totalQuantity: string | number;
  totalCost: string | number;
}

export interface WasteDashboard {
  today?: { totalQuantity: string | number; recordCount: number };
  month?: { totalCost: string | number; totalQuantity: string | number };
  week?: { totalQuantity: string | number; recordCount: number };
  recyclable?: { totalQuantity: string | number; totalRecyclable: string | number; totalRecycled: string | number };
  byType?: WasteByTypeItem[];
  byMachine?: WasteByMachineItem[];
}

export interface WasteTrend {
  period: string;
  totalQuantity: string | number;
  totalCost: string | number;
}

export interface WasteRecord {
  id: string;
  date: string;
  wasteType: string;
  materialType: string | null;
  quantity: string | number;
  unit: string;
  totalCost: string | number | null;
  machineId: string | null;
  cause: string | null;
  shiftNumber: number | null;
}

export interface WasteCause {
  cause: string;
  recordCount: number;
  totalQuantity: string | number;
}

export interface WasteByMaterialItem {
  materialType: string;
  totalQuantity: string | number;
}

export interface WasteAnalysis {
  topCauses?: WasteCause[];
  recommendations?: string[];
  byType?: WasteByTypeItem[];
  byMaterial?: WasteByMaterialItem[];
}

export interface WasteTarget {
  id: string;
  targetType: string;
  period: string;
  maxWastePercentage: number;
  maxWasteCost: number | null;
  machineId: string | null;
  isActive: boolean;
}

export interface ChartDataItem {
  name: string;
  value: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const WASTE_TYPES = ["setup", "trim", "defect", "overrun", "material_defect", "other"] as const;
export const MATERIAL_TYPES = ["karton", "kraft", "qog'oz", "bo'yoq", "yelim"] as const;
export const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6"];

// ── Zod Schemas ───────────────────────────────────────────────────────────────

export const wasteRecordFormSchema = z.object({
  wasteType: z.enum(["setup", "trim", "defect", "overrun", "material_defect", "other"]),
  materialType: z.string().optional(),
  quantity: z.number().positive(),
  unit: z.string().default("kg"),
  costPerUnit: z.number().min(0).default(0),
  cause: z.string().optional(),
  correctionAction: z.string().optional(),
  shiftNumber: z.number().int().min(1).max(3).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().optional(),
  isRecyclable: z.boolean().default(false),
  recycledQuantity: z.number().min(0).default(0),
  machineId: z.string().optional(),
  operatorId: z.string().optional(),
  productionOrderId: z.string().optional(),
  orderId: z.string().optional(),
});

export const wasteTargetFormSchema = z.object({
  targetType: z.enum(["daily", "weekly", "monthly"]),
  machineId: z.string().optional(),
  materialType: z.string().optional(),
  maxWastePercentage: z.number().min(0).max(100),
  maxWasteCost: z.number().min(0).optional(),
  period: z.string().min(1),
  isActive: z.boolean().default(true),
});

// ── Shared Translation Hook ───────────────────────────────────────────────────

export function useWasteTranslations() {
  const { t } = useTranslation('production');
  const { t: tCommon } = useTranslation('common');
  const COMMON_KEYS = new Set(['save', 'cancel', 'date', 'notes', 'noData', 'unit']);
  return (key: string) => {
    if (key === 'title') return t('wasteTracking');
    if (COMMON_KEYS.has(key)) return tCommon(key);
    return t(key);
  };
}
