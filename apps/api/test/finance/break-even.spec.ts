/**
 * test/finance/break-even.spec.ts
 *
 * Pure-math break-even calculations. Independent of any service / DB so we
 * inline the formula and exercise the edge cases the business cares about.
 *
 * BE units  = fixedCost / (price − variableCost)
 * BE revenue = BE units * price
 */

import Decimal from 'decimal.js';

interface BreakEvenInput {
  fixedCost: number;
  pricePerUnit: number;
  variableCostPerUnit: number;
}

interface BreakEvenResult {
  ok: boolean;
  units?: number;
  revenue?: number;
  error?: string;
}

function calcBreakEven(input: BreakEvenInput): BreakEvenResult {
  const { fixedCost, pricePerUnit, variableCostPerUnit } = input;
  if (!Number.isFinite(fixedCost) || !Number.isFinite(pricePerUnit) || !Number.isFinite(variableCostPerUnit)) {
    return { ok: false, error: 'NON_FINITE_INPUT' };
  }
  if (fixedCost < 0) return { ok: false, error: 'NEGATIVE_FIXED_COST' };
  const contribution = new Decimal(pricePerUnit).minus(variableCostPerUnit);
  if (contribution.lte(0)) return { ok: false, error: 'NO_BREAK_EVEN' };
  const units = new Decimal(fixedCost).dividedBy(contribution);
  const revenue = units.times(pricePerUnit);
  return { ok: true, units: units.toNumber(), revenue: revenue.toNumber() };
}

describe('Break-even calc', () => {
  it('classical example: BE = 10000 / (50 - 30) = 500 units', () => {
    const r = calcBreakEven({ fixedCost: 10000, pricePerUnit: 50, variableCostPerUnit: 30 });
    expect(r.ok).toBe(true);
    expect(r.units).toBe(500);
    expect(r.revenue).toBe(25000);
  });

  it('returns 0 units when fixedCost = 0', () => {
    const r = calcBreakEven({ fixedCost: 0, pricePerUnit: 10, variableCostPerUnit: 5 });
    expect(r.ok).toBe(true);
    expect(r.units).toBe(0);
    expect(r.revenue).toBe(0);
  });

  it('NO_BREAK_EVEN when contribution ≤ 0 (price < variable cost)', () => {
    const r = calcBreakEven({ fixedCost: 1000, pricePerUnit: 5, variableCostPerUnit: 10 });
    expect(r.ok).toBe(false);
    expect(r.error).toBe('NO_BREAK_EVEN');
  });

  it('NO_BREAK_EVEN when contribution = 0', () => {
    const r = calcBreakEven({ fixedCost: 1000, pricePerUnit: 10, variableCostPerUnit: 10 });
    expect(r.ok).toBe(false);
    expect(r.error).toBe('NO_BREAK_EVEN');
  });

  it('rejects negative fixed cost', () => {
    const r = calcBreakEven({ fixedCost: -1, pricePerUnit: 10, variableCostPerUnit: 5 });
    expect(r.ok).toBe(false);
    expect(r.error).toBe('NEGATIVE_FIXED_COST');
  });

  it('rejects NaN / Infinity inputs', () => {
    expect(calcBreakEven({ fixedCost: NaN, pricePerUnit: 10, variableCostPerUnit: 5 }).ok).toBe(false);
    expect(calcBreakEven({ fixedCost: 1, pricePerUnit: Infinity, variableCostPerUnit: 5 }).ok).toBe(false);
  });

  it('maintains precision with decimal margins', () => {
    const r = calcBreakEven({ fixedCost: 100, pricePerUnit: 3.30, variableCostPerUnit: 3.20 });
    expect(r.ok).toBe(true);
    expect(r.units).toBeCloseTo(1000, 5);
  });
});

describe('Payroll calc (gross → net)', () => {
  // From CLAUDE.md: INCOME_TAX_RATE = 0.12, INPS deductions follow constants.
  const INCOME_TAX_RATE = 0.12;
  const INPS_RATE = 0.08;

  function calcNetSalary(gross: number): { ok: boolean; net?: number; error?: string } {
    if (!Number.isFinite(gross)) return { ok: false, error: 'NON_FINITE' };
    if (gross < 0) return { ok: false, error: 'NEGATIVE_GROSS' };
    const tax = new Decimal(gross).times(INCOME_TAX_RATE);
    const inps = new Decimal(gross).times(INPS_RATE);
    const net = new Decimal(gross).minus(tax).minus(inps);
    return { ok: true, net: net.toNumber() };
  }

  it('gross 1000 → tax 120 + INPS 80 → net 800', () => {
    const r = calcNetSalary(1000);
    expect(r.ok).toBe(true);
    expect(r.net).toBeCloseTo(800, 4);
  });

  it('zero gross → zero net', () => {
    expect(calcNetSalary(0).net).toBe(0);
  });

  it('rejects negative gross', () => {
    expect(calcNetSalary(-100).ok).toBe(false);
  });

  it('large amounts stay precise', () => {
    expect(calcNetSalary(10_000_000).net).toBeCloseTo(8_000_000, 4);
  });
});
