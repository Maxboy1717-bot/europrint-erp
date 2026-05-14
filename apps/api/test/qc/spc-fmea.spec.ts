/**
 * test/qc/spc-fmea.spec.ts
 *
 * Statistical Process Control (SPC) and FMEA (Failure Mode & Effects Analysis).
 */

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, x) => s + x, 0) / arr.length;
}

function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const sq = arr.map((x) => (x - m) ** 2);
  return Math.sqrt(sq.reduce((s, x) => s + x, 0) / arr.length);
}

interface ControlChartResult {
  mean: number;
  ucl: number;
  lcl: number;
  outOfControl: number[];
}

function buildControlChart(samples: number[]): { ok: boolean; result?: ControlChartResult; error?: string } {
  if (!Array.isArray(samples)) return { ok: false, error: 'NO_SAMPLES' };
  if (samples.length === 0) return { ok: false, error: 'NO_SAMPLES' };
  if (samples.length === 1) return { ok: true, result: { mean: samples[0], ucl: samples[0], lcl: samples[0], outOfControl: [] } };
  const m = mean(samples);
  const sd = stdDev(samples);
  const ucl = m + 3 * sd;
  const lcl = m - 3 * sd;
  const outOfControl = samples
    .map((v, i) => (v > ucl || v < lcl ? i : -1))
    .filter((i) => i >= 0);
  return { ok: true, result: { mean: m, ucl, lcl, outOfControl } };
}

describe('SPC control chart', () => {
  it('rejects empty samples', () => {
    expect(buildControlChart([]).error).toBe('NO_SAMPLES');
  });

  it('rejects null samples', () => {
    expect(buildControlChart(null as unknown as number[]).error).toBe('NO_SAMPLES');
  });

  it('single point: ucl=lcl=value, sd=0', () => {
    const r = buildControlChart([5]);
    expect(r.ok).toBe(true);
    expect(r.result!.mean).toBe(5);
    expect(r.result!.ucl).toBe(5);
    expect(r.result!.lcl).toBe(5);
  });

  it('flat samples → ucl=lcl=mean, no OOC', () => {
    const r = buildControlChart([10, 10, 10, 10]);
    expect(r.result!.outOfControl).toEqual([]);
  });

  it('detects out-of-control point when value is far outside 3σ', () => {
    // With many stable samples, a single huge spike must trip 3-sigma.
    // 30 samples at 10, plus one at 1000 → SD is dominated by the outlier
    // but the outlier itself far exceeds UCL.
    const samples = [...Array(30).fill(10), 1000];
    const r = buildControlChart(samples);
    expect(r.result!.outOfControl).toContain(30);
  });

  it('mean is robust against ordering', () => {
    expect(mean([1, 2, 3, 4, 5])).toBe(3);
    expect(mean([5, 4, 3, 2, 1])).toBe(3);
  });
});

// ─── FMEA Risk Priority Number ──────────────────────────────────────────────

function rpn(severity: number, occurrence: number, detection: number): { ok: boolean; rpn?: number; risk?: 'low' | 'med' | 'high' | 'critical'; error?: string } {
  for (const v of [severity, occurrence, detection]) {
    if (!Number.isFinite(v) || v < 1 || v > 10) return { ok: false, error: 'OUT_OF_RANGE' };
  }
  const score = severity * occurrence * detection;
  const risk: 'low' | 'med' | 'high' | 'critical' =
    score >= 200 ? 'critical' : score >= 100 ? 'high' : score >= 40 ? 'med' : 'low';
  return { ok: true, rpn: score, risk };
}

describe('FMEA RPN', () => {
  it('all 1s → low risk, rpn 1', () => {
    const r = rpn(1, 1, 1);
    expect(r.rpn).toBe(1);
    expect(r.risk).toBe('low');
  });

  it('all 10s → critical, rpn 1000', () => {
    const r = rpn(10, 10, 10);
    expect(r.rpn).toBe(1000);
    expect(r.risk).toBe('critical');
  });

  it.each([
    [5, 5, 5, 125, 'high'],
    [4, 4, 3, 48, 'med'],
    [2, 2, 2, 8, 'low'],
    [10, 10, 2, 200, 'critical'],
  ] as Array<[number, number, number, number, string]>)('rpn(%i,%i,%i) = %i / %s', (s, o, d, expectedRpn, expectedRisk) => {
    const r = rpn(s, o, d);
    expect(r.rpn).toBe(expectedRpn);
    expect(r.risk).toBe(expectedRisk);
  });

  it('rejects values outside [1,10]', () => {
    expect(rpn(0, 5, 5).ok).toBe(false);
    expect(rpn(5, 11, 5).ok).toBe(false);
    expect(rpn(-1, 5, 5).ok).toBe(false);
  });
});
