/**
 * hr-analytics.spec.ts — Task #433 Sprint 3C
 *
 * TZ-44: Attrition va Turnover Rate
 * TZ-45: Utilizatsiya (Mashg'ulot Darajasi)
 * TZ-46: Konfiguratsiyalanadigan OT Kalkulyator (overtime_policy DB jadvalidan)
 */

jest.mock('../src/shared/db', () => {
  const chain: Record<string, unknown> = {};
  chain.select   = jest.fn().mockReturnValue(chain);
  chain.from     = jest.fn().mockReturnValue(chain);
  chain.where    = jest.fn().mockReturnValue(chain);
  chain.orderBy  = jest.fn().mockReturnValue(chain);
  chain.limit    = jest.fn().mockReturnValue(chain);
  return {
    db: chain,
    runQuery: jest.fn(),
    rawSql: jest.fn(),
  };
});

import { AttritionService } from '../src/modules/hr/analytics/attrition.service';
import { UtilizationService } from '../src/modules/hr/analytics/utilization.service';
import { OvertimeCalculatorService, OvertimePolicy } from '../src/modules/hr/domain/services/overtime-calculator.service';
import { Ok, Err, AppErr } from '../src/common/result';
import type { IHrRepo, OvertimePolicyRow } from '../src/modules/hr/domain/repositories/i-hr.repo';

const runQueryMock = jest.requireMock('../src/shared/db').runQuery as jest.Mock;

// ============================================================================
// TZ-44: Attrition va Turnover Rate
// ============================================================================
describe('AttritionService — TZ-44', () => {
  let svc: AttritionService;
  beforeEach(() => { svc = new AttritionService(); });

  it('ATR test: 10 ketgan, HC_avg=50 → ATR=20%', async () => {
    const r = await svc.calculateAttrition({
      hcBegin: 50, hcEnd: 50,
      separations: 10, resignations: 7, regretted: 3,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.annualTurnover).toBeCloseTo(20, 1);
      expect(r.data.hcAvg).toBe(50);
    }
  });

  it('HC_avg = (hcBegin + hcEnd) / 2', async () => {
    const r = await svc.calculateAttrition({
      hcBegin: 40, hcEnd: 60,
      separations: 5, resignations: 3, regretted: 1,
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.hcAvg).toBe(50);
  });

  it('Voluntary Attrition = resignations / hcAvg × 100', async () => {
    const r = await svc.calculateAttrition({
      hcBegin: 100, hcEnd: 100,
      separations: 20, resignations: 12, regretted: 5,
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.voluntaryAttrition).toBeCloseTo(12, 1);
  });

  it('Regretted Rate = regretted / separations × 100', async () => {
    const r = await svc.calculateAttrition({
      hcBegin: 100, hcEnd: 100,
      separations: 20, resignations: 10, regretted: 5,
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.regrettedRate).toBeCloseTo(25, 1);
  });

  it('ATR < 15% → HEALTHY', async () => {
    const r = await svc.calculateAttrition({
      hcBegin: 100, hcEnd: 100,
      separations: 10, resignations: 8, regretted: 2,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.status).toBe('HEALTHY');
      expect(r.data.benchmark.healthy).toBe(true);
    }
  });

  it('ATR > 30% → CRITICAL', async () => {
    const r = await svc.calculateAttrition({
      hcBegin: 50, hcEnd: 50,
      separations: 20, resignations: 15, regretted: 5,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.status).toBe('CRITICAL');
      expect(r.data.benchmark.critical).toBe(true);
    }
  });

  it('resignation > separations → xato', async () => {
    const r = await svc.calculateAttrition({
      hcBegin: 50, hcEnd: 50,
      separations: 5, resignations: 10, regretted: 0,
    });
    expect(r.ok).toBe(false);
  });

  it('manfiy HC → xato', async () => {
    const r = await svc.calculateAttrition({
      hcBegin: -10, hcEnd: 50,
      separations: 5, resignations: 3, regretted: 0,
    });
    expect(r.ok).toBe(false);
  });

  it('hcBegin=0, hcEnd=0 → xato (HC_avg=0)', async () => {
    const r = await svc.calculateAttrition({
      hcBegin: 0, hcEnd: 0,
      separations: 0, resignations: 0, regretted: 0,
    });
    expect(r.ok).toBe(false);
  });

  it('tenure distribution: staj bo\'yicha xavf guruhlash', async () => {
    const r = await svc.calculateAttrition({
      hcBegin: 100, hcEnd: 100,
      separations: 10, resignations: 6, regretted: 2,
      separationsByTenureMonths: [2, 4, 8, 12, 30, 36, 48],
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.tenureDistribution.riskHigh).toBe(2);
      expect(r.data.tenureDistribution.riskMed).toBe(2);
      expect(r.data.tenureDistribution.riskLow).toBe(3);
    }
  });

  it('survival rate: period 0 → 100%', async () => {
    const r = await svc.calculateSurvival({
      initialHeadcount: 100,
      cumulativeAttritionByPeriod: [0, 5, 10, 15],
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.survivalRates[0]).toBeCloseTo(1.0, 5);
      expect(r.data.survivalRates[1]).toBeCloseTo(0.95, 3);
    }
  });

  it('survival rate: bo\'sh davrlar → xato', async () => {
    const r = await svc.calculateSurvival({
      initialHeadcount: 100,
      cumulativeAttritionByPeriod: [],
    });
    expect(r.ok).toBe(false);
  });
});

// ============================================================================
// TZ-45: Utilizatsiya
// ============================================================================
describe('UtilizationService — TZ-45', () => {
  let svc: UtilizationService;
  beforeEach(() => { svc = new UtilizationService(); });

  it('U test: AH=160h, productive=120h → U=75%', async () => {
    const r = await svc.calculate({
      workingDays: 20,
      shiftHoursPerDay: 8,
      leaveDays: 0,
      productiveHours: 120,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.availableHours).toBe(160);
      expect(r.data.utilizationRate).toBeCloseTo(75, 1);
    }
  });

  it('AH = (workingDays - leaveDays) × shiftHours', async () => {
    const r = await svc.calculate({
      workingDays: 22,
      shiftHoursPerDay: 8,
      leaveDays: 2,
      productiveHours: 100,
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.availableHours).toBe(160);
  });

  it('U=75% → OPTIMAL (maqsad 60-85%)', async () => {
    const r = await svc.calculate({
      workingDays: 20, shiftHoursPerDay: 8,
      leaveDays: 0, productiveHours: 120,
      targetMin: 60, targetMax: 85,
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.status).toBe('OPTIMAL');
  });

  it('U=95% → OVERLOADED (>85%×1.1)', async () => {
    const r = await svc.calculate({
      workingDays: 20, shiftHoursPerDay: 8,
      leaveDays: 0, productiveHours: 152,
      targetMin: 60, targetMax: 85,
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.status).toBe('OVERLOADED');
  });

  it('U=40% → UNDERUTILIZED (<60%)', async () => {
    const r = await svc.calculate({
      workingDays: 20, shiftHoursPerDay: 8,
      leaveDays: 0, productiveHours: 64,
      targetMin: 60, targetMax: 85,
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.status).toBe('UNDERUTILIZED');
  });

  it('shiftHoursPerDay=0 → xato', async () => {
    const r = await svc.calculate({
      workingDays: 20, shiftHoursPerDay: 0,
      leaveDays: 0, productiveHours: 120,
    });
    expect(r.ok).toBe(false);
  });

  it('manfiy productive hours → xato', async () => {
    const r = await svc.calculate({
      workingDays: 20, shiftHoursPerDay: 8,
      leaveDays: 0, productiveHours: -10,
    });
    expect(r.ok).toBe(false);
  });

  it('batch: bo\'sh massiv → xato', async () => {
    const r = await svc.batchCalculate([]);
    expect(r.ok).toBe(false);
  });

  it('batch: 2 xodim → 2 natija', async () => {
    const r = await svc.batchCalculate([
      { employeeId: 'e1', workingDays: 20, shiftHoursPerDay: 8, leaveDays: 0, productiveHours: 120 },
      { employeeId: 'e2', workingDays: 20, shiftHoursPerDay: 8, leaveDays: 2, productiveHours: 80 },
    ]);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toHaveLength(2);
  });
});

// ============================================================================
// TZ-46: Konfiguratsiyalanadigan OT Kalkulyator
// ============================================================================
describe('OvertimeCalculatorService — TZ-46', () => {
  let svc: OvertimeCalculatorService;
  let mockRepo: jest.Mocked<Pick<IHrRepo, 'findActiveOvertimePolicy'>>;

  const defaultPolicy: OvertimePolicy = {
    regularOvertimeHours: 2,
    regularMultiplier: 1.5,
    extendedMultiplier: 2.0,
    weekendMultiplier: 2.0,
    nightShiftBonus: 0.5,
    nightShiftStartHour: 22,
    nightShiftEndHour: 6,
  };

  beforeEach(() => {
    mockRepo = { findActiveOvertimePolicy: jest.fn() };
    svc = new OvertimeCalculatorService(mockRepo as unknown as IHrRepo);
    runQueryMock.mockReset();
  });

  it('loadActivePolicy: overtime_policy jadvalidan faol siyosat olinadi', async () => {
    mockRepo.findActiveOvertimePolicy.mockResolvedValueOnce(Ok({
      regularOvertimeHours: 2,
      regularMultiplier: 1.5,
      extendedMultiplier: 2.0,
      weekendMultiplier: 2.0,
      nightShiftBonus: 0.5,
      nightShiftStartHour: 22,
      nightShiftEndHour: 6,
    } as OvertimePolicyRow));
    const r = await svc.loadActivePolicy();
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.regularMultiplier).toBe(1.5);
      expect(r.data.extendedMultiplier).toBe(2.0);
    }
  });

  it('loadActivePolicy: faol siyosat yo\'q → NOT_FOUND xato', async () => {
    mockRepo.findActiveOvertimePolicy.mockResolvedValueOnce(Ok(null));
    const r = await svc.loadActivePolicy();
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('calculateOtPay: DB dagi siyosatdan to\'g\'ri OT hisobi', async () => {
    const grossMonthly = 5000000;
    const wh = 176;
    const baseRate = grossMonthly / wh;
    mockRepo.findActiveOvertimePolicy.mockResolvedValueOnce(Ok({
      regularOvertimeHours: 2, regularMultiplier: 1.5,
      extendedMultiplier: 2.0, weekendMultiplier: 2.0,
      nightShiftBonus: 0.5, nightShiftStartHour: 22, nightShiftEndHour: 6,
    } as OvertimePolicyRow));
    const r = await svc.calculateOtPay({
      grossMonthly,
      workingHoursPerMonth: wh,
      timeEntries: [{ date: '2025-03-10', otHours: 2, isWeekend: false }],
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.regularOtHours).toBe(2);
      expect(r.data.regularOtPay).toBeCloseTo(2 * baseRate * 1.5, 1);
    }
  });

  it('calculateOtPay: DB da siyosat yo\'q → xato', async () => {
    mockRepo.findActiveOvertimePolicy.mockResolvedValueOnce(Ok(null));
    const r = await svc.calculateOtPay({
      grossMonthly: 5000000,
      workingHoursPerMonth: 176,
      timeEntries: [],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('calculateOtPay: DB multiplier o\'zgarganda natija o\'zgaradi', async () => {
    const grossMonthly = 5000000;
    const wh = 176;
    const baseRate = grossMonthly / wh;

    mockRepo.findActiveOvertimePolicy.mockResolvedValueOnce(Ok({
      regularOvertimeHours: 2, regularMultiplier: 2.0,
      extendedMultiplier: 3.0, weekendMultiplier: 2.5,
      nightShiftBonus: 0.5, nightShiftStartHour: 22, nightShiftEndHour: 6,
    } as OvertimePolicyRow));
    const r = await svc.calculateOtPay({
      grossMonthly,
      workingHoursPerMonth: wh,
      timeEntries: [{ date: '2025-03-10', otHours: 1, isWeekend: false }],
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.regularOtPay).toBeCloseTo(1 * baseRate * 2.0, 1);
    }
  });

  it('Base_Rate = grossMonthly / workingHoursPerMonth', async () => {
    const r = await svc.computeBaseRate(5000000, 176);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toBeCloseTo(5000000 / 176, 1);
  });

  it('computeWithPolicy: 3 soat OT: 2 regular (1.5×) + 1 extended (2×)', async () => {
    const grossMonthly = 5000000;
    const wh = 176;
    const baseRate = grossMonthly / wh;
    const r = await svc.computeWithPolicy(
      { grossMonthly, workingHoursPerMonth: wh, timeEntries: [{ date: '2025-03-10', otHours: 3, isWeekend: false }] },
      defaultPolicy,
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.regularOtHours).toBe(2);
      expect(r.data.extendedOtHours).toBe(1);
      expect(r.data.regularOtPay).toBeCloseTo(2 * baseRate * 1.5, 1);
      expect(r.data.extendedOtPay).toBeCloseTo(1 * baseRate * 2.0, 1);
    }
  });

  it('computeWithPolicy: dam olish kuni OT → weekendOtHours + weekendOtPay', async () => {
    const grossMonthly = 5000000;
    const wh = 176;
    const baseRate = grossMonthly / wh;
    const r = await svc.computeWithPolicy(
      { grossMonthly, workingHoursPerMonth: wh, timeEntries: [{ date: '2025-03-09', otHours: 4, isWeekend: true }] },
      defaultPolicy,
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.weekendOtHours).toBe(4);
      expect(r.data.weekendOtPay).toBeCloseTo(4 * baseRate * 2.0, 1);
      expect(r.data.regularOtHours).toBe(0);
    }
  });

  it('computeWithPolicy: tungi soat bonus mavjud', async () => {
    const r = await svc.computeWithPolicy(
      {
        grossMonthly: 5000000, workingHoursPerMonth: 176,
        timeEntries: [{ date: '2025-03-10', otHours: 2, startHour: 22, endHour: 24, isWeekend: false }],
      },
      defaultPolicy,
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.nightBonusHours).toBeGreaterThan(0);
      expect(r.data.nightBonusPay).toBeGreaterThan(0);
    }
  });

  it('computeWithPolicy: totalOtPay = sum of all components', async () => {
    const r = await svc.computeWithPolicy(
      {
        grossMonthly: 5000000, workingHoursPerMonth: 176,
        timeEntries: [
          { date: '2025-03-10', otHours: 3, isWeekend: false },
          { date: '2025-03-09', otHours: 2, isWeekend: true },
        ],
      },
      defaultPolicy,
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      const expected = r.data.regularOtPay + r.data.extendedOtPay + r.data.weekendOtPay + r.data.nightBonusPay;
      expect(r.data.totalOtPay).toBeCloseTo(expected, 1);
    }
  });

  it('computeWithPolicy: grossMonthly=0 → xato', async () => {
    const r = await svc.computeWithPolicy(
      { grossMonthly: 0, workingHoursPerMonth: 176, timeEntries: [] },
      defaultPolicy,
    );
    expect(r.ok).toBe(false);
  });

  it('computeWithPolicy: regularMultiplier < 1.0 → xato', async () => {
    const r = await svc.computeWithPolicy(
      { grossMonthly: 5000000, workingHoursPerMonth: 176, timeEntries: [{ date: '2025-03-10', otHours: 2, isWeekend: false }] },
      { ...defaultPolicy, regularMultiplier: 0.8 },
    );
    expect(r.ok).toBe(false);
  });

  it('computeWithPolicy: extendedMultiplier < regularMultiplier → xato', async () => {
    const r = await svc.computeWithPolicy(
      { grossMonthly: 5000000, workingHoursPerMonth: 176, timeEntries: [{ date: '2025-03-10', otHours: 2, isWeekend: false }] },
      { ...defaultPolicy, regularMultiplier: 2.0, extendedMultiplier: 1.5 },
    );
    expect(r.ok).toBe(false);
  });

  it('computeWithPolicy: policySnapshot qaytariladi (audit)', async () => {
    const r = await svc.computeWithPolicy(
      { grossMonthly: 5000000, workingHoursPerMonth: 176, timeEntries: [{ date: '2025-03-10', otHours: 1, isWeekend: false }] },
      defaultPolicy,
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.policySnapshot.regularMultiplier).toBe(1.5);
  });

  it('computeWithPolicy: bo\'sh timeEntries → totalOtPay = 0', async () => {
    const r = await svc.computeWithPolicy(
      { grossMonthly: 5000000, workingHoursPerMonth: 176, timeEntries: [] },
      defaultPolicy,
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.totalOtPay).toBe(0);
  });
});
