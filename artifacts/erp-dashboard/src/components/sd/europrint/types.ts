/**
 * @module types
 * @description React UI component.
 */

import { ComponentType } from "react";

export interface SdContact {
  id: string | number;
  name?: string;
  position?: string;
  phone?: string;
  email?: string;
  isPrimary?: boolean;
}

export interface SdOrderSummary {
  id: string | number;
  orderNumber: string;
  totalAmount: number;
  status: string;
}

export interface SdCustomer {
  id: string | number;
  name: string;
  stir?: string;
  segment: string;
  actualAddress?: string;
  legalAddress?: string;
  notes?: string;
  totalOrders?: number;
  totalRevenue?: number;
  contacts?: SdContact[];
  recentOrders?: SdOrderSummary[];
  creditLimit?: number;
}

export interface SdLead {
  id: string | number;
  status: string;
  contactName?: string;
  contactPhone?: string;
  source?: string;
  productInterest?: string;
  estimatedValue?: number;
}

export interface SdQuotationItem {
  id: string | number;
  description?: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  paperCost?: number;
  productionCost?: number;
  printCost?: number;
  dieCost?: number;
  deliveryCost?: number;
  costPrice?: number;
  margin?: number;
}

export interface SdQuotation {
  id: string | number;
  documentNumber?: string;
  quotationNumber?: string;
  customerId?: string | number;
  status?: string;
  totalAmount?: number;
  totalPrice?: number;
  margin?: number;
  validUntil?: string;
  notes?: string;
  paymentTerms?: string;
  createdAt?: string;
  items?: SdQuotationItem[];
}

export interface SdOrderTimeline {
  id?: string | number;
  status: string;
  changedAt?: string;
  createdAt?: string;
  note?: string;
}

export interface SdPayment {
  id: string | number;
  orderId?: string | number;
  customerId?: string | number;
  amount?: number;
  type?: string;
  status?: string;
  paidDate?: string;
  dueDate?: string;
  notes?: string;
  overdueDays?: number;
  "0-30"?: number;
  "31-60"?: number;
  "61-90"?: number;
  "90+"?: number;
  total?: number;
}

export interface SdOrder {
  id: string | number;
  orderNumber: string;
  status: string;
  totalAmount: number;
  deliveryDate?: string;
  deliveryAddress?: string;
  customerId?: string | number;
  customer?: SdCustomer;
  timeline?: SdOrderTimeline[];
  payments?: SdPayment[];
  advancePaid?: number;
  balanceDue?: number;
}

export interface SdTeamKpi {
  managerId?: string | number;
  totalSales?: number;
  ordersCount?: number;
}

export interface SdFunnelStage {
  status: string;
  count: number;
  totalValue?: number;
}

export interface SdPriceResult {
  totalPrice?: number;
  unitPrice?: number;
  paperCost?: number;
  productionCost?: number;
  printCost?: number;
  dieCost?: number;
  deliveryCost?: number;
  costPrice?: number;
  margin?: number;
  [key: string]: unknown;
}

export const fmt = (n: number) =>
  new Intl.NumberFormat("uz-UZ").format(Math.round(n || 0));

export const SEGMENT_LABELS: Record<string, string> = {
  vip: "VIP", regular: "Doimiy", new: "Yangi", potential: "Potentsial",
};

export const SEGMENT_COLORS: Record<string, string> = {
  vip: "bg-yellow-100 text-yellow-800", regular: "bg-blue-100 text-blue-800",
  new: "bg-green-100 text-green-800", potential: "bg-purple-100 text-purple-800",
};

export const LEAD_STATUS_LABELS: Record<string, string> = {
  new: "Yangi", working: "Ishlanmoqda", quoted: "Taklif yuborildi",
  negotiating: "Muzokaralar", won: "Yutildi", lost: "Yutqizildi", frozen: "Muzlatildi",
};

export const LEAD_STATUS_COLORS: Record<string, string> = {
  new: "bg-muted/40 text-foreground", working: "bg-blue-100 text-[var(--ep-blue)]",
  quoted: "bg-indigo-100 text-[var(--ep-blue)]", negotiating: "bg-amber-100 text-[var(--ep-yellow)]",
  won: "bg-green-100 text-[var(--ep-green)]", lost: "bg-red-100 text-[var(--ep-red)]",
  frozen: "bg-muted/40 text-foreground",
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  new: "Yangi", advance_pending: "Avans kutilmoqda", advance_paid: "Avans to'landi",
  design: "Dizaynda", technologist: "Texnologda", planned: "Rejada",
  production: "Ishlab chiqarishda", quality_check: "Sifat nazoratida",
  in_warehouse: "Omborga keldi", delivering: "Yetkazilmoqda",
  delivered: "Yetkazildi", closed: "Yopildi", cancelled: "Bekor qilindi",
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  new: "bg-muted/40 text-foreground", advance_pending: "bg-amber-100 text-[var(--ep-yellow)]",
  advance_paid: "bg-blue-100 text-[var(--ep-blue)]", design: "bg-purple-100 text-[var(--ep-purple)]",
  technologist: "bg-indigo-100 text-[var(--ep-blue)]", planned: "bg-cyan-100 text-[var(--ep-cyan)]",
  production: "bg-orange-100 text-[var(--ep-primary)]", quality_check: "bg-yellow-100 text-[var(--ep-yellow)]",
  in_warehouse: "bg-teal-100 text-[var(--ep-cyan)]", delivering: "bg-lime-100 text-[var(--ep-green)]",
  delivered: "bg-green-100 text-[var(--ep-green)]", closed: "bg-emerald-100 text-[var(--ep-green)]",
  cancelled: "bg-red-100 text-[var(--ep-red)]",
};

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-[var(--ep-yellow)]", paid: "bg-green-100 text-[var(--ep-green)]",
  overdue: "bg-red-100 text-[var(--ep-red)]", returned: "bg-muted/40 text-foreground",
};

export const SOURCE_LABELS: Record<string, string> = {
  phone: "Telefon", telegram: "Telegram", website: "Sayt", mobile: "Mobil ilova",
  instagram: "Instagram", exhibition: "Ko'rgazma", referral: "Tavsiya", other: "Boshqa",
};
