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

export interface ICashierPayrollRepository {
  // --- FEATURE A: salary-payout approval chain ---
  /** The approval chain for a business reference, or null (idempotency + payout gate lookup). */
  findApprovalByReference(reference: string): Promise<Result<SalaryPayoutApproval | null>>;
  findApprovalById(id: number): Promise<Result<SalaryPayoutApproval | null>>;
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
  createAdvanceReport(dto: CreateAdvanceReportDto): Promise<Result<AdvanceReport>>;
  /** Set approved=true + approver/timestamp on an advance report. */
  approveAdvanceReport(id: number, approvedBy: number): Promise<Result<AdvanceReport>>;
}
