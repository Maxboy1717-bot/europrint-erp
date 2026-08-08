/**
 * @module WarehouseDailyViewTypes
 * @description Types and constants for WarehouseDailyView page.
 */

export interface DailyOrder {
  id: string;
  papkaNo: string;
  mijozNomi: string;
  mahsulotNomi: string;
  tiraj: number;
  formatA: number;
  formatB: number;
  mahsulotTuri: string;
  status: string;
  kits: MaterialKit[];
  totalMaterials: number;
  preparedMaterials: number;
}

export interface MaterialKit {
  id: string;
  kitNumber: string;
  orderId: string;
  status: 'pending' | 'prepared' | 'delivered' | 'confirmed' | 'in_use' | 'completed' | 'preparing' | 'ready' | 'consumed';
  barcode: string;
  scheduledDate: string;
  scheduledTime: string;
  preparedBy: string | null;
  preparedAt: string | null;
  deliveredBy: string | null;
  deliveredAt: string | null;
  createdAt: string;
}

export interface MaterialKitItem {
  id: string;
  kitId: string;
  materialName: string;
  requiredQuantity: number;
  actualQuantity: number | null;
  unit: string;
  isScanned: boolean;
  scannedAt: string | null;
  itemBarcode: string;
}

export interface Equipment {
  id: string;
  equipmentNumber: string;
  name: string;
}

export const STATUS_COLORS: Record<string, { bg: string; text: string; labelKey: string }> = {
  pending: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-800 dark:text-yellow-200", labelKey: "WarehouseDailyView.kutilmoqda" },
  preparing: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-800 dark:text-blue-200", labelKey: "WarehouseDailyView.tayyorlanmoqda" },
  // audit 2026-08-06 T13.5: canonical DB vocabulary (material_kits_status_chk) —
  // 'preparing'/'ready' above are legacy display-only (pre-fix rows).
  prepared: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-800 dark:text-blue-200", labelKey: "WarehouseDailyView.statusPrepared" },
  ready: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-800 dark:text-green-200", labelKey: "WarehouseDailyView.statusReady" },
  delivered: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-800 dark:text-purple-200", labelKey: "WarehouseDailyView.statusDelivered" },
  confirmed: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-800 dark:text-emerald-200", labelKey: "WarehouseDailyView.tasdiqlangan" },
  consumed: { bg: "bg-muted/40 dark:bg-gray-900/30", text: "text-foreground dark:text-gray-200", labelKey: "WarehouseDailyView.statusConsumed" },
};
