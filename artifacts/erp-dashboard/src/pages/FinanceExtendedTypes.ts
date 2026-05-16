/**
 * @module FinanceExtendedTypes
 * @description Types, interfaces, constants and helpers for FinanceExtended.
 */

import { z } from "zod";
import { type LucideIcon, Building2, ArrowLeftRight, CreditCard, Shield, FileText, Calendar, Brain } from "lucide-react";

import { tLabel } from '@/lib/i18n/tLabel';
export interface CostCenter {
  id: number | string;
  name?: string;
  code?: string;
  description?: string;
  budget?: number | string;
  spent?: number | string;
  status?: string;
}

export interface ProfitCenter {
  id: number | string;
  name?: string;
  code?: string;
  revenue?: number | string;
  expenses?: number | string;
}

export interface FinPayment {
  id: number | string;
  counterpartyName?: string;
  amount?: number | string;
  status?: string;
  paymentDate?: string;
  documentDate?: string;
  createdAt?: string;
  type?: string;
}

export interface GLDocument {
  id: number | string;
  docNumber?: string;
  description?: string;
  status?: string;
  amount?: number | string;
  debitAmount?: number | string;
  creditAmount?: number | string;
  postingDate?: string;
  documentDate?: string;
}

export interface TaxCalendarItem {
  id: string;
  name: string;
  taxCode: string;
  period: string;
  due: string;
  rate: string | number;
  status: string;
}

export const URL_TAB_MAP: Record<string, string> = {
  "/fi/cost-centers": "costcenters",
  "/fi/transfer-pricing": "profitcenters",
  "/fi/tax-management": "tax",
  "/fi/tax-calendar": "taxcal",
  "/fi/audit-log": "gldocs",
  "/fi/risk-ai": "risk",
};

export const tabMeta: Record<string, { title: string; icon: LucideIcon }> = {
  "costcenters":   { title: tLabel('common.FinanceExtended.xarajatMarkazlari', "Xarajat Markazlari"), icon: Building2 },
  "profitcenters": { title: "Transfer Narxlash",  icon: ArrowLeftRight },
  "payments":      { title: tLabel('common.FinanceExtended.tolovlar', "To'lovlar"),           icon: CreditCard },
  "gldocs":        { title: "Audit Jurnali",       icon: Shield },
  "tax":           { title: "Soliq Boshqaruvi",    icon: FileText },
  "taxcal":        { title: "Soliq Kalendar",      icon: Calendar },
  "risk":          { title: "AI Xavf Tahlili",     icon: Brain },
};

export const CostCenterSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  budget: z.string().min(1),
});

export function fmtMoney(val: unknown): string {
  const n = Number(val);
  if (!n) return "0 so'm";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M so'm`;
  return `${n.toLocaleString()} so'm`;
}
