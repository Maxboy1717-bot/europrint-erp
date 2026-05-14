/** @module MROExtendedTypes @description TypeScript interfaces, Zod schemas, and constants for the MROExtended page. No JSX. */

import { z } from "zod";
import { Zap, Wrench, Package, DollarSign, Coffee, Shirt, Monitor, Sparkles, Leaf, Building2, type LucideIcon } from "lucide-react";

export interface MROEquipment {
  id: number | string;
  name?: string;
  type?: string;
  status?: string;
  location?: string;
  oee?: number | string;
  lastMaintenanceDate?: string;
}

export interface MRORequest {
  id: number | string;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  type?: string;
  assignedTo?: string | number;
  createdAt?: string;
  completedAt?: string;
  dueDate?: string;
  category?: string;
}

export interface MROItem {
  id: number | string;
  name?: string;
  code?: string;
  itemCode?: string;
  status?: string;
  category?: string;
  location?: string;
  quantity?: number;
  minQty?: number;
  unitPrice?: number | string;
  unit?: string;
  currentStock?: number;
  minStock?: number;
}

export interface MROBudget {
  id?: number | string;
  category?: string;
  usedAmount?: number | string;
  totalAmount?: number | string;
  budgetAmount?: number | string;
  spentAmount?: number | string;
  year?: number;
  month?: number;
}

export interface MROStats {
  completedThisMonth?: number;
  plannedThisMonth?: number;
  electricityToday?: number;
  gasToday?: number;
  waterToday?: number;
  budgets?: MROBudget[];
  [key: string]: unknown;
}

export interface UtilityReading {
  id?: number | string;
  utilityType?: string;
  unit?: string;
  monthBudget?: number | string;
  monthTotal?: number | string;
  trendPercent?: number | string;
}

// --- Zod Schemas ---

export const EquipSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  location: z.string().min(1),
  status: z.string().min(1),
  purchaseDate: z.string().optional(),
  warrantyExpiry: z.string().optional(),
});

export const RequestSchema = z.object({
  equipmentId: z.string().min(1),
  type: z.string().min(1),
  description: z.string().min(1),
  priority: z.string().min(1),
  assignedTo: z.string().optional(),
});

export const ItemSchema = z.object({
  itemCode: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  unit: z.string().min(1),
  quantity: z.number(),
  minQty: z.number(),
  location: z.string().optional(),
});

export type EquipFormValues = z.infer<typeof EquipSchema>;
export type RequestFormValues = z.infer<typeof RequestSchema>;
export type ItemFormValues = z.infer<typeof ItemSchema>;

// --- Route / Tab constants ---

export const URL_TAB_MAP: Record<string, string> = {
  "/mro/preventive": "preventive",
  "/mro/spare-parts": "spareparts",
  "/mro/utilities": "utilities",
  "/mro/expense-control": "expenses",
  "/mro/kitchen": "kitchen",
  "/mro/uniforms": "uniforms",
  "/mro/office-inventory": "office",
  "/mro/cleaning": "cleaning",
  "/mro/sanitation": "sanitation",
  "/mro/building-inventory": "building",
};

export const tabMeta: Record<string, { title: string; icon: LucideIcon }> = {
  preventive:  { title: "Profilaktika",        icon: Wrench   },
  spareparts:  { title: "Ehtiyot Qismlar",     icon: Package  },
  utilities:   { title: "Kommunal Xizmatlar",  icon: Zap      },
  expenses:    { title: "Xarajat Nazorati",    icon: DollarSign },
  kitchen:     { title: "Oshxona",             icon: Coffee   },
  uniforms:    { title: "Forma va Kiyim",      icon: Shirt    },
  office:      { title: "Ofis Inventari",      icon: Monitor  },
  cleaning:    { title: "Tozalash",            icon: Sparkles },
  sanitation:  { title: "Sanitariya",          icon: Leaf     },
  building:    { title: "Bino Inventari",      icon: Building2 },
};
