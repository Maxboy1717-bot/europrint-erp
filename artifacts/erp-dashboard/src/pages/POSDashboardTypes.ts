/**
 * @module POSDashboardTypes
 * @description TypeScript interfaces, shared types, constants, and utility
 * functions for the POS Dashboard feature. No JSX — pure TypeScript.
 */

import { Banknote, CreditCard, Smartphone } from "lucide-react";

import { tLabel } from '@/lib/i18n/tLabel';
// ---------------------------------------------------------------------------
// Domain interfaces
// ---------------------------------------------------------------------------

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
  imageUrl: string | null;
}

export interface CartItem {
  productId: number;
  barcode: string;
  name: string;
  nameRu: string | null;
  quantity: number;
  unitPrice: number;
  unit: string;
  total: number;
  stockQuantity: number | null;
}

// ---------------------------------------------------------------------------
// API response shapes
// ---------------------------------------------------------------------------

export interface DailySaleSummary {
  saleCount: number;
  totalRevenue: number;
  avgSale: number;
  totalDiscounts: number;
}

export interface DailySaleRow {
  id: string;
  sale_number: string;
  cashier_name: string;
  customer_name: string;
  total: number;
  payment_method: string;
  created_at: string;
}

export interface PaymentMethodRow {
  payment_method: string;
  count: string;
  total: string;
}

export interface MonthlySummaryRow {
  day: string;
  sale_count: string;
  total: string;
}

export interface DailyData {
  summary: DailySaleSummary;
  byPaymentMethod: PaymentMethodRow[];
  sales: DailySaleRow[];
  monthlySummary: MonthlySummaryRow[];
}

// ---------------------------------------------------------------------------
// Receipt / last-sale snapshot
// ---------------------------------------------------------------------------

export interface LastSale {
  saleNumber: string;
  total: number;
  items: CartItem[];
  paymentMethod: string;
  customerName: string;
  createdAt: string;
  isOffline?: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const PAYMENT_METHODS = [
  { key: "cash",     label: "Naqd",     icon: Banknote    },
  { key: "card",     label: "Karta",    icon: CreditCard  },
  { key: "transfer", label: tLabel('common.POSDashboard.otkazma', "O'tkazma"), icon: Smartphone  },
] as const;

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

/** Format a number as Uzbek Sum currency string. */
export function formatUZS(amount: number): string {
  return (
    new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 0 }).format(amount) +
    " so'm"
  );
}
