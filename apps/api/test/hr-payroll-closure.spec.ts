/**
 * hr-payroll-closure.spec.ts — Phase 7 T7.4
 *
 * Coverage:
 *   - PayrollClosureService: aggregate, canClose, buildJournal, validatePeriodDates
 *   - PayrollService.closePeriod: orchestration with mocked repo + emitter
 */

jest.mock('../src/shared/db', () => ({
  db: {},
  rawSql: jest.fn(),
  runQuery: jest.fn(),
}));

import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  PayrollClosureService,
  PAYROLL_GL_ACCOUNTS,
  type PayrollRow,
  type PayrollPeriod,
} from '../src/modules/hr/payroll/payroll-closure.service';
import { PayrollService } from '../src/modules/hr/payroll/payroll.service';
import { Ok, Err } from '../src/common/result';

// ============================================================================
// PayrollClosureService
// ============================================================================
describe('PayrollClosureService — T7.4 domain', () => {
  let svc: PayrollClosureService;
  beforeEach(() => { svc = new PayrollClosureService(); });

  describe('aggregate', () => {
    it('empty array → all zeros', () => {
      const t = svc.aggregate([]);
      expect(t).toEqual({ rowCount: 0, totalBase: 0, totalBonus: 0, totalDeductions: 0, totalNet: 0 });
    });

    it('null → all zeros', () => {
      const t = svc.aggregate(null);
      expect(t.rowCount).toBe(0);
    });

    it('sums numerics correctly', () => {
      const rows: PayrollRow[] = [
        { id: 1, employeeId: 1, baseSalary: 5_000_000, bonus: 500_000, deductions: 400_000, netPay: 5_100_000, status: 'approved' },
        { id: 2, employeeId: 2, baseSalary: 3_000_000, bonus: 0,       deductions: 240_000, netPay: 2_760_000, status: 'approved' },
      ];
      const t = svc.aggregate(rows);
      expect(t.rowCount).toBe(2);
      expect(t.totalBase).toBe(8_000_000);
      expect(t.totalBonus).toBe(500_000);
      expect(t.totalDeductions).toBe(640_000);
      expect(t.totalNet).toBe(7_860_000);
    });

    it('handles numeric strings (Drizzle decimal)', () => {
      const rows = [
        { id: 1, employeeId: 1, baseSalary: '1000.50', bonus: '0', deductions: '80', netPay: '920.50', status: 'approved' },
      ] as unknown as PayrollRow[];
      const t = svc.aggregate(rows);
      expect(t.totalBase).toBeCloseTo(1000.5, 2);
      expect(t.totalNet).toBeCloseTo(920.5, 2);
    });
  });

  describe('canClose', () => {
    const validPeriod: PayrollPeriod = { id: 1, status: 'open', periodStartDate: '2026-05-01', periodEndDate: '2026-05-31', periodName: '2026-05' };
    const goodRow: PayrollRow = { id: 1, employeeId: 1, baseSalary: 1000, bonus: 0, deductions: 80, netPay: 920, status: 'approved' };

    it('closed period → CONFLICT', () => {
      const r = svc.canClose({ ...validPeriod, status: 'closed' }, [goodRow]);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('CONFLICT');
    });

    it('unknown status → INVALID_TRANSITION', () => {
      const r = svc.canClose({ ...validPeriod, status: 'archived' }, [goodRow]);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('INVALID_TRANSITION');
    });

    it('no rows → NO_LINES', () => {
      const r = svc.canClose(validPeriod, []);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('NO_LINES');
    });

    it('draft row present → BUSINESS_RULE_VIOLATION', () => {
      const r = svc.canClose(validPeriod, [goodRow, { ...goodRow, id: 2, status: 'draft' }]);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('BUSINESS_RULE_VIOLATION');
    });

    it('all approved rows → Ok with totals', () => {
      const r = svc.canClose(validPeriod, [goodRow, { ...goodRow, id: 2 }]);
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.totals.rowCount).toBe(2);
        expect(r.data.totals.totalBase).toBe(2000);
      }
    });

    it('status=calculated → Ok (also closeable)', () => {
      const r = svc.canClose({ ...validPeriod, status: 'calculated' }, [goodRow]);
      expect(r.ok).toBe(true);
    });
  });

  describe('buildJournal', () => {
    it('balanced totals → returns 4 lines, debit == credit', () => {
      const r = svc.buildJournal(
        { rowCount: 1, totalBase: 1000, totalBonus: 100, totalDeductions: 88, totalNet: 1012 },
        '2026-05',
      );
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data).toHaveLength(4);
        const debit  = r.data.reduce((s, l) => s + l.debit, 0);
        const credit = r.data.reduce((s, l) => s + l.credit, 0);
        expect(debit).toBeCloseTo(credit, 2);
        expect(debit).toBe(1100);
      }
    });

    it('expense salary uses the live GL account 9410 (Ish haqi)', () => {
      const r = svc.buildJournal(
        { rowCount: 1, totalBase: 100, totalBonus: 0, totalDeductions: 8, totalNet: 92 },
        '2026-05',
      );
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(PAYROLL_GL_ACCOUNTS.EXPENSE_SALARY).toBe('9410');
        const salaryLine = r.data.find((l) => l.account === PAYROLL_GL_ACCOUNTS.EXPENSE_SALARY);
        expect(salaryLine).toBeDefined();
        expect(salaryLine?.debit).toBe(100);
      }
    });

    it('zero-amount lines are omitted', () => {
      const r = svc.buildJournal(
        { rowCount: 1, totalBase: 100, totalBonus: 0, totalDeductions: 0, totalNet: 100 },
        '2026-05',
      );
      expect(r.ok).toBe(true);
      if (r.ok) {
        // bonus(0) + deductions(0) omitted → only salary debit + net credit. (bonus shares 9410 with
        // salary, so assert by line count / debit count rather than by the shared account code.)
        expect(r.data).toHaveLength(2);
        expect(r.data.filter((l) => l.debit > 0)).toHaveLength(1);
        expect(r.data.find((l) => l.account === PAYROLL_GL_ACCOUNTS.LIABILITY_TAXES)).toBeUndefined();
      }
    });

    it('unbalanced totals → VALIDATION', () => {
      const r = svc.buildJournal(
        { rowCount: 1, totalBase: 100, totalBonus: 0, totalDeductions: 0, totalNet: 50 },
        '2026-05',
      );
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('VALIDATION');
    });

    it('H2: a 0.2 imbalance (passed the old 0.5 tol) is now rejected at the engine 0.01 tol', () => {
      const r = svc.buildJournal(
        { rowCount: 1, totalBase: 100.2, totalBonus: 0, totalDeductions: 0, totalNet: 100 },
        '2026-05',
      );
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('VALIDATION');
    });
  });

  describe('validatePeriodDates', () => {
    it('missing start date → VALIDATION', () => {
      const r = svc.validatePeriodDates({ id: 1, status: 'open', periodEndDate: '2026-05-31' });
      expect(r.ok).toBe(false);
    });

    it('end <= start → VALIDATION', () => {
      const r = svc.validatePeriodDates({ id: 1, status: 'open', periodStartDate: '2026-05-31', periodEndDate: '2026-05-01' });
      expect(r.ok).toBe(false);
    });

    it('valid window → Ok', () => {
      const r = svc.validatePeriodDates({ id: 1, status: 'open', periodStartDate: '2026-05-01', periodEndDate: '2026-05-31' });
      expect(r.ok).toBe(true);
    });
  });
});

// ============================================================================
// PayrollService orchestration
// ============================================================================
describe('PayrollService.closePeriod — T7.4 orchestration', () => {
  type RepoMock = {
    findAll: jest.Mock;
    create: jest.Mock;
    findPeriodById: jest.Mock;
    listRowsByPeriod: jest.Mock;
    markPeriodClosed: jest.Mock;
    markRowsPosted: jest.Mock;
  };
  let repo: RepoMock;
  let gl: { postJournal: jest.Mock };
  let svc: PayrollService;
  let emitter: EventEmitter2;

  const validPeriod = {
    id: 1, status: 'open', periodStartDate: '2026-05-01', periodEndDate: '2026-05-31', periodName: '2026-05',
  };
  const validRow = { id: 1, employeeId: 1, baseSalary: 1000, bonus: 100, deductions: 88, netPay: 1012, status: 'approved' };

  beforeEach(() => {
    repo = {
      findAll: jest.fn(),
      create: jest.fn(),
      findPeriodById: jest.fn(),
      listRowsByPeriod: jest.fn(),
      markPeriodClosed: jest.fn(),
      markRowsPosted: jest.fn(),
    };
    gl = { postJournal: jest.fn() };
    emitter = new EventEmitter2();
    jest.spyOn(emitter, 'emit');
    svc = new PayrollService(repo as never, new PayrollClosureService(), gl as never, emitter);
  });

  it('period not found → NOT_FOUND', async () => {
    repo.findPeriodById.mockResolvedValueOnce(Ok(null));
    const r = await svc.closePeriod(99);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('repo error on findPeriodById propagates', async () => {
    repo.findPeriodById.mockResolvedValueOnce(Err('boom'));
    const r = await svc.closePeriod(1);
    expect(r.ok).toBe(false);
  });

  it('happy path: aggregates totals + closes + posts rows + emits event', async () => {
    repo.findPeriodById.mockResolvedValueOnce(Ok(validPeriod));
    repo.listRowsByPeriod.mockResolvedValueOnce(Ok([validRow]));
    repo.markPeriodClosed.mockResolvedValueOnce(Ok({ ...validPeriod, status: 'closed' }));
    repo.markRowsPosted.mockResolvedValueOnce(Ok({ updated: 1 }));
    gl.postJournal.mockResolvedValueOnce(Ok(1)); // ONE engine returns the entry id

    const r = await svc.closePeriod(1);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.totals.totalBase).toBe(1000);
      expect(r.data.totals.totalNet).toBe(1012);
      expect(r.data.gl.inserted).toBe(4); // 4 balanced legs mapped to JournalLine[]
    }
    // GL journal posted through GlPostingService.postJournal with the live account codes (9410/6520/6710)
    expect(gl.postJournal).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ accountCode: '9410' })]),
      'PR-1',
    );
    expect(repo.markPeriodClosed).toHaveBeenCalledWith(1, expect.objectContaining({ totalBase: 1000 }));
    expect(repo.markRowsPosted).toHaveBeenCalledWith(1);
    expect(emitter.emit).toHaveBeenCalledWith(
      'payroll.period.closed',
      expect.objectContaining({ periodId: 1 }),
    );
  });

  it('H3: GL post fails → Err and period NOT marked closed (stays open, retryable)', async () => {
    repo.findPeriodById.mockResolvedValueOnce(Ok(validPeriod));
    repo.listRowsByPeriod.mockResolvedValueOnce(Ok([validRow]));
    gl.postJournal.mockResolvedValueOnce(Err('GL down')); // engine fails

    const r = await svc.closePeriod(1);
    expect(r.ok).toBe(false);
    // GL ran before the close, so the period was never closed → safe to retry (H1 makes retry idempotent)
    expect(gl.postJournal).toHaveBeenCalled();
    expect(repo.markPeriodClosed).not.toHaveBeenCalled();
    expect(repo.markRowsPosted).not.toHaveBeenCalled();
  });

  it('period already closed → CONFLICT', async () => {
    repo.findPeriodById.mockResolvedValueOnce(Ok({ ...validPeriod, status: 'closed' }));
    repo.listRowsByPeriod.mockResolvedValueOnce(Ok([validRow]));
    const r = await svc.closePeriod(1);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('CONFLICT');
    expect(repo.markPeriodClosed).not.toHaveBeenCalled();
  });

  it('rows have draft status → BUSINESS_RULE_VIOLATION', async () => {
    repo.findPeriodById.mockResolvedValueOnce(Ok(validPeriod));
    repo.listRowsByPeriod.mockResolvedValueOnce(Ok([validRow, { ...validRow, id: 2, status: 'draft' }]));
    const r = await svc.closePeriod(1);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('BUSINESS_RULE_VIOLATION');
  });

  it('missing rows → NO_LINES', async () => {
    repo.findPeriodById.mockResolvedValueOnce(Ok(validPeriod));
    repo.listRowsByPeriod.mockResolvedValueOnce(Ok([]));
    const r = await svc.closePeriod(1);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NO_LINES');
  });
});
