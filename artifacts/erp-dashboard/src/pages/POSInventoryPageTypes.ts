
import { tLabel } from '@/lib/i18n/tLabel';
/**
 * @module POSInventoryPageTypes
 * @description TypeScript interfaces, types, and constants for POSInventoryPage.
 */

export interface PosProduct {
  id: number;
  barcode: string;
  name: string;
  nameRu: string | null;
  category: string | null;
  unitPrice: number;
  unit: string;
  stockQuantity: number | null;
  minStock: number | null;
  isActive: boolean;
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  product_name: string;
  product_barcode: string;
  quantity: number;
  type: string;
  reason: string | null;
  before_qty: number;
  after_qty: number;
  performed_by_name: string | null;
  created_at: string;
}

export interface MonthlyRow {
  day: string;
  type: string;
  count: string;
  qty: string;
}

export interface ChartDataPoint {
  day: string;
  in: number;
  out: number;
  sale: number;
  adjustment: number;
}

export function formatUZS(amount: number): string {
  return new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 0 }).format(amount) + " so'm";
}

export const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  in: { label: "Kirim", color: "text-[var(--ep-green)]" },
  out: { label: "Chiqim", color: "text-[var(--ep-red)]" },
  adjustment: { label: "Tuzatish", color: "text-[var(--ep-blue)]" },
  sale: { label: tLabel('common.POSInventoryPage.sotuv', "Sotuv"), color: "text-[var(--ep-purple)]" },
  refund: { label: tLabel('common.POSInventoryPage.qaytarish', "Qaytarish"), color: "text-[var(--ep-primary)]" },
};

export const MOVEMENT_FILTER_OPTIONS = ["", "in", "out", "sale", "adjustment", "refund"] as const;
