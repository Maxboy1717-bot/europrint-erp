/**
 * @module MRODashboardTypes
 * @description Types, interfaces and Zod schemas for MRODashboard.
 */

import { z } from "zod";

// ── Domain interfaces ─────────────────────────────────────────────────────────
export interface MroItem {
  id: string;
  itemCode?: string;
  name?: string;
  category?: string;
  unit?: string;
  minStock?: number;
  currentStock?: number;
  unitCost?: number;
  isActive?: boolean;
}

export interface MroRequest {
  id: string;
  requestNumber?: string;
  status?: string;
  requestedQuantity?: number;
  purpose?: string;
  department?: string;
  item?: { name?: string };
  requester?: { fullName?: string };
}

export interface MroEquipment {
  id: string;
  equipmentName?: string;
  equipmentCode?: string;
  maintenanceType?: string;
  nextMaintenanceDate?: string;
  status?: string;
}

export interface MroStats {
  items?: { totalItems?: number; lowStockItems?: number };
  requests?: { status: string; count: number }[];
  equipment?: { status: string; count: number }[];
}

export interface MroBudget {
  id: string;
  name?: string;
  budgetAmount?: number;
  usedAmount?: number;
  period?: string;
}

export interface MroCleaningSchedule {
  id: string;
  area: string;
  frequency: string;
  lastCleaned: string | null;
  nextCleaning: string | null;
  responsible: string;
  status: string;
  notes: string | null;
}

export interface MroUtilityReading {
  id: string;
  utilityType?: string;
  unit?: string;
  readingDate?: string;
  todayValue?: number;
  yesterdayValue?: number;
  monthTotal?: number;
  monthBudget?: number;
  trendPercent?: number;
  notes?: string;
}

export interface MroFacility {
  id: string;
  name?: string;
  facilityType?: string;
  areaM2?: number;
  capacity?: number;
  status?: string;
  lastInspection?: string;
  nextInspection?: string;
  responsible?: string;
  notes?: string;
}

// ── Zod form schemas ──────────────────────────────────────────────────────────
export const mroItemFormSchema = z.object({
  itemCode:    z.string().min(1, "Kodni kiriting").max(50, "Kod 50 belgidan oshmasligi kerak"),
  name:        z.string().min(1, "Nomini kiriting").max(200, "Nom 200 belgidan oshmasligi kerak"),
  nameRu:      z.string().max(200, "Nom 200 belgidan oshmasligi kerak").optional().or(z.literal("")),
  category:    z.string().min(1, "Kategoriya tanlang"),
  unit:        z.string().min(1, "Birlikni kiriting").max(50, "Birlik 50 belgidan oshmasligi kerak"),
  minStock:    z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "Min zaxira 0 dan kam bo'lmasligi kerak"),
  currentStock:z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "Joriy zaxira 0 dan kam bo'lmasligi kerak"),
  unitCost:    z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "Narx 0 dan kam bo'lmasligi kerak"),
});

export const mroRequestFormSchema = z.object({
  itemId:            z.string().min(1, "Buyumni tanlang"),
  requestedQuantity: z.string().min(1, "Miqdorni kiriting").refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Miqdor musbat bo'lishi kerak"),
  purpose:           z.string().min(1, "Maqsadni kiriting").max(500, "Maqsad 500 belgidan oshmasligi kerak"),
  department:        z.string().min(1, "Bo'limni kiriting").max(200, "Bo'lim 200 belgidan oshmasligi kerak"),
});
