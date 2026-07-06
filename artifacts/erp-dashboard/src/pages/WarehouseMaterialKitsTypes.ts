/**
 * @module WarehouseMaterialKitsTypes
 * @description Types and constants for WarehouseMaterialKits page.
 */

import { Package, Palette, Droplets, Layers, Scissors, Sparkles, Box } from "lucide-react";

export interface PapkaOrder {
  id: number;
  papkaNo: string;
  zakaz: string;
  naimenovanie: string;
  tiraj: number;
  formatA: number;
  formatB: number;
  status: string;
  prioritet: number;
  createdAt: string;
}

export interface MaterialKit {
  id: number;
  orderId: number;
  kitNumber: string;
  status: string;
  preparedBy: string | null;
  preparedAt: string | null;
  deliveredBy: string | null;
  deliveredAt: string | null;
  barcode: string | null;
  notes: string | null;
  createdAt: string;
  order?: PapkaOrder;
}

export interface MaterialKitItem {
  id: number;
  kitId: number;
  materialType: string;
  materialName: string;
  plannedQuantity: number;
  actualQuantity: number | null;
  unit: string;
  isScanned: boolean;
  scannedAt: string | null;
  barcode: string | null;
}

export const MATERIAL_ICONS: Record<string, typeof Package> = {
  kraska: Palette,
  kley: Droplets,
  skotch: Layers,
  ip: Scissors,
  tozalash: Sparkles,
  begovka: Box,
};

export const MATERIAL_COLORS: Record<string, string> = {
  kraska: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  kley: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  skotch: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  ip: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  tozalash: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  begovka: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

export const STATUS_BADGES: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; labelKey: string }> = {
  pending: { variant: "secondary", labelKey: "WarehouseMaterialKits.kutilmoqda" },
  preparing: { variant: "default", labelKey: "WarehouseMaterialKits.tayyorlanmoqda" },
  ready: { variant: "outline", labelKey: "WarehouseMaterialKits.statusReady" },
  delivered: { variant: "default", labelKey: "WarehouseMaterialKits.statusDelivered" },
  consumed: { variant: "secondary", labelKey: "WarehouseMaterialKits.statusConsumed" },
};
