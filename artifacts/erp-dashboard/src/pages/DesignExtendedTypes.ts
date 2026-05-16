/**
 * @module DesignExtendedTypes
 * @description Types, constants, and static data for DesignExtended.
 */

import {
  BrainCircuit, Boxes, BookMarked, Scale, Layers,
  Hammer, Calculator, Library,
} from "lucide-react";

import { tLabel } from '@/lib/i18n/tLabel';
export interface DesignOrder {
  id: number;
  status?: string;
  title?: string;
  client?: string;
  papkaNo?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DesignTool {
  id: string;
  equipmentName: string;
  equipmentCode?: string;
  maintenanceType: string;
  status?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  location?: string;
}

export interface DesignTemplate {
  id: string;
  templateNumber?: string;
  name: string;
  description?: string;
  brandName?: string;
  category?: string;
  usageCount?: number;
}

export interface CostRow {
  component: string;
  hours?: number;
  quantity?: number;
  unit?: string;
  rate: number;
  total: number;
}

export interface BrandColor {
  name: string;
  hex: string;
  usage: string;
}

export const routeTabMap: Record<string, string> = {
  "/design/ai-review": "ai",
  "/design/3d-mockup": "3d",
  "/design/brand-guidelines": "brand",
  "/design/comparison": "compare",
  "/design/templates": "templates",
  "/design/tools": "tools",
  "/design/costing": "costing",
  "/design/library": "library",
};

export const tabMeta: Record<string, { title: string; icon: typeof BrainCircuit; description: string }> = {
  ai:        { title: "AI Tekshiruv",   icon: BrainCircuit, description: "Dizaynlarni AI yordamida avtomatik tekshirish" },
  "3d":      { title: "3D Mockup",      icon: Boxes,        description: "Quti va qadoqni 3D vizualizatsiya qilish" },
  brand:     { title: "Brend",          icon: BookMarked,   description: tLabel('common.DesignExtended.korporativBrendQoidalariVaRanglar', "Korporativ brend qoidalari va ranglar") },
  compare:   { title: tLabel('common.DesignExtended.taqqoslash', "Taqqoslash"),     icon: Scale,        description: "Dizayn variantlarini yonma-yon solishtirish" },
  templates: { title: tLabel('common.DesignExtended.qoliplar', "Qoliplar"),       icon: Layers,       description: "Tayyor qoliplar va standart o'lchamlar" },
  tools:     { title: tLabel('common.DesignExtended.asboblar', "Asboblar"),       icon: Hammer,       description: tLabel('common.DesignExtended.bosmaAsboblarVaPlastinalarInventari', "Bosma asboblar va plastinalar inventari") },
  costing:   { title: "Tannarx",        icon: Calculator,   description: tLabel('common.DesignExtended.dizaynXarajatKalkulyatori', "Dizayn xarajat kalkulyatori") },
  library:   { title: "Kutubxona",      icon: Library,      description: tLabel('common.DesignExtended.dizaynAssetVaFayllarKutubxonasi', "Dizayn asset va fayllar kutubxonasi") },
};

export const brandColors: BrandColor[] = [
  { name: "Asosiy rang", hex: "#1a4a8a", usage: "Logo, sarlavhalar, tugmalar" },
  { name: "Qo'shimcha", hex: "#f97316", usage: "Accent, highlight elementlar" },
  { name: "Fon", hex: "#f8fafc", usage: "Sahifa foni" },
  { name: "Matn", hex: "#0f172a", usage: "Asosiy matn" },
  { name: "Ikkilamchi matn", hex: "#64748b", usage: "Qo'shimcha matn" },
];

export const toolStatusMap: Record<string, string> = {
  scheduled: "Rejalashtirilgan",
  in_progress: "Jarayonda",
  completed: "Bajarilgan",
  overdue: "Kechikkan",
  cancelled: "Bekor qilingan",
};

export const defaultCostData: CostRow[] = [
  { component: "Disayner ish haqi", hours: 4, rate: 50000, total: 200000 },
  { component: "Plita bosish", quantity: 4, unit: "dona", rate: 120000, total: 480000 },
  { component: "Material sarfi", quantity: 2, unit: "m²", rate: 15000, total: 30000 },
  { component: "Korrektura", quantity: 1, unit: "marta", rate: 50000, total: 50000 },
];
