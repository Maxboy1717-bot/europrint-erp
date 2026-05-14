/**
 * @module SupplyChainDashboardTypes
 * @description Interfaces, types, and constants for SupplyChainDashboard.
 */

export interface PurchaseOrder {
  id: string;
  po_number: string;
  vendor_name: string;
  order_date: string;
  delivery_date: string;
  status: string;
  total_amount: string;
  currency: string;
  received_amount: string;
  pending_amount: string;
  receipt_count: number;
}

export interface GoodsReceipt {
  id: string;
  grNumber: string;
  poId: string;
  vendorName: string;
  receiptDate: string;
  status: string;
  warehouseName: string;
  receivedBy: string;
}

export interface VendorInvoice {
  id: number;
  invoiceNumber: string;
  vendorId: string;
  purchaseOrderId: string | null;
  goodsReceiptId: string | null;
  invoiceDate: string;
  dueDate: string | null;
  totalAmount: string;
  currency: string;
  status: string;
  matchStatus: string;
  matchScore: string | null;
  priceVariance: string | null;
  vendorName: string | null;
}

export interface LineDeviation {
  lineRef: string;
  field: string;
  expected: number;
  actual: number;
  deviation: number;
}

export interface ThreeWayMatchResult {
  isMatched: boolean;
  matchStatus: "full_match" | "partial_match" | "mismatch" | "unmatched";
  poTotal: number;
  grTotal: number;
  invoiceTotal: number;
  quantityMatch: boolean;
  amountMatch: boolean;
  tolerance: number;
  priceVariance: number;
  quantityVariance: number;
  deviations: Array<{ field: string; expected: number; actual: number; deviation: number }>;
  lineDeviations?: LineDeviation[];
  poNumber?: string;
  grNumber?: string;
  invoiceNumber?: string;
}

export const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  pending: "bg-yellow-100 text-[var(--ep-yellow)]",
  approved: "bg-blue-100 text-[var(--ep-blue)]",
  sent: "bg-purple-100 text-[var(--ep-purple)]",
  partial: "bg-orange-100 text-[var(--ep-primary)]",
  received: "bg-green-100 text-[var(--ep-green)]",
  verified: "bg-teal-100 text-[var(--ep-cyan)]",
  posted: "bg-indigo-100 text-[var(--ep-blue)]",
  rejected: "bg-red-100 text-[var(--ep-red)]",
  paid: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-[var(--ep-red)]",
  full_match: "bg-green-100 text-[var(--ep-green)]",
  partial_match: "bg-orange-100 text-[var(--ep-primary)]",
  unmatched: "bg-gray-100 text-gray-600",
  mismatch: "bg-red-100 text-red-800",
};

export const STATUS_LABELS: Record<string, string> = {
  draft: "Qoralama",
  pending: "Kutilmoqda",
  approved: "Tasdiqlangan",
  sent: "Yuborilgan",
  partial: "Qisman",
  received: "Qabul qilindi",
  verified: "Tekshirildi",
  posted: "Kiritildi",
  rejected: "Rad etildi",
  paid: "To'landi",
  cancelled: "Bekor qilindi",
  full_match: "To'liq mos",
  partial_match: "Qisman mos",
  unmatched: "Tekshirilmagan",
  mismatch: "Farq bor",
};

export const INVOICE_NEXT_STATUS: Record<string, string | undefined> = {
  pending: "verified",
  verified: "approved",
  approved: "posted",
  posted: "paid",
};
