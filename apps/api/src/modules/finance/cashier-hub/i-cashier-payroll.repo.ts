/**
 * @module i-cashier-payroll.repo
 * @description Domain repository interface for CASHIER-HUB Phase 2:
 *   FEATURE A — KAS-2 salary-payout approval chain (salary_payout_approvals).
 *   FEATURE B — podotchet advance/debt cycle (employee_debt + advance_reports).
 *   Extends KAS-1 (i-cashier-hub.repo.ts) — does NOT replace it. All methods return
 *   Result<T> (never throw / null). owner #8 PIN gate + #11 canonical GL handled in service.
 * @layer Domain (Finance)
 */

import type { Result } from '@common/result';
import type { SalaryPayoutApproval, EmployeeDebt, AdvanceReport } from '@workspace/db';

export const CASHIER_PAYROLL_REPO = Symbol('ICashierPayrollRepository');

/** Ordered approval stages of the salary-payout chain. */
export type ApprovalStage =
  | 'ai_checked'
  | 'hr_approved'
  | 'finance_approved'
  | 'director_approved';

export interface CreateSalaryApprovalDto {
  employeeId: number;
  amount: number;
  reference: string;
  notes?: string | null;
}

export interface CreateDebtDto {
  employeeId: number;
  amount: number;
  reason?: string | null;
  reference: string;
  movementId?: number | null;
}

export interface CreateAdvanceReportDto {
  employeeId: number;
  debtId: number;
  amount: number;
  receiptRef?: string | null;
  reference: string;
  notes?: string | null;
}

/** Filters for the salary-payout approval queue list (GET salary-payouts). */
export interface ListApprovalsFilters {
  status?: string;
  limit: number;
  offset: number;
}

/** An approval-queue row joined to the employee display name (read-only projection). */
export interface ApprovalListRow {
  id: number;
  employeeId: number;
  employeeName: string | null;
  amount: string | number | null;
  reference: string;
  status: string;
  aiCheckedAt: Date | string | null;
  hrApprovedAt: Date | string | null;
  financeApprovedAt: Date | string | null;
  directorApprovedAt: Date | string | null;
  rejectedAt: Date | string | null;
  rejectionReason: string | null;
  paidMovementId: number | null;
  notes: string | null;
  createdAt: Date | string | null;
}

/** Filters for the advance-reports list (GET advance-reports). */
export interface ListAdvanceReportsFilters {
  /** 'pending' (approved=false) | 'approved' (approved=true) | undefined (all). */
  status?: 'pending' | 'approved';
  limit: number;
  offset: number;
}

/** An advance-report row joined to the employee display name (read-only projection). */
export interface AdvanceReportListRow {
  id: number;
  employeeId: number;
  employeeName: string | null;
  debtId: number;
  amount: string | number | null;
  receiptRef: string | null;
  approved: boolean;
  approvedAt: Date | string | null;
  reference: string;
  notes: string | null;
  createdAt: Date | string | null;
}

/** A page of rows + the total matching count (matches the codebase {data,total} list shape). */
export interface PayrollListPage<T> {
  data: T[];
  total: number;
}

export interface ICashierPayrollRepository {
  // --- FEATURE A: salary-payout approval chain ---
  /**
   * SHARED READ (T7-11) — the employee's card-derived monthly salary total: the FORMULA-A
   * SUM of all active cards' max_salary + acting supplements (mirrors org-structure
   * CardRepository.employeeSalaryTotal — `employee_cards` JOIN `org_departments`, on-read
   * revert guard, COALESCE NULL→0). Ties the cashier salary-payout to the multi-card salary
   * shown on the employee profile. 0 = no card-salary materialized yet (owner-DATA — Q-40);
   * never a forged figure. Read-only join, no service→service import (module contract).
   */
  getEmployeeCardSalaryTotal(employeeId: number): Promise<Result<number>>;
  /** The approval chain for a business reference, or null (idempotency + payout gate lookup). */
  findApprovalByReference(reference: string): Promise<Result<SalaryPayoutApproval | null>>;
  findApprovalById(id: number): Promise<Result<SalaryPayoutApproval | null>>;
  /** Paginated approval queue (newest first), optionally filtered by status; joined to employee name. */
  listApprovals(filters: ListApprovalsFilters): Promise<Result<PayrollListPage<ApprovalListRow>>>;
  createApproval(dto: CreateSalaryApprovalDto): Promise<Result<SalaryPayoutApproval>>;
  /** Persist a single stage's approver+timestamp and the recomputed aggregate status. */
  setApprovalStage(
    id: number,
    stage: ApprovalStage,
    approverUserId: number,
    newStatus: string,
  ): Promise<Result<SalaryPayoutApproval>>;
  rejectApproval(id: number, rejectedBy: number, reason: string): Promise<Result<SalaryPayoutApproval>>;
  /** Mark the approved chain as paid (links cashier_movements.id) — closes the payout one-to-one. */
  markApprovalPaid(id: number, movementId: number): Promise<Result<SalaryPayoutApproval>>;

  // --- FEATURE B: podotchet (advance / debt) ---
  findDebtByReference(reference: string): Promise<Result<EmployeeDebt | null>>;
  findDebtById(id: number): Promise<Result<EmployeeDebt | null>>;
  createDebt(dto: CreateDebtDto): Promise<Result<EmployeeDebt>>;
  /** Set status='cleared' + cleared_at on a debt (only when its advance report is approved). */
  clearDebt(id: number): Promise<Result<EmployeeDebt>>;
  /** SUM(amount) of OPEN employee_debt for an employee (profile debt). */
  getOpenDebtTotal(employeeId: number): Promise<Result<number>>;
  listOpenDebts(employeeId: number): Promise<Result<EmployeeDebt[]>>;

  findAdvanceReportByReference(reference: string): Promise<Result<AdvanceReport | null>>;
  /** Paginated advance-report list (newest first), optionally filtered by approved status; joined to employee name. */
  listAdvanceReports(filters: ListAdvanceReportsFilters): Promise<Result<PayrollListPage<AdvanceReportListRow>>>;
  createAdvanceReport(dto: CreateAdvanceReportDto): Promise<Result<AdvanceReport>>;
  /** Set approved=true + approver/timestamp on an advance report. */
  approveAdvanceReport(id: number, approvedBy: number): Promise<Result<AdvanceReport>>;
}
