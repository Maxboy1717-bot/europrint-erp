/**
 * @module budget.aggregate
 * @description Source module. See exports for details.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { DomainError } from '../../../../shared/domain/errors/domain-error';
export enum BudgetStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CLOSED = 'closed',
}

export interface BudgetLine {
  id: string;
  budgetId: string;
  category: string;
  description: string;
  plannedAmount: number;
  actualAmount: number;
  variance: number;
  variancePercent: number;
}

export class Budget {
  constructor(public readonly id: string,
    public readonly name: string,
    public readonly fiscalYear: number,
    public readonly quarter: number | null,
    public readonly department: string | null,
    public status: BudgetStatus,
    public readonly lines: BudgetLine[],
    public readonly totalPlanned: number,
    public totalActual: number,
    public readonly createdBy: string,
    public approvedBy: string | null,
    public approvedAt: Date | null,
    public readonly notes: string | null,
    public readonly createdAt: Date,
    public updatedAt: Date) {}

  get variance(): number {
    return this.totalPlanned - this.totalActual;
  }

  get variancePercent(): number {
    if (this.totalPlanned === 0) {
      return 0;
    }
    return ((this.totalPlanned - this.totalActual) / this.totalPlanned) * 100;
  }

  get isOverBudget(): boolean {
    return this.totalActual > this.totalPlanned;
  }

  approve(approverId: string): void {
    if (this.status !== BudgetStatus.PENDING_APPROVAL) {
      // INVALID_STATE: lifecycle transition not allowed from current status.
      // I18N_LEAK: domain aggregate (no DI). Caller may translate via 'errors.onlyPendingApprovable'.
      throw new DomainError('INVALID_STATE', 'Faqat kutayotgan byudjet tasdiqlanadi');
    }
    this.status = BudgetStatus.APPROVED;
    this.approvedBy = approverId;
    this.approvedAt = _time.now();
    this.updatedAt = _time.now();
  }

  submitForApproval(): void {
    if (this.status !== BudgetStatus.DRAFT) {
      // INVALID_STATE: only DRAFT can be submitted for approval.
      // I18N_LEAK: domain aggregate (no DI). Caller may translate via 'errors.onlyDraftSubmittable'.
      throw new DomainError('INVALID_STATE', 'Faqat draft byudjet taqdim etiladi');
    }
    this.status = BudgetStatus.PENDING_APPROVAL;
    this.updatedAt = _time.now();
  }

  reject(): void {
    if (this.status !== BudgetStatus.PENDING_APPROVAL) {
      // INVALID_STATE: only PENDING_APPROVAL can be rejected.
      // I18N_LEAK: domain aggregate (no DI). Caller may translate via 'errors.onlyPendingRejectable'.
      throw new DomainError('INVALID_STATE', 'Faqat kutayotgan byudjet rad etiladi');
    }
    this.status = BudgetStatus.REJECTED;
    this.updatedAt = _time.now();
  }

  close(): void {
    if (this.status !== BudgetStatus.APPROVED) {
      // INVALID_STATE: only APPROVED can be closed.
      // I18N_LEAK: domain aggregate (no DI). Caller may translate via 'errors.onlyApprovedClosable'.
      throw new DomainError('INVALID_STATE', 'Faqat tasdiqlangan byudjetni yopish mumkin');
    }
    this.status = BudgetStatus.CLOSED;
    this.updatedAt = _time.now();
  }
}
