/**
 * @module CashFlowManagementTypes
 * @description Types, schema and constants for CashFlowManagement page.
 */

import { z } from "zod";

export interface CashFlowTransaction {
  id: string;
  transactionDate: string;
  transactionType: string;
  category: string;
  amount: number;
  bankAccountId: string | null;
  description: string | null;
  referenceType: string | null;
  referenceId: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface DailySummary {
  date: string;
  inflow: number;
  outflow: number;
  netFlow: number;
  transactionCount: number;
}

export interface CashForecast {
  currentBalance: number;
  expectedInflow: number;
  expectedOutflow: number;
  projectedBalance: number;
  forecastPeriod: string;
}

export interface BankAccount {
  id: string;
  accountNumber: string;
  bankName: string;
  bankNameRu: string | null;
  currency: string;
  accountType: string;
  balance: number;
  isActive: boolean;
}

export interface CashPositionData {
  accounts: BankAccount[];
  summary: {
    totalBalance: number;
    accountCount: number;
  };
  byCurrency: Array<{
    currency: string;
    total: number;
    accountCount: number;
  }>;
}

export const transactionFormSchema = z.object({
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  transactionType: z.enum(["inflow", "outflow"]),
  category: z.enum(["sales", "purchase", "salary", "tax", "loan", "other"]),
  amount: z.coerce.number().positive("Summa musbat bo'lishi kerak"),
  bankAccountId: z.string().optional(),
  description: z.string().optional(),
});

export type TransactionFormData = z.infer<typeof transactionFormSchema>;

export function formatShortCurrency(amount: number): string {
  if (amount >= 1000000000) return (amount / 1000000000).toFixed(1) + " mlrd";
  if (amount >= 1000000) return (amount / 1000000).toFixed(1) + " mln";
  if (amount >= 1000) return (amount / 1000).toFixed(0) + " ming";
  return amount.toString();
}

export const categoryLabels: Record<string, string> = {
  sales: "Sotuvlar",
  purchase: "Xaridlar",
  salary: "Oylik maosh",
  tax: "Soliqlar",
  loan: "Qarz/Kredit",
  other: "Boshqa",
};

export const typeLabels: Record<string, string> = {
  inflow: "Kirim",
  outflow: "Chiqim",
};
