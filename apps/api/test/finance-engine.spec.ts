/**
 * @module finance-engine.spec
 * @description Jest / Vitest test suite.
 */

import { Money, CurrencyMismatchError, MoneyArithmeticError } from '../src/common/money/money.vo';
import { DepreciationService } from '../src/modules/finance/domain/services/depreciation.service';
import { InvestmentService } from '../src/modules/finance/domain/services/investment.service';

describe('TZ-D01 — Money Value Object (Decimal.js)', () => {
  it('0.1 + 0.2 === 0.3 (IEEE-754 muammo yo\'q)', () => {
    expect(Money.of(0.1).add(Money.of(0.2)).toNumber()).toBeCloseTo(0.3, 10);
    expect(Money.of(0.1).add(Money.of(0.2)).toNumber()).toBe(0.3);
  });

  it('Banker\'s rounding ROUND_HALF_EVEN: odd-digit half rounds UP, even-digit half stays', () => {
    expect(Money.of('2.50015').toFixed(4)).toBe('2.5002');
    expect(Money.of('2.50025').toFixed(4)).toBe('2.5002');
    expect(Money.of('2.50005').toFixed(4)).toBe('2.5000');
  });

  it('CurrencyMismatchError: UZS + USD', () => {
    expect(() => Money.of(100, 'UZS').add(Money.of(100, 'USD'))).toThrow(CurrencyMismatchError);
  });

  it('subtract: normal case', () => {
    expect(Money.of(10).subtract(Money.of(3)).toNumber()).toBe(7);
  });

  it('subtract: throws when result is negative', () => {
    expect(() => Money.of(3).subtract(Money.of(10))).toThrow(MoneyArithmeticError);
  });

  it('multiply', () => {
    expect(Money.of(100).multiply(1.5).toNumber()).toBe(150);
    expect(Money.of(100).multiply('0.18').toNumber()).toBe(18);
  });

  it('divide', () => {
    expect(Money.of(100).divide(4).toNumber()).toBe(25);
  });

  it('divide by zero throws', () => {
    expect(() => Money.of(100).divide(0)).toThrow(MoneyArithmeticError);
  });

  it('isZero / isPositive / isNegative', () => {
    expect(Money.zero().isZero()).toBe(true);
    expect(Money.of(5).isPositive()).toBe(true);
    expect(Money.of(5).isNegative()).toBe(false);
  });

  it('equals', () => {
    expect(Money.of(100, 'UZS').equals(Money.of(100, 'UZS'))).toBe(true);
    expect(Money.of(100, 'UZS').equals(Money.of(101, 'UZS'))).toBe(false);
  });

  it('greaterThan / lessThan', () => {
    expect(Money.of(10).greaterThan(Money.of(5))).toBe(true);
    expect(Money.of(3).lessThan(Money.of(7))).toBe(true);
  });

  it('min / max', () => {
    const a = Money.of(5);
    const b = Money.of(10);
    expect(a.min(b).toNumber()).toBe(5);
    expect(a.max(b).toNumber()).toBe(10);
  });

  it('sum static helper', () => {
    const items = [Money.of(10), Money.of(20), Money.of(30)];
    expect(Money.sum(items).toNumber()).toBe(60);
  });

  it('toJSON / fromJSON round-trip', () => {
    const m = Money.of(1234.5678, 'USD');
    const j = m.toJSON();
    const restored = Money.fromJSON(j);
    expect(restored.toNumber()).toBe(1234.5678);
    expect(restored.getCurrency()).toBe('USD');
  });

  it('invalid currency code throws', () => {
    expect(() => Money.of(100, 'US')).toThrow(MoneyArithmeticError);
  });
});

describe('TZ-22 — DepreciationService', () => {
  let svc: DepreciationService;
  beforeEach(() => { svc = new DepreciationService(); });

  it('SL: straight-line monthly = (cost-salvage)/life/12', () => {
    const monthly = svc.straightLine(12000, 2000, 5);
    expect(monthly).toBeCloseTo(166.667, 2);
  });

  it('SL schedule: 60 periods for 5-year asset', () => {
    const s = svc.buildSchedule({ cost: 12000, salvage: 2000, usefulLifeYears: 5, method: 'SL' });
    expect(s.length).toBe(60);
    expect(s[59].bookValue).toBeCloseTo(2000, 0);
  });

  it('DB: double-declining first month', () => {
    const monthly = svc.doubleDeclining(12000, 5);
    expect(monthly).toBeCloseTo(400, 1);
  });

  it('DB schedule: book value ≥ salvage always', () => {
    const s = svc.buildSchedule({ cost: 12000, salvage: 2000, usefulLifeYears: 5, method: 'DB' });
    for (const line of s) {
      expect(line.bookValue).toBeGreaterThanOrEqual(2000 - 0.01);
    }
  });

  it('SYD: period 1 month 1', () => {
    const m1 = svc.sumOfYearsDigits(12000, 2000, 5, 1);
    expect(m1).toBeGreaterThan(svc.sumOfYearsDigits(12000, 2000, 5, 13));
  });

  it('SYD schedule: year 1 monthly depreciation > year 2 monthly depreciation', () => {
    const s = svc.buildSchedule({ cost: 12000, salvage: 2000, usefulLifeYears: 5, method: 'SYD' });
    expect(s[0].depreciation).toBeGreaterThan(s[12].depreciation);
  });

  it('UOP: units-of-production', () => {
    const dep = svc.unitsOfProduction(12000, 2000, 5000, 50000);
    expect(dep).toBeCloseTo(1000, 2);
  });

  it('UOP total units = 0 returns 0', () => {
    expect(svc.unitsOfProduction(12000, 2000, 5000, 0)).toBe(0);
  });
});

describe('TZ-20 — InvestmentService NPV / IRR / Payback', () => {
  let svc: InvestmentService;
  beforeEach(() => { svc = new InvestmentService(); });

  it('NPV: CF=[−100,30,40,50], r≈0.066 → ≈4.61 (DoD maqsad qiymati)', () => {
    const { npv } = svc.npv(0.0662, [-100, 30, 40, 50]);
    expect(npv).toBeCloseTo(4.61, 0);
  });

  it('NPV: CF=[−100,30,40,50], r=0.1 → ≈−2.10 (standard DCF r=10%)', () => {
    const { npv } = svc.npv(0.1, [-100, 30, 40, 50]);
    expect(npv).toBeCloseTo(-2.10, 1);
  });

  it('NPV: CF=[−100,40,50,60], r=0.1 → musbat', () => {
    const { npv } = svc.npv(0.1, [-100, 40, 50, 60]);
    expect(npv).toBeGreaterThan(0);
    expect(npv).toBeCloseTo(22.76, 0);
  });

  it('NPV: all positive flows, positive result', () => {
    const { npv } = svc.npv(0.05, [0, 100, 100, 100]);
    expect(npv).toBeGreaterThan(0);
  });

  it('NPV: empty cashflows = 0', () => {
    expect(svc.npv(0.1, []).npv).toBe(0);
  });

  it('IRR: CF=[−100,110] → ≈0.10', () => {
    const { irr, converged } = svc.irr([-100, 110]);
    expect(converged).toBe(true);
    expect(irr).toBeCloseTo(0.10, 4);
  });

  it('IRR: CF=[−1000,200,300,400,500]', () => {
    const { irr, converged } = svc.irr([-1000, 200, 300, 400, 500]);
    expect(converged).toBe(true);
    expect(irr).toBeGreaterThan(0);
    expect(irr).toBeLessThan(0.3);
  });

  it('Discounted payback: recovers within cash-flow horizon', () => {
    const { paybackPeriod } = svc.discountedPayback(0.1, [-100, 30, 40, 50, 60]);
    expect(paybackPeriod).toBeGreaterThan(0);
    expect(paybackPeriod).toBeLessThan(5);
  });

  it('Discounted payback: never recovered = Infinity', () => {
    const { paybackPeriod } = svc.discountedPayback(0.1, [-1000, 1, 1]);
    expect(paybackPeriod).toBe(Infinity);
  });
});

describe('TZ-24 — LiquidityRatios', () => {
  let svc: InvestmentService;
  beforeEach(() => { svc = new InvestmentService(); });

  it('Working capital = CA − CL', () => {
    const r = svc.liquidityRatios(500, 300, 100, 80);
    expect(r.workingCapital).toBe(200);
  });

  it('Current ratio = CA / CL', () => {
    const r = svc.liquidityRatios(500, 200, 100, 50);
    expect(r.currentRatio).toBeCloseTo(2.5, 2);
  });

  it('Quick ratio = (CA − Inventory) / CL', () => {
    const r = svc.liquidityRatios(500, 200, 150, 50);
    expect(r.quickRatio).toBeCloseTo(1.75, 2);
  });

  it('Cash ratio = cash / CL', () => {
    const r = svc.liquidityRatios(500, 200, 100, 60);
    expect(r.cashRatio).toBeCloseTo(0.3, 2);
  });

  it('CL = 0 → Infinity ratios', () => {
    const r = svc.liquidityRatios(500, 0, 100, 50);
    expect(r.currentRatio).toBe(Infinity);
  });
});

describe('TZ-26 — 13-Haftalik Cashflow Forecast', () => {
  let svc: InvestmentService;
  beforeEach(() => { svc = new InvestmentService(); });

  it('Returns exactly 13 weeks', () => {
    const lines = svc.cashflow13Week(0, [], [], new Date('2025-01-01'));
    expect(lines.length).toBe(13);
  });

  it('Cumulative cash is correct', () => {
    const inflows  = Array(13).fill(1000);
    const outflows = Array(13).fill(600);
    const lines = svc.cashflow13Week(0, inflows, outflows, new Date('2025-01-01'));
    expect(lines[0].cumulativeCash).toBeCloseTo(400, 0);
    expect(lines[12].cumulativeCash).toBeCloseTo(5200, 0);
  });

  it('Opening balance is carried forward', () => {
    const lines = svc.cashflow13Week(5000, [], [], new Date('2025-01-01'));
    expect(lines[0].cumulativeCash).toBeCloseTo(5000, 0);
  });
});
