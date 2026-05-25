/**
 * @module WorkTabTypes
 * @description Shared TypeScript interfaces, form-shape types, and display
 * constants used across WorkTab and its sub-components.  No JSX lives here.
 */

import type { UseMutationResult } from "@tanstack/react-query";
import type {
  Employee,
  OrgStructureAssignment,
  EmploymentContract,
  SalaryHistoryRecord,
  TransferRecord,
  TranslationFn,
} from "./profile-types";

// ─── Re-export domain types so consumers have a single import point ───────────
export type {
  Employee,
  OrgStructureAssignment,
  EmploymentContract,
  SalaryHistoryRecord,
  TransferRecord,
  TranslationFn,
};

// ─── Form shapes ──────────────────────────────────────────────────────────────

export interface ContractForm {
  contractNumber: string;
  contractType: string;
  startDate: string;
  endDate: string;
  salary: string;
  workSchedule: string;
}

export interface SalaryForm {
  effectiveDate: string;
  previousSalary: string;
  newSalary: string;
  changeType: string;
  notes: string;
}

// ─── Main WorkTab prop surface ────────────────────────────────────────────────

export interface WorkTabProps {
  employee: Employee;
  t: TranslationFn & ((key: string) => string);
  tCommon: TranslationFn;
  orgStructureData:
    | { primary: OrgStructureAssignment; all: OrgStructureAssignment[] }
    | undefined;
  calculateWorkExperience: () => string;

  contractDialogOpen: boolean;
  setContractDialogOpen: (open: boolean) => void;
  contractForm: ContractForm;
  setContractForm: (form: ContractForm) => void;
  saveContractMutation: UseMutationResult<unknown, Error, ContractForm, unknown>;
  loadingContracts: boolean;
  contracts: EmploymentContract[] | undefined;

  salaryDialogOpen: boolean;
  setSalaryDialogOpen: (open: boolean) => void;
  salaryForm: SalaryForm;
  setSalaryForm: (form: SalaryForm) => void;
  saveSalaryChangeMutation: UseMutationResult<unknown, Error, SalaryForm, unknown>;
  loadingSalaryHistory: boolean;
  salaryHistory: SalaryHistoryRecord[] | undefined;

  transfers: TransferRecord[] | undefined;
}

// ─── Display constants (contract type colours + labels) ───────────────────────

export const CONTRACT_TYPE_COLORS: Record<string, string> = {
  indefinite: "bg-blue-100 text-blue-800",
  fixed_term: "bg-purple-100 text-purple-800",
  probation: "bg-orange-100 text-orange-800",
  project: "bg-teal-100 text-teal-800",
  seasonal: "bg-yellow-100 text-yellow-800",
  part_time: "bg-gray-100 text-gray-800",
};

/**
 * Build contract-type labels using translated strings for locale-sensitive
 * entries while keeping hard-coded Uzbek strings for fixed values.
 */
export function buildContractTypeLabels(
  t: TranslationFn
): Record<string, string> {
  return {
    indefinite: "Muddatsiz",
    fixed_term: "Muddatli",
    probation: "Sinov muddati",
    project: "Loyiha asosida",
    seasonal: t("seasonal"),
    part_time: t("partTime"),
  };
}

/**
 * Build salary change-type labels from translations.
 */
export function buildChangeTypeLabels(
  t: TranslationFn
): Record<string, string> {
  return {
    promotion: t("promotion"),
    annual_review: t("annualReview"),
    adjustment: t("adjustment"),
    probation_end: t("probationEnd"),
  };
}
