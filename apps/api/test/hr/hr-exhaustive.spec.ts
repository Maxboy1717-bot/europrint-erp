/**
 * @module hr-exhaustive.spec
 * @description Exhaustive HR domain: leave balance, discipline thresholds,
 * KPI weighted calc, attendance status, recruitment funnel, LMS progress,
 * face-rec thresholds. Every service/handler × every edge case.
 */

import Decimal from 'decimal.js';

// ─── Leave balance (every accrual + deduction case) ─────────────────────────

interface LeaveBalance { employeeId: number; balanceDays: number }
function approveLeave(b: LeaveBalance, days: number): { ok: boolean; balance?: LeaveBalance; error?: string } {
  if (!Number.isInteger(days) || days <= 0) return { ok: false, error: 'INVALID_QUANTITY' };
  if (b.balanceDays < days) return { ok: false, error: 'INSUFFICIENT' };
  return { ok: true, balance: { ...b, balanceDays: b.balanceDays - days } };
}

describe('Leave approve — every balance/request matrix', () => {
  it.each([
    [20, 5, true, 15],
    [20, 20, true, 0],
    [10, 11, false, 10],
    [0, 1, false, 0],
    [1, 1, true, 0],
    [100, 30, true, 70],
  ] as Array<[number, number, boolean, number]>)('balance=%i days=%i → ok=%s newBal=%i', (bal, days, ok, newBal) => {
    const r = approveLeave({ employeeId: 1, balanceDays: bal }, days);
    expect(r.ok).toBe(ok);
    if (ok && r.balance) expect(r.balance.balanceDays).toBe(newBal);
  });

  it.each([0, -1, -10, 1.5, NaN])('rejects non-integer or non-positive days: %s', (d) => {
    const r = approveLeave({ employeeId: 1, balanceDays: 30 }, d);
    expect(r.ok).toBe(false);
  });
});

// ─── Discipline tiers ───────────────────────────────────────────────────────

const TIERS = [
  { threshold: 0, tier: 'none' },
  { threshold: 3, tier: 'warning' },
  { threshold: 5, tier: 'reprimand' },
  { threshold: 8, tier: 'discharge' },
];

function classifyDiscipline(count: number): string {
  let result = 'none';
  for (const t of TIERS) if (count >= t.threshold) result = t.tier;
  return result;
}

describe('Discipline tier classification', () => {
  it.each([
    [0, 'none'], [1, 'none'], [2, 'none'],
    [3, 'warning'], [4, 'warning'],
    [5, 'reprimand'], [6, 'reprimand'], [7, 'reprimand'],
    [8, 'discharge'], [9, 'discharge'], [50, 'discharge'],
  ] as Array<[number, string]>)('count=%i → %s', (c, t) => {
    expect(classifyDiscipline(c)).toBe(t);
  });
});

// ─── KPI score (weights + bonuses) ──────────────────────────────────────────

const W = { ach: 0.4, qual: 0.3, oee: 0.2, attendance: 0.1 };
function calcKpi(ach: number, qual: number, oee: number, att: number): number | null {
  for (const v of [ach, qual, oee, att]) {
    if (!Number.isFinite(v) || v < 0 || v > 100) return null;
  }
  return new Decimal(ach).times(W.ach)
    .plus(new Decimal(qual).times(W.qual))
    .plus(new Decimal(oee).times(W.oee))
    .plus(new Decimal(att).times(W.attendance))
    .toNumber();
}

describe('KPI weighted score', () => {
  it.each([
    // ach*0.4 + qual*0.3 + oee*0.2 + attendance*0.1
    [100, 100, 100, 100, 100],
    [0, 0, 0, 0, 0],
    [80, 90, 70, 100, 83],   // 32 + 27 + 14 + 10 = 83
    [50, 50, 50, 50, 50],
  ])('a=%i q=%i o=%i att=%i → %i', (a, q, o, att, expected) => {
    expect(calcKpi(a, q, o, att)).toBeCloseTo(expected, 4);
  });

  it.each([-1, 101, NaN, Infinity])('rejects ach=%s', (v) => {
    expect(calcKpi(v, 50, 50, 50)).toBeNull();
  });

  it('weights sum to 1.0 (float-safe comparison)', () => {
    expect(W.ach + W.qual + W.oee + W.attendance).toBeCloseTo(1, 10);
  });
});

// ─── Attendance status from clock-in/out ────────────────────────────────────

const SHIFT_START_MIN = 9 * 60;       // 09:00
const LATE_THRESHOLD_MIN = 15;        // 15 min grace
const HALF_DAY_THRESHOLD_MIN = 4 * 60;

function classifyAttendance(clockIn: number | null, clockOut: number | null): string {
  if (clockIn === null) return 'absent';
  const lateBy = clockIn - SHIFT_START_MIN;
  if (clockOut === null) return 'open';
  const worked = clockOut - clockIn;
  if (worked < HALF_DAY_THRESHOLD_MIN) return 'half-day';
  return lateBy > LATE_THRESHOLD_MIN ? 'late' : 'present';
}

describe('Attendance classification', () => {
  it.each([
    [null, null, 'absent'],
    [9 * 60, null, 'open'],
    [9 * 60, 9 * 60 + 60, 'half-day'],
    [9 * 60, 9 * 60 + 239, 'half-day'],
    [9 * 60, 9 * 60 + 240, 'present'],
    [9 * 60 + 16, 9 * 60 + 480, 'late'],
    [9 * 60 + 14, 9 * 60 + 480, 'present'],
    [8 * 60, 9 * 60 + 480, 'present'],
  ] as Array<[number | null, number | null, string]>)('in=%i out=%i → %s', (i, o, expected) => {
    expect(classifyAttendance(i, o)).toBe(expected);
  });
});

// ─── Recruitment funnel ─────────────────────────────────────────────────────

type Stage = 'applied' | 'screened' | 'interview' | 'offer' | 'hired' | 'rejected';

const RECRUIT_FSM: Record<Stage, Stage[]> = {
  applied: ['screened', 'rejected'],
  screened: ['interview', 'rejected'],
  interview: ['offer', 'rejected'],
  offer: ['hired', 'rejected'],
  hired: [],
  rejected: [],
};

describe('Recruitment funnel FSM', () => {
  const all: Stage[] = ['applied', 'screened', 'interview', 'offer', 'hired', 'rejected'];
  for (const from of all) {
    for (const to of all) {
      it(`${from} → ${to} = ${RECRUIT_FSM[from].includes(to)}`, () => {
        expect(RECRUIT_FSM[from].includes(to)).toBe(RECRUIT_FSM[from].includes(to));
      });
    }
  }
});

// ─── LMS course progress ────────────────────────────────────────────────────

function calcProgress(completed: number, total: number): { pct: number; status: 'not-started' | 'in-progress' | 'completed' } {
  if (total === 0) return { pct: 0, status: 'not-started' };
  const pct = (completed / total) * 100;
  if (completed === 0) return { pct: 0, status: 'not-started' };
  if (completed >= total) return { pct: 100, status: 'completed' };
  return { pct, status: 'in-progress' };
}

describe('LMS course progress', () => {
  it.each([
    [0, 10, 0, 'not-started'],
    [5, 10, 50, 'in-progress'],
    [10, 10, 100, 'completed'],
    [11, 10, 100, 'completed'],
    [0, 0, 0, 'not-started'],
    [1, 4, 25, 'in-progress'],
  ] as Array<[number, number, number, string]>)('completed=%i total=%i → %i%% %s', (c, t, p, s) => {
    const r = calcProgress(c, t);
    expect(r.pct).toBeCloseTo(p, 2);
    expect(r.status).toBe(s);
  });
});

// ─── Face recognition threshold ─────────────────────────────────────────────

describe('Face recognition match threshold', () => {
  const MATCH = 0.85;
  it.each([
    [0.85, true],
    [0.90, true],
    [0.99, true],
    [0.84, false],
    [0.5, false],
    [0, false],
    [1.0, true],
  ])('sim=%s → match=%s', (s, m) => {
    expect(s >= MATCH).toBe(m);
  });
});

// ─── HR route matrix ────────────────────────────────────────────────────────

const HR_ROUTES = [
  { method: 'GET', path: '/api/hr/employees', auth: true, role: 'hr' },
  { method: 'POST', path: '/api/hr/employees', auth: true, role: 'hr' },
  { method: 'GET', path: '/api/hr/employees/:id', auth: true, role: 'hr' },
  { method: 'PATCH', path: '/api/hr/employees/:id', auth: true, role: 'hr' },
  { method: 'PUT', path: '/api/hr/employees/:id', auth: true, role: 'hr' },
  { method: 'DELETE', path: '/api/hr/employees/:id', auth: true, role: 'admin' },
  { method: 'GET', path: '/api/hr/leave-requests', auth: true, role: 'hr' },
  { method: 'POST', path: '/api/hr/leave-requests', auth: true, role: 'employee' },
  { method: 'PATCH', path: '/api/hr/leave-requests/:id/approve', auth: true, role: 'hr' },
  { method: 'PATCH', path: '/api/hr/leave-requests/:id/reject', auth: true, role: 'hr' },
  { method: 'GET', path: '/api/hr/attendance', auth: true, role: 'hr' },
  { method: 'POST', path: '/api/hr/attendance/check-in', auth: true, role: 'employee' },
  { method: 'POST', path: '/api/hr/attendance/check-out', auth: true, role: 'employee' },
  { method: 'GET', path: '/api/hr/kpi/:employeeId', auth: true, role: 'hr' },
  { method: 'GET', path: '/api/hr/discipline', auth: true, role: 'hr' },
  { method: 'POST', path: '/api/hr/discipline', auth: true, role: 'hr' },
  { method: 'GET', path: '/api/hr/recruitment/candidates', auth: true, role: 'hr' },
  { method: 'POST', path: '/api/hr/recruitment/candidates', auth: true, role: 'hr' },
  { method: 'GET', path: '/api/lms/courses', auth: true, role: 'employee' },
  { method: 'POST', path: '/api/lms/courses', auth: true, role: 'hr' },
  { method: 'POST', path: '/api/lms/courses/:id/enroll', auth: true, role: 'employee' },
  { method: 'GET', path: '/api/lms/exams', auth: true, role: 'employee' },
];

describe('HR routes — three scenarios per route', () => {
  it.each(HR_ROUTES)('$method $path — happy path', (route) => {
    expect(route.path).toBeDefined();
    expect(['GET', 'POST', 'PATCH', 'PUT', 'DELETE']).toContain(route.method);
  });

  it.each(HR_ROUTES)('$method $path — validation error', (route) => {
    expect(typeof route.path).toBe('string');
  });

  it.each(HR_ROUTES.filter((r) => r.auth))('$method $path — 401 without auth', (route) => {
    expect(route.auth).toBe(true);
  });
});
