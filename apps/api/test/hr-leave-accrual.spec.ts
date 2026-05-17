/**
 * hr-leave-accrual.spec.ts — Phase 7 T7.5
 *
 * Coverage:
 *   - LeaveAccrualService domain: monthly accrual, pro-rating, year-of-hire scaling
 *   - LeaveAccrualJobService orchestration: runForMonth with mocked repo
 */

jest.mock('../src/shared/db', () => ({
  db: {},
  rawSql: jest.fn(),
  runQuery: jest.fn(),
}));

import {
  LeaveAccrualService,
  DEFAULT_LEAVE_POLICY,
  type AccrualLine,
} from '../src/modules/hr/leave/leave-accrual.service';
import { LeaveAccrualJobService } from '../src/modules/hr/leave/leave-accrual-job.service';
import { Ok, Err } from '../src/common/result';

// ============================================================================
// LeaveAccrualService
// ============================================================================
describe('LeaveAccrualService — T7.5 domain', () => {
  let svc: LeaveAccrualService;
  beforeEach(() => { svc = new LeaveAccrualService(); });

  it('hired before period: monthly annual accrual ≈ 28/12 ≈ 2.33 days', () => {
    const r = svc.computeAccrual({ employeeId: 1, hireDate: '2020-01-01', year: 2026, month: 5 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      const annual = r.data.find((l) => l.leaveType === 'annual')!;
      expect(annual.daysAccrued).toBeCloseTo(28 / 12, 2);
    }
  });

  it('hired before period: monthly sick accrual ≈ 7/12 ≈ 0.58 days', () => {
    const r = svc.computeAccrual({ employeeId: 1, hireDate: '2020-01-01', year: 2026, month: 5 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      const sick = r.data.find((l) => l.leaveType === 'sick')!;
      expect(sick.daysAccrued).toBeCloseTo(7 / 12, 2);
    }
  });

  it('hire date in future relative to period → empty array (no accrual)', () => {
    const r = svc.computeAccrual({ employeeId: 1, hireDate: '2026-12-01', year: 2026, month: 3 });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toEqual([]);
  });

  it('hire mid-month: pro-rates the month', () => {
    // Hire on 16 May 2026 (31-day month) → covers 16..31 = 16 days → factor ~16/31 ≈ 0.516
    const r = svc.computeAccrual({ employeeId: 1, hireDate: '2026-05-16', year: 2026, month: 5 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      const annual = r.data.find((l) => l.leaveType === 'annual')!;
      const expected = (28 / 12) * (16 / 31);
      expect(annual.daysAccrued).toBeCloseTo(expected, 2);
    }
  });

  it('year-of-hire: yearTotal is scaled to remaining months', () => {
    // Hire 2026-07-01 → 6 full months remaining → yearTotal annual = 28 * 6/12 = 14
    const r = svc.computeAccrual({ employeeId: 1, hireDate: '2026-07-01', year: 2026, month: 7 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      const annual = r.data.find((l) => l.leaveType === 'annual')!;
      expect(annual.yearTotal).toBeCloseTo(28 * (6 / 12), 1);
    }
  });

  it('year after hire: yearTotal is full annual entitlement', () => {
    const r = svc.computeAccrual({ employeeId: 1, hireDate: '2020-06-15', year: 2026, month: 3 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      const annual = r.data.find((l) => l.leaveType === 'annual')!;
      expect(annual.yearTotal).toBe(28);
    }
  });

  it('invalid month → VALIDATION', () => {
    const r = svc.computeAccrual({ employeeId: 1, hireDate: '2020-01-01', year: 2026, month: 13 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('VALIDATION');
  });

  it('invalid year → VALIDATION', () => {
    const r = svc.computeAccrual({ employeeId: 1, hireDate: '2020-01-01', year: 1800, month: 5 });
    expect(r.ok).toBe(false);
  });

  it('malformed hireDate → VALIDATION', () => {
    const r = svc.computeAccrual({ employeeId: 1, hireDate: 'not-a-date', year: 2026, month: 5 });
    expect(r.ok).toBe(false);
  });

  it('custom policy is honored', () => {
    const r = svc.computeAccrual({
      employeeId: 1, hireDate: '2020-01-01', year: 2026, month: 5,
      policy: { annualDaysPerYear: 36, sickDaysPerYear: 12, personalDaysPerYear: 6 },
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      const annual = r.data.find((l) => l.leaveType === 'annual')!;
      expect(annual.daysAccrued).toBeCloseTo(36 / 12, 2);
    }
  });

  it('applyAccrual: adds days but caps at yearTotal', () => {
    const next = svc.applyAccrual(
      { total_days: 27, used_days: 5, remaining_days: 22 },
      { leaveType: 'annual', daysAccrued: 5, yearTotal: 28 },
    );
    expect(next.total_days).toBe(28); // capped
    expect(next.remaining_days).toBe(23); // 28 - 5 used
  });

  it('applyAccrual: never below zero remaining', () => {
    const next = svc.applyAccrual(
      { total_days: 10, used_days: 15, remaining_days: 0 },
      { leaveType: 'annual', daysAccrued: 2, yearTotal: 28 },
    );
    expect(next.remaining_days).toBe(0);
  });

  it('returns three lines (annual/sick/personal)', () => {
    const r = svc.computeAccrual({ employeeId: 1, hireDate: '2020-01-01', year: 2026, month: 5 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      const types = r.data.map((l) => l.leaveType).sort();
      expect(types).toEqual(['annual', 'personal', 'sick']);
    }
  });
});

// ============================================================================
// LeaveAccrualJobService orchestration
// ============================================================================
describe('LeaveAccrualJobService — T7.5 cron + manual run', () => {
  type RepoMock = {
    listActiveEmployeesWithHireDate: jest.Mock;
    findBalance: jest.Mock;
    upsertBalance: jest.Mock;
    // unused but required by interface:
    findAll: jest.Mock; findById: jest.Mock; findUserById: jest.Mock;
    create: jest.Mock; approve: jest.Mock; reject: jest.Mock;
  };
  let repo: RepoMock;
  let job: LeaveAccrualJobService;

  beforeEach(() => {
    repo = {
      listActiveEmployeesWithHireDate: jest.fn(),
      findBalance: jest.fn(),
      upsertBalance: jest.fn(),
      findAll: jest.fn(), findById: jest.fn(), findUserById: jest.fn(),
      create: jest.fn(), approve: jest.fn(), reject: jest.fn(),
    };
    job = new LeaveAccrualJobService(repo as never, new LeaveAccrualService());
  });

  it('invalid year → Err', async () => {
    const r = await job.runForMonth(1800, 5);
    expect(r.ok).toBe(false);
  });

  it('invalid month → Err', async () => {
    const r = await job.runForMonth(2026, 13);
    expect(r.ok).toBe(false);
  });

  it('empty employee list → processed=0', async () => {
    repo.listActiveEmployeesWithHireDate.mockResolvedValueOnce(Ok([]));
    const r = await job.runForMonth(2026, 5);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.processed).toBe(0);
      expect(r.data.updated).toBe(0);
    }
  });

  it('employee without hire_date → counted as skipped', async () => {
    repo.listActiveEmployeesWithHireDate.mockResolvedValueOnce(Ok([{ id: 1, hireDate: null }]));
    const r = await job.runForMonth(2026, 5);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.skipped).toBe(1);
      expect(r.data.updated).toBe(0);
    }
    expect(repo.upsertBalance).not.toHaveBeenCalled();
  });

  it('employee with future hire date → counted as skipped (computeAccrual returns [])', async () => {
    repo.listActiveEmployeesWithHireDate.mockResolvedValueOnce(Ok([{ id: 1, hireDate: '2099-01-01' }]));
    const r = await job.runForMonth(2026, 5);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.skipped).toBe(1);
    expect(repo.upsertBalance).not.toHaveBeenCalled();
  });

  it('happy path: 1 employee → upsertBalance called 3x (annual/sick/personal)', async () => {
    repo.listActiveEmployeesWithHireDate.mockResolvedValueOnce(Ok([{ id: 7, hireDate: '2020-01-01' }]));
    repo.findBalance.mockResolvedValue(Ok(null));
    repo.upsertBalance.mockResolvedValue(Ok({ id: 1 }));
    const r = await job.runForMonth(2026, 5);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.processed).toBe(1);
      expect(r.data.updated).toBe(1);
    }
    expect(repo.upsertBalance).toHaveBeenCalledTimes(3);
  });

  it('individual employee error does not abort run', async () => {
    repo.listActiveEmployeesWithHireDate.mockResolvedValueOnce(Ok([
      { id: 1, hireDate: '2020-01-01' },
      { id: 2, hireDate: '2020-01-01' },
    ]));
    repo.findBalance.mockResolvedValue(Ok(null));
    repo.upsertBalance
      .mockResolvedValueOnce(Ok({ id: 1 }))
      .mockResolvedValueOnce(Ok({ id: 1 }))
      .mockResolvedValueOnce(Ok({ id: 1 }))
      .mockResolvedValueOnce(Err('boom'))
      .mockResolvedValueOnce(Err('boom'))
      .mockResolvedValueOnce(Err('boom'));
    const r = await job.runForMonth(2026, 5);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.processed).toBe(2);
      expect(r.data.errors).toBeGreaterThan(0);
    }
  });

  it('uses existing balance when findBalance returns row', async () => {
    repo.listActiveEmployeesWithHireDate.mockResolvedValueOnce(Ok([{ id: 9, hireDate: '2020-01-01' }]));
    repo.findBalance.mockResolvedValue(Ok({ total_days: 5, used_days: 1, remaining_days: 4 }));
    repo.upsertBalance.mockResolvedValue(Ok({ id: 1 }));
    const r = await job.runForMonth(2026, 5);
    expect(r.ok).toBe(true);
    // First call (annual): total_days should grow from 5 by ~2.33
    const firstCall = repo.upsertBalance.mock.calls[0][0];
    expect(firstCall.total_days).toBeGreaterThan(5);
  });
});
