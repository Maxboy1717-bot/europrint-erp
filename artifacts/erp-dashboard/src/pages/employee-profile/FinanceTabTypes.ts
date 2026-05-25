/** @module FinanceTabTypes @description TypeScript interfaces, form types, and label constants for the FinanceTab feature. No JSX. */

import type { BonusRecord, FineRecord, OvertimeRecord, CashAdvanceRecord, SalaryHistoryRecord, TranslationFn } from "./profile-types";
import type { UseMutationResult } from "@tanstack/react-query";

import { tLabel } from '@/lib/i18n/tLabel';
export interface SalaryBenchmark {
  employeeSalary: number;
  departmentAvg: number | null;
  departmentMax: number | null;
  departmentName: string | null;
}

export type BonusForm = {
  paymentDate: string;
  amount: string;
  bonusType: string;
  description: string;
};

export type FineForm = {
  fineDate: string;
  amount: string;
  fineType: string;
  description: string;
  deductedFromSalary: boolean;
};

export type OvertimeForm = {
  workDate: string;
  hours: string;
  hourlyRate: string;
  multiplier: string;
  reason: string;
};

export type CashAdvanceForm = {
  requestDate: string;
  amount: string;
  reason: string;
  status: string;
};

export interface FinanceTabProps {
  tCommon: TranslationFn;
  userId?: string;
  baseSalary?: number;
  salaryType?: string;
  salaryHistory?: SalaryHistoryRecord[];
  bonusDialogOpen: boolean;
  setBonusDialogOpen: (open: boolean) => void;
  bonusForm: BonusForm;
  setBonusForm: (form: BonusForm) => void;
  saveBonusMutation: UseMutationResult<unknown, Error, any, unknown>;
  loadingBonuses: boolean;
  bonuses: BonusRecord[] | undefined;
  fineDialogOpen: boolean;
  setFineDialogOpen: (open: boolean) => void;
  fineForm: FineForm;
  setFineForm: (form: FineForm) => void;
  saveFineMutation: UseMutationResult<unknown, Error, any, unknown>;
  loadingFines: boolean;
  fines: FineRecord[] | undefined;
  overtimeDialogOpen: boolean;
  setOvertimeDialogOpen: (open: boolean) => void;
  overtimeForm: OvertimeForm;
  setOvertimeForm: (form: OvertimeForm) => void;
  saveOvertimeMutation: UseMutationResult<unknown, Error, any, unknown>;
  loadingOvertime: boolean;
  overtime: OvertimeRecord[] | undefined;
  cashAdvanceDialogOpen: boolean;
  setCashAdvanceDialogOpen: (open: boolean) => void;
  cashAdvanceForm: CashAdvanceForm;
  setCashAdvanceForm: (form: CashAdvanceForm) => void;
  saveCashAdvanceMutation: UseMutationResult<unknown, Error, any, unknown>;
  loadingCashAdvances: boolean;
  cashAdvances: CashAdvanceRecord[] | undefined;
}

export const BONUS_TYPE_LABELS: Record<string, string> = {
  performance: "Samaradorlik",
  annual: "Yillik",
  holiday: "Bayram",
  project: "Loyiha",
  other: "Boshqa",
};

export const FINE_TYPE_LABELS: Record<string, string> = {
  late: "Kechikish",
  absence: "Ishga kelmaslik",
  damage: "Zarar",
  quality: "Sifat",
  safety: "Xavfsizlik",
  other: "Boshqa",
};

export const CASH_ADVANCE_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: tLabel('common.FinanceTab.kutilmoqda', "Kutilmoqda"), color: "bg-yellow-500" },
  approved: { label: tLabel('common.FinanceTab.tasdiqlangan', "Tasdiqlangan"), color: "bg-green-500" },
  rejected: { label: "Rad etilgan", color: "bg-red-500" },
  paid: { label: tLabel('common.FinanceTab.tolangan', "To'langan"), color: "bg-blue-500" },
};

export const SALARY_TYPE_LABEL: Record<string, string> = {
  ishbay: "Ishbay (dona × tarif)",
  soatbay: "Soatbay (soat × tarif)",
  oylik: "Oylik (bazaviy ± qo'shimchalar)",
};
