/**
 * @module types
 * @description React UI component.
 */

import { z } from "zod";

export interface FinanceCategory {
  id: string;
  code: string;
  name: string;
  nameRu: string | null;
  categoryType: string;
  parentId: string | null;
  accountId: string | null;
  isSystem: boolean;
  isActive: boolean;
  color: string | null;
  icon: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface IncomeExpenseTransaction {
  id: string;
  transactionNumber: string;
  transactionDate: string;
  transactionType: string;
  categoryId: string | null;
  accountId: string | null;
  counterpartyType: string | null;
  counterpartyId: string | null;
  counterpartyName: string | null;
  amount: number;
  currency: string;
  exchangeRate: number;
  description: string | null;
  referenceType: string | null;
  referenceId: string | null;
  glDocumentId: string | null;
  status: string;
  createdBy: string | null;
  approvedBy: string | null;
  createdAt: string;
  postedAt: string | null;
}

export interface Summary {
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  transactionCount: number;
  period: { from: string; to: string };
}

export const transactionFormSchema = z.object({
  transactionType: z.enum(["income", "expense"]),
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida"),
  categoryId: z.string().optional(),
  counterpartyName: z.string().optional(),
  counterpartyType: z.string().optional(),
  amount: z.coerce.number().positive("Summa 0 dan katta bo'lishi kerak"),
  description: z.string().optional(),
  status: z.enum(["draft", "posted"]).default("draft"),
});

export type TransactionFormData = z.infer<typeof transactionFormSchema>;

export const categoryFormSchema = z.object({
  code: z.string().min(2, "Kod kamida 2 ta belgidan iborat bo'lishi kerak"),
  name: z.string().min(2, "Nom kamida 2 ta belgidan iborat bo'lishi kerak"),
  nameRu: z.string().optional(),
  categoryType: z.enum(["income", "expense"]),
  parentId: z.string().optional().nullable(),
  color: z.string().optional(),
  icon: z.string().optional(),
  sortOrder: z.coerce.number().default(0),
  isActive: z.boolean().default(true),
});

export type CategoryFormData = z.infer<typeof categoryFormSchema>;
