/**
 * test/hr/employees-calc.spec.ts
 *
 * Pure-logic HR tests: leave-balance math, discipline thresholds, KPI calc.
 * These exercise the business rules without depending on Drizzle / DB.
 */

import Decimal from 'decimal.js';

// ─── Leave balance ──────────────────────────────────────────────────────────

interface LeaveBalance { employeeId: number; balanceDays: number }
interface LeaveRequest { id: number; employeeId: number; days: number; status: 'pending' | 'approved' | 'rejected' | 'cancelled' }

function approveLeave(balance: LeaveBalance, req: LeaveRequest): { ok: boolean; balance?: LeaveBalance; error?: string } {
  if (req.status !== 'pending') return { ok: false, error: 'INVALID_STATUS' };
  if (req.days <= 0) return { ok: false, error: 'INVALID_QUANTITY' };
  if (balance.balanceDays < req.days) return { ok: false, error: 'INSUFFICIENT_BALANCE' };
  return { ok: true, balance: { ...balance, balanceDays: balance.balanceDays - req.days } };
}

function cancelApprovedLeave(balance: LeaveBalance, req: LeaveRequest): { ok: boolean; balance?: LeaveBalance } {
  if (req.status !== 'approved') return { ok: false };
  return { ok: true, balance: { ...balance, balanceDays: balance.balanceDays + req.days } };
}

describe('Leave balance', () => {
  it('approves request and deducts days', () => {
    const r = approveLeave({ employeeId: 1, balanceDays: 20 }, { id: 1, employeeId: 1, days: 5, status: 'pending' });
    expect(r.ok).toBe(true);
    expect(r.balance!.balanceDays).toBe(15);
  });

  it('rejects when balance insufficient', () => {
    const r = approveLeave({ employeeId: 1, balanceDays: 3 }, { id: 1, employeeId: 1, days: 5, status: 'pending' });
    expect(r.ok).toBe(false);
    expect(r.error).toBe('INSUFFICIENT_BALANCE');
  });

  it('rejects already-approved request (idempotency)', () => {
    const r = approveLeave({ employeeId: 1, balanceDays: 20 }, { id: 1, employeeId: 1, days: 5, status: 'approved' });
    expect(r.ok).toBe(false);
    expect(r.error).toBe('INVALID_STATUS');
  });

  it('rejects 0 or negative day requests', () => {
    expect(approveLeave({ employeeId: 1, balanceDays: 20 }, { id: 1, employeeId: 1, days: 0, status: 'pending' }).error).toBe('INVALID_QUANTITY');
    expect(approveLeave({ employeeId: 1, balanceDays: 20 }, { id: 1, employeeId: 1, days: -3, status: 'pending' }).error).toBe('INVALID_QUANTITY');
  });

  it('returns balance on cancellation of approved request', () => {
    const r = cancelApprovedLeave({ employeeId: 1, balanceDays: 15 }, { id: 1, employeeId: 1, days: 5, status: 'approved' });
    expect(r.ok).toBe(true);
    expect(r.balance!.balanceDays).toBe(20);
  });

  it('allows exact-balance request (boundary)', () => {
    const r = approveLeave({ employeeId: 1, balanceDays: 5 }, { id: 1, employeeId: 1, days: 5, status: 'pending' });
    expect(r.ok).toBe(true);
    expect(r.balance!.balanceDays).toBe(0);
  });
});

// ─── Discipline (late arrival escalation) ───────────────────────────────────

const LATE_WARNING = 3;
const LATE_REPRIMAND = 5;
const LATE_DISCHARGE = 8;

function classifyLateRecord(monthlyLateCount: number): 'none' | 'warning' | 'reprimand' | 'discharge' {
  if (monthlyLateCount >= LATE_DISCHARGE) return 'discharge';
  if (monthlyLateCount >= LATE_REPRIMAND) return 'reprimand';
  if (monthlyLateCount >= LATE_WARNING) return 'warning';
  return 'none';
}

describe('Discipline thresholds', () => {
  it.each([
    [0, 'none'],
    [2, 'none'],
    [3, 'warning'],
    [4, 'warning'],
    [5, 'reprimand'],
    [7, 'reprimand'],
    [8, 'discharge'],
    [20, 'discharge'],
  ] as Array<[number, string]>)('count %i → %s', (count, expected) => {
    expect(classifyLateRecord(count)).toBe(expected);
  });
});

// ─── KPI weighted calc (CLAUDE.md Qoida 12) ─────────────────────────────────

interface KpiInput { achievement: number; quality: number; oee: number }
const KPI_W = { achievement: 0.5, quality: 0.3, oee: 0.2 } as const;

function calcKpiScore(input: KpiInput): { ok: boolean; score?: number; error?: string } {
  for (const v of Object.values(input)) {
    if (!Number.isFinite(v)) return { ok: false, error: 'NON_FINITE' };
    if (v < 0 || v > 100) return { ok: false, error: 'OUT_OF_RANGE' };
  }
  const s = new Decimal(input.achievement).times(KPI_W.achievement)
    .plus(new Decimal(input.quality).times(KPI_W.quality))
    .plus(new Decimal(input.oee).times(KPI_W.oee));
  return { ok: true, score: s.toNumber() };
}

describe('KPI weighted score', () => {
  it('all perfect → 100', () => {
    expect(calcKpiScore({ achievement: 100, quality: 100, oee: 100 }).score).toBe(100);
  });

  it('all zero → 0', () => {
    expect(calcKpiScore({ achievement: 0, quality: 0, oee: 0 }).score).toBe(0);
  });

  it('weighted: 80 * 0.5 + 90 * 0.3 + 70 * 0.2 = 81', () => {
    expect(calcKpiScore({ achievement: 80, quality: 90, oee: 70 }).score).toBeCloseTo(81, 4);
  });

  it('rejects out-of-range values', () => {
    expect(calcKpiScore({ achievement: 150, quality: 50, oee: 50 }).ok).toBe(false);
    expect(calcKpiScore({ achievement: -1, quality: 50, oee: 50 }).ok).toBe(false);
  });

  it('rejects NaN', () => {
    expect(calcKpiScore({ achievement: NaN, quality: 50, oee: 50 }).ok).toBe(false);
  });

  it('weights sum to 1 (sanity)', () => {
    expect(KPI_W.achievement + KPI_W.quality + KPI_W.oee).toBe(1);
  });
});
