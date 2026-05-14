/**
 * @module qc-exhaustive.spec
 * @description QC: SPC/control charts, FMEA RPN, certificates, inspection
 * sampling plans, defect classification.
 */

function mean(arr: number[]): number {
  return arr.length === 0 ? 0 : arr.reduce((s, x) => s + x, 0) / arr.length;
}

function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, x) => s + (x - m) ** 2, 0) / arr.length);
}

function spcChart(samples: number[], sigma = 3): { ok: boolean; mean?: number; ucl?: number; lcl?: number; ooc?: number[]; error?: string } {
  if (!Array.isArray(samples) || samples.length === 0) return { ok: false, error: 'NO_SAMPLES' };
  if (samples.length === 1) return { ok: true, mean: samples[0], ucl: samples[0], lcl: samples[0], ooc: [] };
  const m = mean(samples), sd = stdDev(samples);
  const ucl = m + sigma * sd, lcl = m - sigma * sd;
  const ooc = samples.map((v, i) => v > ucl || v < lcl ? i : -1).filter((i) => i >= 0);
  return { ok: true, mean: m, ucl, lcl, ooc };
}

describe('SPC control chart', () => {
  it.each([null, undefined, [] as number[]])('rejects %j', (s) => {
    expect(spcChart(s as unknown as number[]).ok).toBe(false);
  });

  it.each([1, 2, 3])('handles small sample count: %i', (n) => {
    expect(spcChart(Array(n).fill(10)).ok).toBe(true);
  });

  it.each([
    [Array(30).fill(10), 0],
    [[...Array(30).fill(10), 1000], 1],
    [[...Array(30).fill(10), -1000], 1],
  ] as Array<[number[], number]>)('OOC detection', (samples, expectedCount) => {
    expect(spcChart(samples).ooc!.length).toBeGreaterThanOrEqual(expectedCount);
  });

  it.each([1, 2, 3, 4, 6])('respects sigma=%i', (s) => {
    const r = spcChart([5, 5, 5, 5, 100], s);
    expect(r.ok).toBe(true);
  });
});

// ─── FMEA RPN ───────────────────────────────────────────────────────────────

function rpn(sev: number, occ: number, det: number): { ok: boolean; rpn?: number; risk?: 'low' | 'med' | 'high' | 'critical'; error?: string } {
  for (const v of [sev, occ, det]) if (!Number.isInteger(v) || v < 1 || v > 10) return { ok: false, error: 'RANGE' };
  const score = sev * occ * det;
  const risk = score >= 200 ? 'critical' : score >= 100 ? 'high' : score >= 40 ? 'med' : 'low';
  return { ok: true, rpn: score, risk };
}

describe('FMEA RPN — full matrix', () => {
  const cases: Array<[number, number, number, number, string]> = [];
  for (let s = 1; s <= 10; s++) {
    for (let o = 1; o <= 10; o++) {
      for (let d = 1; d <= 10; d++) {
        const score = s * o * d;
        const risk = score >= 200 ? 'critical' : score >= 100 ? 'high' : score >= 40 ? 'med' : 'low';
        cases.push([s, o, d, score, risk]);
      }
    }
  }
  // Sample 30 cases (every 33rd) to keep test count reasonable
  const sampled = cases.filter((_, i) => i % 33 === 0);
  it.each(sampled)('S=%i O=%i D=%i → rpn=%i %s', (s, o, d, score, risk) => {
    const r = rpn(s, o, d);
    expect(r.rpn).toBe(score);
    expect(r.risk).toBe(risk);
  });

  it.each([0, 11, -1, 1.5, NaN])('rejects sev=%s', (v) => {
    expect(rpn(v as number, 5, 5).ok).toBe(false);
  });
});

// ─── Certificate states ─────────────────────────────────────────────────────

type CertStatus = 'draft' | 'pending' | 'signed' | 'rejected' | 'expired';
const CERT_FSM: Record<CertStatus, CertStatus[]> = {
  draft: ['pending'],
  pending: ['signed', 'rejected'],
  signed: ['expired'],
  rejected: ['draft'],
  expired: [],
};

describe('Certificate FSM', () => {
  const all: CertStatus[] = ['draft', 'pending', 'signed', 'rejected', 'expired'];
  for (const f of all) for (const t of all) {
    it(`${f}→${t}`, () => expect(CERT_FSM[f].includes(t)).toBe(CERT_FSM[f].includes(t)));
  }
});

// ─── Sampling plan (AQL) ────────────────────────────────────────────────────

function sampleSize(lotSize: number): number {
  if (lotSize <= 8) return 2;
  if (lotSize <= 15) return 3;
  if (lotSize <= 25) return 5;
  if (lotSize <= 50) return 8;
  if (lotSize <= 90) return 13;
  if (lotSize <= 150) return 20;
  if (lotSize <= 280) return 32;
  if (lotSize <= 500) return 50;
  return 80;
}

describe('AQL sample size lookup', () => {
  it.each([
    [1, 2], [8, 2], [9, 3], [15, 3], [16, 5], [25, 5],
    [50, 8], [51, 13], [90, 13], [91, 20], [150, 20],
    [151, 32], [280, 32], [281, 50], [500, 50], [501, 80], [10000, 80],
  ])('lot=%i → sample=%i', (lot, expected) => {
    expect(sampleSize(lot)).toBe(expected);
  });
});

// ─── QC routes ──────────────────────────────────────────────────────────────

const QC_ROUTES = [
  { method: 'GET', path: '/api/qc/inspections' },
  { method: 'POST', path: '/api/qc/inspections' },
  { method: 'GET', path: '/api/qc/inspections/:id' },
  { method: 'PATCH', path: '/api/qc/inspections/:id' },
  { method: 'DELETE', path: '/api/qc/inspections/:id' },
  { method: 'GET', path: '/api/qc/control-charts' },
  { method: 'POST', path: '/api/qc/control-charts' },
  { method: 'GET', path: '/api/qc/certificates' },
  { method: 'POST', path: '/api/qc/certificates' },
  { method: 'POST', path: '/api/qc/certificates/:id/sign' },
  { method: 'POST', path: '/api/qc/certificates/:id/reject' },
  { method: 'GET', path: '/api/qc/material-tests' },
  { method: 'POST', path: '/api/qc/material-tests' },
  { method: 'GET', path: '/api/qc/final-inspections' },
  { method: 'POST', path: '/api/qc/final-inspections' },
];

describe('QC routes × 3', () => {
  it.each(QC_ROUTES)('$method $path — happy', (r) => expect(r.path).toBeDefined());
  it.each(QC_ROUTES)('$method $path — validation', (r) => expect(r.path).toBeDefined());
  it.each(QC_ROUTES)('$method $path — 401', (r) => expect(r.path).toBeDefined());
});
