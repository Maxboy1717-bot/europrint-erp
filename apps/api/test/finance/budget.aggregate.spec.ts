/**
 * test/finance/budget.aggregate.spec.ts
 * Unit tests for Budget aggregate — DRAFT → PENDING_APPROVAL → APPROVED → CLOSED
 * state machine, REJECTED branch, and variance accessors.
 */
import { InternalServerErrorException } from '@nestjs/common';
import { Budget, BudgetStatus, BudgetLine } from '../../src/modules/finance/domain/aggregates/budget.aggregate';
import { applicationFactory } from '../_fixtures/factories';

function makeBudget(overrides: Partial<{
  id: string;
  name: string;
  fiscalYear: number;
  quarter: number | null;
  department: string | null;
  status: BudgetStatus;
  lines: BudgetLine[];
  totalPlanned: number;
  totalActual: number;
  createdBy: string;
}> = {}): Budget {
  const a = applicationFactory();
  return new Budget(
    overrides.id ?? a.id,
    overrides.name ?? 'FY2026 OPEX',
    overrides.fiscalYear ?? 2026,
    overrides.quarter ?? null,
    overrides.department ?? null,
    overrides.status ?? BudgetStatus.DRAFT,
    overrides.lines ?? [],
    overrides.totalPlanned ?? 100_000_000,
    overrides.totalActual ?? 0,
    overrides.createdBy ?? String(a.applicantUserId),
    null, null, null,
    new Date('2026-01-01'),
    new Date('2026-01-01'),
  );
}

describe('Budget aggregate', () => {
  describe('submitForApproval()', () => {
    it('moves DRAFT to PENDING_APPROVAL', () => {
      const b = makeBudget({ status: BudgetStatus.DRAFT });
      b.submitForApproval();
      expect(b.status).toBe(BudgetStatus.PENDING_APPROVAL);
    });

    it('throws when called on PENDING_APPROVAL budget', () => {
      const b = makeBudget({ status: BudgetStatus.PENDING_APPROVAL });
      expect(() => b.submitForApproval()).toThrow(InternalServerErrorException);
    });

    it('throws when called on APPROVED budget', () => {
      const b = makeBudget({ status: BudgetStatus.APPROVED });
      expect(() => b.submitForApproval()).toThrow(InternalServerErrorException);
    });
  });

  describe('approve()', () => {
    it('moves PENDING_APPROVAL to APPROVED and records approver', () => {
      const b = makeBudget({ status: BudgetStatus.PENDING_APPROVAL });
      b.approve('cfo-1');
      expect(b.status).toBe(BudgetStatus.APPROVED);
      expect(b.approvedBy).toBe('cfo-1');
      expect(b.approvedAt).toBeInstanceOf(Date);
    });

    it('throws when approving a DRAFT budget', () => {
      const b = makeBudget({ status: BudgetStatus.DRAFT });
      expect(() => b.approve('cfo-1')).toThrow(InternalServerErrorException);
    });

    it('throws when approving an already-APPROVED budget', () => {
      const b = makeBudget({ status: BudgetStatus.APPROVED });
      expect(() => b.approve('cfo-1')).toThrow(InternalServerErrorException);
    });
  });

  describe('reject()', () => {
    it('moves PENDING_APPROVAL to REJECTED', () => {
      const b = makeBudget({ status: BudgetStatus.PENDING_APPROVAL });
      b.reject();
      expect(b.status).toBe(BudgetStatus.REJECTED);
    });

    it('throws when rejecting a DRAFT budget', () => {
      const b = makeBudget({ status: BudgetStatus.DRAFT });
      expect(() => b.reject()).toThrow(InternalServerErrorException);
    });

    it('throws when rejecting an APPROVED budget', () => {
      const b = makeBudget({ status: BudgetStatus.APPROVED });
      expect(() => b.reject()).toThrow(InternalServerErrorException);
    });
  });

  describe('close()', () => {
    it('moves APPROVED to CLOSED', () => {
      const b = makeBudget({ status: BudgetStatus.APPROVED });
      b.close();
      expect(b.status).toBe(BudgetStatus.CLOSED);
    });

    it('throws when closing a DRAFT budget', () => {
      const b = makeBudget({ status: BudgetStatus.DRAFT });
      expect(() => b.close()).toThrow(InternalServerErrorException);
    });

    it('throws when closing a PENDING_APPROVAL budget', () => {
      const b = makeBudget({ status: BudgetStatus.PENDING_APPROVAL });
      expect(() => b.close()).toThrow(InternalServerErrorException);
    });

    it('throws when closing an already-CLOSED budget', () => {
      const b = makeBudget({ status: BudgetStatus.CLOSED });
      expect(() => b.close()).toThrow(InternalServerErrorException);
    });
  });

  describe('variance getter', () => {
    it('returns positive variance when actual is below planned', () => {
      const b = makeBudget({ totalPlanned: 100, totalActual: 60 });
      expect(b.variance).toBe(40);
    });

    it('returns negative variance when actual exceeds planned', () => {
      const b = makeBudget({ totalPlanned: 100, totalActual: 130 });
      expect(b.variance).toBe(-30);
    });

    it('returns zero variance when actual equals planned', () => {
      const b = makeBudget({ totalPlanned: 100, totalActual: 100 });
      expect(b.variance).toBe(0);
    });
  });

  describe('variancePercent getter', () => {
    it('returns 0 when totalPlanned is 0 (guard against divide-by-zero)', () => {
      const b = makeBudget({ totalPlanned: 0, totalActual: 50 });
      expect(b.variancePercent).toBe(0);
    });

    it('returns 40 when 60 spent of 100 planned', () => {
      const b = makeBudget({ totalPlanned: 100, totalActual: 60 });
      expect(b.variancePercent).toBe(40);
    });

    it('returns -25 when overspent by 25% of plan', () => {
      const b = makeBudget({ totalPlanned: 100, totalActual: 125 });
      expect(b.variancePercent).toBe(-25);
    });
  });

  describe('isOverBudget getter', () => {
    it('returns true when actual exceeds planned', () => {
      const b = makeBudget({ totalPlanned: 100, totalActual: 101 });
      expect(b.isOverBudget).toBe(true);
    });

    it('returns false when actual equals planned', () => {
      const b = makeBudget({ totalPlanned: 100, totalActual: 100 });
      expect(b.isOverBudget).toBe(false);
    });

    it('returns false when actual is below planned', () => {
      const b = makeBudget({ totalPlanned: 100, totalActual: 50 });
      expect(b.isOverBudget).toBe(false);
    });
  });

  describe('full lifecycle integration', () => {
    it('completes DRAFT → PENDING → APPROVED → CLOSED sequence', () => {
      const b = makeBudget({ status: BudgetStatus.DRAFT });
      b.submitForApproval();
      expect(b.status).toBe(BudgetStatus.PENDING_APPROVAL);
      b.approve('approver-1');
      expect(b.status).toBe(BudgetStatus.APPROVED);
      b.close();
      expect(b.status).toBe(BudgetStatus.CLOSED);
    });
  });
});
