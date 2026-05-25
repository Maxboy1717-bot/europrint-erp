/** @module BudgetManagementTypes @description TypeScript interfaces, Zod schemas, type aliases and UI-label constants for the Budget Management feature. No JSX. */

import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import React from "react";

// ---------------------------------------------------------------------------
// Domain interfaces
// ---------------------------------------------------------------------------

export interface Budget {
  id: string;
  budgetName: string;
  fiscalYear: number;
  periodType: string;
  startDate: string;
  endDate: string;
  status: string;
  totalAmount: number;
  createdAt: string;
}

export interface BudgetLine {
  id: string;
  accountId: string | null;
  accountCode?: string;
  accountName?: string;
  costCenterId: string | null;
  costCenterName?: string;
  plannedAmount: number;
  actualAmount: number;
  varianceAmount: number | null;
  variancePercent: number | null;
  notes: string | null;
}

export interface BudgetDetail extends Budget {
  lines: BudgetLine[];
}

export interface VarianceData {
  lines: BudgetLine[];
  summary: {
    totalPlanned: number;
    totalActual: number;
    totalVariance: number;
    overBudgetCount: number;
    underBudgetCount: number;
  };
  byCategory: Array<{
    category: string;
    planned: number;
    actual: number;
    variance: number;
  }>;
}

export interface Account {
  id: string;
  accountCode: string;
  accountName: string;
  accountType: string;
}

export interface CostCenter {
  id: string;
  code: string;
  name: string;
}

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

export const budgetFormSchema = z.object({
  budgetName: z.string().min(3, "Byudjet nomi kamida 3 ta belgidan iborat bo'lishi kerak"),
  fiscalYear: z.coerce.number().int().min(2000).max(2100),
  periodType: z.enum(["annual", "quarterly", "monthly"]),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  totalAmount: z.coerce.number().nonnegative("Umumiy summa 0 yoki katta bo'lishi kerak"),
  status: z.enum(["draft", "approved", "active", "closed"]).default("draft"),
});

export const budgetLineFormSchema = z.object({
  accountId: z.string().min(1, "Hisob tanlang"),
  costCenterId: z.string().optional(),
  plannedAmount: z.coerce.number().nonnegative("Rejalashtirilgan summa 0 yoki katta bo'lishi kerak"),
  notes: z.string().optional(),
});

export type BudgetFormData = z.infer<typeof budgetFormSchema>;
export type BudgetLineFormData = z.infer<typeof budgetLineFormSchema>;

// ---------------------------------------------------------------------------
// Label maps
// ---------------------------------------------------------------------------

export const periodTypeLabels: Record<string, string> = {
  annual: "Yillik",
  quarterly: "Choraklik",
  monthly: "Oylik",
};

export const statusLabels: Record<string, string> = {
  draft: "Qoralama",
  approved: "Tasdiqlangan",
  active: "Faol",
  closed: "Yopilgan",
};

// ---------------------------------------------------------------------------
// Utility helpers (no heavy JSX — Badge is a simple inline component)
// ---------------------------------------------------------------------------

export function getStatusBadge(status: string): React.ReactElement {
  switch (status) {
    case "draft":
      return React.createElement(Badge, { className: "bg-muted/60 text-muted-foreground rounded-full px-2.5 py-0.5 text-xs font-semibold" }, "Qoralama");
    case "approved":
      return React.createElement(Badge, { className: "bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold" }, "Tasdiqlangan");
    case "active":
      return React.createElement(Badge, { className: "bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold" }, "Faol");
    case "closed":
      return React.createElement(Badge, { className: "bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold" }, "Yopilgan");
    default:
      return React.createElement(Badge, { variant: "outline" }, status);
  }
}

export function getVarianceColor(variance: number | null): string {
  if (variance === null) return "";
  if (variance > 0) return "text-[var(--ep-red)]";
  if (variance < 0) return "text-[var(--ep-green)]";
  return "";
}
