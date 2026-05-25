/**
 * test/hr/overtime-calculator.service.spec.ts
 *
 * Unit tests for OvertimeCalculatorService — DB-driven OT pay calculator.
 * Mocks @shared/db so the policy load returns a fixture; `computeWithPolicy`
 * is exercised directly for the pure-math path.
 */

jest.mock('@shared/db', () => ({
  __esModule: true,
  runQuery: jest.fn(),
  db: {},
  overtime_policy: { isActive: 'isActive', effectiveFrom: 'effectiveFrom' },
}));

jest.mock('@shared/db/schema-hr-overtime', () => ({
  overtime_policy: { isActive: 'isActive', effectiveFrom: 'effectiveFrom' },
}), { virtual: true });

import { OvertimeCalculatorService, type OvertimePolicy } from '../../src/modules/hr/domain/services/overtime-calculator.service';
import { Ok } from '../../src/common/result';

// Minimal IHrRepo mock — only findActiveOvertimePolicy is needed
function makeRepo(policyRows: object[] = []) {
  return {
    findActiveOvertimePolicy: jest.fn().mockResolvedValue(
      policyRows.length === 0
        ? Ok(null)
        : Ok(policyRows[0]),
    ),
  } as unknown as Parameters<typeof OvertimeCalculatorService>[0];
}

const defaultPolicy: OvertimePolicy = {
  regularOvertimeHours: 2,
  regularMultiplier:    1.5,
  extendedMultiplier:   2.0,
  weekendMultiplier:    2.0,
  nightShiftBonus:      0.3,
  nightShiftStartHour: 22,
  nightShiftEndHour:    6,
};

describe('OvertimeCalculatorService', () => {
  let svc: OvertimeCalculatorService;

  beforeEach(() => {
    jest.clearAllMocks();
    svc = new OvertimeCalculatorService(makeRepo() as never);
  });

  describe('loadActivePolicy()', () => {
    it('returns NOT_FOUND when DB has no policy row', async () => {
      svc = new OvertimeCalculatorService(makeRepo([]) as never);

      const r = await svc.loadActivePolicy();

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
    });

    it('returns parsed policy from first DB row', async () => {
      svc = new OvertimeCalculatorService(makeRepo([{
        regularOvertimeHours: 2,
        regularMultiplier: 1.5,
        extendedMultiplier: 2.0,
        weekendMultiplier: 2.0,
        nightShiftBonus: 0.3,
        nightShiftStartHour: 22,
        nightShiftEndHour: 6,
      }]) as never);

      const r = await svc.loadActivePolicy();

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.regularOvertimeHours).toBe(2);
        expect(r.data.regularMultiplier).toBeCloseTo(1.5, 4);
      }
    });
  });

  describe('computeWithPolicy()', () => {
    it('rejects non-positive grossMonthly', async () => {
      const r = await svc.computeWithPolicy(
        { grossMonthly: 0, workingHoursPerMonth: 168, timeEntries: [] },
        defaultPolicy,
      );

      expect(r.ok).toBe(false);
    });

    it('rejects non-positive workingHoursPerMonth', async () => {
      const r = await svc.computeWithPolicy(
        { grossMonthly: 1_000_000, workingHoursPerMonth: 0, timeEntries: [] },
        defaultPolicy,
      );

      expect(r.ok).toBe(false);
    });

    it('rejects regularMultiplier < 1.0', async () => {
      const bad: OvertimePolicy = { ...defaultPolicy, regularMultiplier: 0.8 };
      const r = await svc.computeWithPolicy(
        { grossMonthly: 1_000_000, workingHoursPerMonth: 168, timeEntries: [] },
        bad,
      );

      expect(r.ok).toBe(false);
    });

    it('rejects extended < regular multiplier', async () => {
      const bad: OvertimePolicy = { ...defaultPolicy, regularMultiplier: 2.0, extendedMultiplier: 1.5 };
      const r = await svc.computeWithPolicy(
        { grossMonthly: 1_000_000, workingHoursPerMonth: 168, timeEntries: [] },
        bad,
      );

      expect(r.ok).toBe(false);
    });

    it('computes regular-only OT pay (within regularOvertimeHours limit)', async () => {
      // gross 168000, 168h → baseRate 1000/h. OT 2h × 1.5 = 3000.
      const r = await svc.computeWithPolicy(
        {
          grossMonthly: 168_000,
          workingHoursPerMonth: 168,
          timeEntries: [{ date: '2025-05-15', otHours: 2, startHour: 10 }],
        },
        defaultPolicy,
      );

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.baseRate).toBe(1000);
        expect(r.data.regularOtHours).toBe(2);
        expect(r.data.regularOtPay).toBe(3000);
      }
    });

    it('splits OT into regular + extended above the policy threshold', async () => {
      // 5h OT: 2h regular (1.5x) + 3h extended (2.0x)
      const r = await svc.computeWithPolicy(
        {
          grossMonthly: 168_000,
          workingHoursPerMonth: 168,
          timeEntries: [{ date: '2025-05-15', otHours: 5, startHour: 10 }],
        },
        defaultPolicy,
      );

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.regularOtHours).toBe(2);
        expect(r.data.extendedOtHours).toBe(3);
      }
    });

    it('routes all weekend OT to weekend bucket', async () => {
      const r = await svc.computeWithPolicy(
        {
          grossMonthly: 168_000,
          workingHoursPerMonth: 168,
          timeEntries: [{ date: '2025-05-17', otHours: 4, isWeekend: true }],
        },
        defaultPolicy,
      );

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data.weekendOtHours).toBe(4);
        expect(r.data.regularOtHours).toBe(0);
      }
    });
  });

  describe('computeBaseRate()', () => {
    it('returns gross/hours', async () => {
      const r = await svc.computeBaseRate(168_000, 168);

      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBe(1000);
    });

    it('rejects non-positive gross', async () => {
      const r = await svc.computeBaseRate(0, 168);
      expect(r.ok).toBe(false);
    });

    it('rejects non-positive workingHours', async () => {
      const r = await svc.computeBaseRate(168_000, 0);
      expect(r.ok).toBe(false);
    });
  });
});
