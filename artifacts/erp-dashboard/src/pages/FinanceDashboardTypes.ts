/**
 * @module FinanceDashboardTypes
 * @description Shared interfaces, Zod schemas and type aliases for the Finance Dashboard.
 */

import { z } from "zod";

export interface PayrollPeriod {
  id: string;
  periodName: string;
  startDate: string;
  endDate: string;
  status: string;
  totalAmount: number | null;
  createdAt: string;
}

export interface PayrollRow {
  id: string;
  periodId: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  departmentId: string;
  workDays: number;
  baseSalary: number;
  bonuses: number;
  deductions: number;
  totalSalary: number;
  notes: string;
}

export interface Account {
  id: string;
  accountCode: string;
  accountName: string;
  accountNameRu: string;
  accountType: string;
  isActive: boolean;
}

export interface DashboardStats {
  payroll: {
    totalPeriods: number;
    openPeriods: number;
    closedPeriods: number;
    totalPaid: number;
  };
  gl: {
    totalDocuments: number;
    postedDocuments: number;
    draftDocuments: number;
  };
  accounts: {
    totalAccounts: number;
    assetAccounts: number;
    liabilityAccounts: number;
    equityAccounts: number;
    revenueAccounts: number;
    expenseAccounts: number;
  };
  receivables: number;
  payables: number;
  taxConstants: {
    INPS_RATE: number;
    JSHD_RATE: number;
    MIN_WAGE: number;
  };
}

export interface TrialBalanceData {
  asOfDate?: string;
  accounts?: { accountCode: string; accountName: string; debitBalance: number; creditBalance: number }[];
  totals?: { debitBalance?: number; creditBalance?: number };
}

export interface ProfitLossData {
  period?: { startDate: string; endDate: string };
  revenues?: { accountName: string; amount: number }[];
  expenses?: { accountName: string; amount: number }[];
  totalRevenue?: number;
  totalExpense?: number;
  netProfit?: number;
}

export interface FpCycleDay {
  day: number;
  key: string;
  label: string;
  labelRu?: string;
  event: string;
  color: string;
}

export interface FpCycleData {
  currentDay: number;
  activeCycle: FpCycleDay | null;
  weekStart: string;
  cycleDays: FpCycleDay[];
  pending: number;
  approvedTotal: number;
}

export const payrollPeriodSchema = z.object({
  periodName: z.string().min(1, "Davr nomi majburiy"),
  startDate: z.string().min(1, "Boshlanish sanasi majburiy"),
  endDate: z.string().min(1, "Tugash sanasi majburiy"),
});

export type PayrollPeriodFormData = z.infer<typeof payrollPeriodSchema>;
