/**
 * @module domain-calculations.spec
 * @description Exhaustive math for tax, discount, currency conversion, time
 * delta, geo distance, depreciation, commission. Each pure function gets a
 * full matrix of inputs.
 */

import Decimal from 'decimal.js';

// ─── VAT calculation ────────────────────────────────────────────────────────

function vat(net: number, rate: number): { gross: number; tax: number } {
  const tax = new Decimal(net).times(rate).div(100);
  return { tax: tax.toNumber(), gross: new Decimal(net).plus(tax).toNumber() };
}

describe('VAT calc — matrix', () => {
  it.each([
    [100, 12, 12, 112],
    [100, 0, 0, 100],
    [100, 20, 20, 120],
    [1000, 12, 120, 1120],
    [0, 12, 0, 0],
    [99.99, 12, 11.9988, 111.9888],
    [50, 50, 25, 75],
  ])('net=%s rate=%s → tax=%s gross=%s', (n, r, et, eg) => {
    const v = vat(n, r);
    expect(v.tax).toBeCloseTo(et, 4);
    expect(v.gross).toBeCloseTo(eg, 4);
  });
});

// ─── Discount cascading ─────────────────────────────────────────────────────

function applyDiscounts(price: number, discounts: number[]): number {
  return discounts.reduce((p, d) => p * (1 - d / 100), price);
}

describe('Cascading discounts', () => {
  it.each([
    [100, [], 100],
    [100, [10], 90],
    [100, [10, 10], 81],
    [100, [50, 50], 25],
    [100, [100], 0],
    [100, [0], 100],
    [1000, [25, 20, 10], 540],
  ])('price=%s discounts=%j → %s', (p, d, expected) => {
    expect(applyDiscounts(p, d)).toBeCloseTo(expected, 2);
  });
});

// ─── Currency conversion ────────────────────────────────────────────────────

function convert(amount: number, from: string, to: string, rates: Record<string, number>): number | null {
  if (from === to) return amount;
  if (!(from in rates) || !(to in rates)) return null;
  // rates[X] = "how many UZS in 1 X"; so amount in `from` = amount*rates[from] UZS
  return new Decimal(amount).times(rates[from]).div(rates[to]).toNumber();
}

describe('Currency conversion', () => {
  const rates = { UZS: 1, USD: 12000, EUR: 13000, RUB: 130 };
  it.each([
    [100, 'UZS', 'UZS', 100],
    [12000, 'UZS', 'USD', 1],
    [1, 'USD', 'UZS', 12000],
    [1, 'USD', 'EUR', 12000 / 13000],
    [100, 'UZS', 'XXX', null],
  ] as Array<[number, string, string, number | null]>)('%s %s→%s = %s', (a, f, t, expected) => {
    const r = convert(a, f, t, rates);
    if (expected === null) expect(r).toBeNull();
    else expect(r).toBeCloseTo(expected, 4);
  });
});

// ─── Date delta in days ─────────────────────────────────────────────────────

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / 86400000);
}

describe('Days between dates', () => {
  it.each([
    ['2026-01-01', '2026-01-01', 0],
    ['2026-01-01', '2026-01-02', 1],
    ['2026-01-01', '2026-12-31', 364],
    ['2026-01-01', '2027-01-01', 365],
    ['2026-02-01', '2026-01-01', -31],
  ])('%s → %s = %i days', (a, b, expected) => {
    expect(daysBetween(new Date(a), new Date(b))).toBe(expected);
  });
});

// ─── Depreciation (straight-line) ───────────────────────────────────────────

function sld(cost: number, salvage: number, years: number): number | null {
  if (years <= 0) return null;
  if (cost < salvage) return null;
  return (cost - salvage) / years;
}

describe('Straight-line depreciation', () => {
  it.each([
    [10000, 0, 5, 2000],
    [10000, 1000, 5, 1800],
    [5000, 500, 10, 450],
    [1000, 1000, 5, 0],
  ])('cost=%i salvage=%i years=%i → %i/year', (c, s, y, expected) => {
    expect(sld(c, s, y)).toBe(expected);
  });

  it.each([
    [10000, 0, 0],
    [10000, 0, -1],
    [500, 1000, 5],
  ])('rejects invalid: cost=%s salvage=%s years=%s', (c, s, y) => {
    expect(sld(c, s, y)).toBeNull();
  });
});

// ─── Commission tiers ───────────────────────────────────────────────────────

function commission(sales: number): number {
  if (sales <= 0) return 0;
  if (sales < 10_000) return sales * 0.02;
  if (sales < 50_000) return sales * 0.05;
  if (sales < 100_000) return sales * 0.07;
  return sales * 0.10;
}

describe('Commission tiers', () => {
  it.each([
    [0, 0],
    [-100, 0],
    [1000, 20],
    [9999, 199.98],
    [10_000, 500],
    [49_999, 2499.95],
    [50_000, 3500],
    [99_999, 6999.93],
    [100_000, 10_000],
    [200_000, 20_000],
  ])('sales=%i → commission=%s', (s, expected) => {
    expect(commission(s)).toBeCloseTo(expected, 2);
  });
});

// ─── Late-fee calculator ────────────────────────────────────────────────────

function lateFee(amount: number, daysLate: number, rate = 0.001): number {
  if (daysLate <= 0) return 0;
  return amount * rate * daysLate;
}

describe('Late fee', () => {
  it.each([
    [1000, 0, 0],
    [1000, -1, 0],
    [1000, 1, 1],
    [1000, 30, 30],
    [1000, 365, 365],
    [0, 30, 0],
  ])('amount=%i days=%i → %i', (a, d, expected) => {
    expect(lateFee(a, d)).toBeCloseTo(expected, 2);
  });
});

// ─── Working hours ──────────────────────────────────────────────────────────

function workedHours(clockIn: string, clockOut: string, lunchMin = 60): number {
  const [hi, mi] = clockIn.split(':').map(Number);
  const [ho, mo] = clockOut.split(':').map(Number);
  const minutes = (ho * 60 + mo) - (hi * 60 + mi) - lunchMin;
  return Math.max(0, minutes / 60);
}

describe('Worked hours', () => {
  it.each([
    ['09:00', '18:00', 60, 8],
    ['08:00', '17:00', 60, 8],
    ['09:00', '13:00', 0, 4],
    ['09:00', '09:30', 0, 0.5],
    ['09:00', '09:00', 0, 0],
    ['18:00', '09:00', 0, 0],
  ])('in=%s out=%s lunch=%i → %s', (i, o, l, expected) => {
    expect(workedHours(i, o, l)).toBe(expected);
  });
});

// ─── Distance haversine (km) ────────────────────────────────────────────────

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (d: number) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

describe('Haversine distance', () => {
  it.each([
    [0, 0, 0, 0, 0],
    [41.3, 69.3, 41.3, 69.3, 0],   // Tashkent ↔ same
    [41.3, 69.3, 41.4, 69.3, 11.12],  // ~11 km
  ])('(%s,%s) ↔ (%s,%s) ≈ %s km', (a, b, c, d, expected) => {
    expect(haversineKm(a, b, c, d)).toBeCloseTo(expected, 0);
  });
});

// ─── Salary grade lookup ────────────────────────────────────────────────────

function gradeFromSalary(s: number): string {
  if (s < 3_000_000) return 'A';
  if (s < 6_000_000) return 'B';
  if (s < 10_000_000) return 'C';
  if (s < 20_000_000) return 'D';
  return 'E';
}

describe('Salary grades', () => {
  it.each([
    [0, 'A'], [1_000_000, 'A'], [2_999_999, 'A'],
    [3_000_000, 'B'], [5_999_999, 'B'],
    [6_000_000, 'C'], [9_999_999, 'C'],
    [10_000_000, 'D'], [19_999_999, 'D'],
    [20_000_000, 'E'], [100_000_000, 'E'],
  ])('salary=%i → %s', (s, g) => {
    expect(gradeFromSalary(s)).toBe(g);
  });
});

// ─── Stock turnover ratio ───────────────────────────────────────────────────

function turnover(cogs: number, avgInventory: number): number | null {
  if (avgInventory <= 0) return null;
  return cogs / avgInventory;
}

describe('Stock turnover', () => {
  it.each([
    [1000, 200, 5],
    [10000, 1000, 10],
    [500, 250, 2],
    [0, 100, 0],
  ])('cogs=%i avg=%i → %s', (c, i, expected) => {
    expect(turnover(c, i)).toBe(expected);
  });

  it.each([[100, 0], [100, -1]])('rejects avg=%i', (c, i) => {
    expect(turnover(c, i)).toBeNull();
  });
});
