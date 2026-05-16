
import { tLabel } from '@/lib/i18n/tLabel';
/**
 * @module WarehouseRentalTypes
 * @description Shared TypeScript interfaces, constants, and pure helper
 * utilities for the Warehouse Rental feature. No JSX — safe to import from
 * both `.tsx` and `.ts` files.
 */

// ─── Domain Interfaces ────────────────────────────────────────────────────────

export interface RentalRecord {
  id: string;
  recordNumber: string;
  orderNumber?: string;
  productName: string;
  managerName?: string;
  customerName?: string;
  warehouseName?: string;
  areaM2: number;
  admittedDate: string;
  freeDays: number;
  dailyRatePerM2: number;
  totalDays: number;
  billableDays: number;
  totalAmount: number;
  excludeWeekends: boolean;
  status: "active" | "closed" | "paid";
  notifiedAt?: string;
  closedDate?: string;
  notes?: string;
  createdAt: string;
}

export interface RentalSummary {
  activeCount: number;
  overdueCount: number;
  totalActiveAmount: number;
  totalPaidAmount: number;
  totalClosedAmount: number;
  overdueRecords: RentalRecord[];
}

export interface RentalSettings {
  id?: string;
  defaultFreeDays: number;
  defaultDailyRatePerM2: number;
  excludeWeekends: boolean;
  customRates: CustomRate[];
}

export interface CustomRate {
  managerId: string;
  managerName: string;
  dailyRate: number;
  freeDays: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const DEFAULT_WAREHOUSE_NAME = "Tayyor mahsulot ombori";
export const DEFAULT_FREE_DAYS = 8;
export const DEFAULT_DAILY_RATE_PER_M2 = 500;

export const STATUS_FILTER_OPTIONS = [
  { value: "", label: "Barchasi" },
  { value: "active", label: "Aktiv" },
  { value: "closed", label: tLabel('warehouse.WarehouseRental.yopilgan', "Yopilgan") },
  { value: "paid", label: "To'langan" },
] as const;

// ─── Pure Helpers ─────────────────────────────────────────────────────────────

/**
 * Formats a numeric amount as Uzbek soʻm with locale-aware thousand separators.
 */
export const formatMoney = (n: number): string =>
  new Intl.NumberFormat("uz-UZ").format(Math.round(n)) + " so'm";
