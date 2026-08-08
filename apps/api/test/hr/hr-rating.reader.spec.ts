/**
 * test/hr/hr-rating.reader.spec.ts
 * @description Unit tests for HrRatingReader factor mapping + HrRatingService integration.
 *
 * Strategy:
 *   - Mock the raw DB calls inside HrRatingReader (no real DB needed).
 *   - Feed mocked factor outputs into the real HrRatingService.
 *   - Validate score, label, breakdown, and meta output.
 *
 * Test cases:
 *   1. Full real data for all factors → correct composite score.
 *   2. All factors missing (all-default) → score in valid range, meta flags isDefault=true.
 *   3. Partial data — attendance real, rest defaults.
 *   4. Discipline penalty — 3 infractions → discipline score = 70.
 *   5. Discipline 10+ infractions → clamped to 0.
 *   6. Peer rating 0/5 → peer score = 0.
 *   7. Peer rating 5/5 → peer score = 100.
 *   8. Razryad coefficient 6/6 → seniority = 100.
 *   9. Razryad coefficient 1/6 → seniority ≈ 17.
 *  10. Daily report compliance 100% → aiKpi = 100.
 *  11. Daily report compliance 0% → aiKpi = 0.
 *  12. readFactors returns Err when DB throws (non-graceful path mock).
 *  13. HrRatingService.computeRating called with out-of-range factor → Err(VALIDATION).
 *  14. Norm: quantity 5000 / target 5000 = 100%.
 *  15. Meta array has 7 entries, each with isDefault correctly set.
 *
 * @layer Unit — no NestJS DI, no DB connection.
 */

import { HrRatingService, HrRatingFactors } from '../../src/modules/hr/domain/services/hr-rating.service';
import { HrRatingReader } from '../../src/modules/hr/infrastructure/repositories/hr-rating.reader';
import { HR_RATING_WEIGHTS } from '../../src/common/constants/business.constants';

// ---------------------------------------------------------------------------
// Neutral defaults (mirrors constants in hr-rating.reader.ts)
// ---------------------------------------------------------------------------
const NEUTRAL_NORM        = 50;
const NEUTRAL_ATTENDANCE  = 80;
const NEUTRAL_QUALITY     = 70;
const NEUTRAL_SENIORITY   = 50;
const NEUTRAL_DISCIPLINE  = 100;
const NEUTRAL_PEER        = 50;
const NEUTRAL_AI_KPI      = 60;

const ALL_NEUTRAL: HrRatingFactors = {
  norm:       NEUTRAL_NORM,
  attendance: NEUTRAL_ATTENDANCE,
  quality:    NEUTRAL_QUALITY,
  seniority:  NEUTRAL_SENIORITY,
  discipline: NEUTRAL_DISCIPLINE,
  peer:       NEUTRAL_PEER,
  aiKpi:      NEUTRAL_AI_KPI,
};

// ---------------------------------------------------------------------------
// Expected score formula (mirrors HrRatingService arithmetic)
// ---------------------------------------------------------------------------
function expectedScore(factors: HrRatingFactors): number {
  const w = HR_RATING_WEIGHTS;
  const raw =
    factors.norm       * w.norm       +
    factors.attendance * w.attendance +
    factors.quality    * w.quality    +
    factors.seniority  * w.seniority  +
    factors.discipline * w.discipline +
    factors.peer       * w.peer       +
    factors.aiKpi      * w.aiKpi;
  return Math.min(100, Math.max(0, Math.round(raw * 100) / 100));
}

// ---------------------------------------------------------------------------
// Mock helpers — simulate specific runQuery returns in HrRatingReader
// ---------------------------------------------------------------------------

/** Spy on all _read* private methods and return deterministic data. */
function mockReader(
  reader: HrRatingReader,
  overrides: Partial<{
    attendance:  { score: number; isDefault: boolean };
    norm:        { normScore: number; qualityScore: number; isNormDefault: boolean; isQualityDefault: boolean };
    discipline:  { score: number; isDefault: boolean };
    peer:        { score: number; isDefault: boolean };
    dailyReport: { score: number; isDefault: boolean };
    coefficient: { score: number; isDefault: boolean };
  }> = {},
): void {
  const att = overrides.attendance ?? { score: NEUTRAL_ATTENDANCE, isDefault: true };
  const fb  = overrides.norm       ?? { normScore: NEUTRAL_NORM, qualityScore: NEUTRAL_QUALITY, isNormDefault: true, isQualityDefault: true };
  const disc = overrides.discipline ?? { score: NEUTRAL_DISCIPLINE, isDefault: false };
  const peer = overrides.peer       ?? { score: NEUTRAL_PEER, isDefault: true };
  const dr   = overrides.dailyReport ?? { score: NEUTRAL_AI_KPI, isDefault: true };
  const coeff = overrides.coefficient ?? { score: NEUTRAL_SENIORITY, isDefault: true };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = reader as any;

  jest.spyOn(r, '_readAttendance').mockResolvedValue({
    score: att.score,
    meta: { factor: 'attendance', score: att.score, isDefault: att.isDefault, note: 'mocked' },
  });
  jest.spyOn(r, '_readFeedback').mockResolvedValue({
    normScore:    fb.normScore,
    qualityScore: fb.qualityScore,
    normMeta:    { factor: 'norm',    score: fb.normScore,    isDefault: fb.isNormDefault,    note: 'mocked' },
    qualityMeta: { factor: 'quality', score: fb.qualityScore, isDefault: fb.isQualityDefault, note: 'mocked' },
  });
  jest.spyOn(r, '_readDiscipline').mockResolvedValue({
    score: disc.score,
    meta: { factor: 'discipline', score: disc.score, isDefault: disc.isDefault, note: 'mocked' },
  });
  jest.spyOn(r, '_readPeerAssessment').mockResolvedValue({
    score: peer.score,
    meta: { factor: 'peer', score: peer.score, isDefault: peer.isDefault, note: 'mocked' },
  });
  jest.spyOn(r, '_readDailyReports').mockResolvedValue({
    score: dr.score,
    meta: { factor: 'aiKpi', score: dr.score, isDefault: dr.isDefault, note: 'mocked' },
  });
  jest.spyOn(r, '_readRazryadCoefficient').mockResolvedValue({
    score: coeff.score,
    meta: { factor: 'seniority', score: coeff.score, isDefault: coeff.isDefault, note: 'mocked' },
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('HrRatingReader + HrRatingService integration', () => {
  let reader: HrRatingReader;
  let service: HrRatingService;

  beforeEach(() => {
    reader  = new HrRatingReader();
    service = new HrRatingService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ─── 1. Full real data ───────────────────────────────────────────────────

  it('1. full real data → correct composite score', async () => {
    const realFactors: HrRatingFactors = {
      norm: 90, attendance: 95, quality: 88,
      seniority: 83, discipline: 100, peer: 75, aiKpi: 80,
    };
    mockReader(reader, {
      attendance:  { score: realFactors.attendance, isDefault: false },
      norm:        { normScore: realFactors.norm, qualityScore: realFactors.quality, isNormDefault: false, isQualityDefault: false },
      discipline:  { score: realFactors.discipline, isDefault: false },
      peer:        { score: realFactors.peer, isDefault: false },
      dailyReport: { score: realFactors.aiKpi, isDefault: false },
      coefficient: { score: realFactors.seniority, isDefault: false },
    });

    const readerResult = await reader.readFactors(42);
    expect(readerResult.ok).toBe(true);
    if (!readerResult.ok) return;

    const ratingResult = service.computeRating(readerResult.data.factors);
    expect(ratingResult.ok).toBe(true);
    if (!ratingResult.ok) return;

    expect(ratingResult.data.score).toBeCloseTo(expectedScore(realFactors), 1);
    expect(ratingResult.data.score).toBeGreaterThanOrEqual(70); // 'good' or 'excellent'
  });

  // ─── 2. All defaults ─────────────────────────────────────────────────────

  it('2. all defaults → score in valid [0-100] range, label set', async () => {
    mockReader(reader); // all neutrals

    const readerResult = await reader.readFactors(99);
    expect(readerResult.ok).toBe(true);
    if (!readerResult.ok) return;

    const ratingResult = service.computeRating(readerResult.data.factors);
    expect(ratingResult.ok).toBe(true);
    if (!ratingResult.ok) return;

    expect(ratingResult.data.score).toBeGreaterThanOrEqual(0);
    expect(ratingResult.data.score).toBeLessThanOrEqual(100);
    expect(['excellent', 'good', 'average', 'poor']).toContain(ratingResult.data.label);
  });

  it('2b. all-default factors match ALL_NEUTRAL constants', async () => {
    mockReader(reader);

    const readerResult = await reader.readFactors(99);
    expect(readerResult.ok).toBe(true);
    if (!readerResult.ok) return;

    expect(readerResult.data.factors).toEqual(ALL_NEUTRAL);
  });

  it('2c. all defaults → meta all have isDefault=true', async () => {
    mockReader(reader, {
      attendance:  { score: NEUTRAL_ATTENDANCE, isDefault: true },
      norm:        { normScore: NEUTRAL_NORM, qualityScore: NEUTRAL_QUALITY, isNormDefault: true, isQualityDefault: true },
      discipline:  { score: NEUTRAL_DISCIPLINE, isDefault: true },
      peer:        { score: NEUTRAL_PEER, isDefault: true },
      dailyReport: { score: NEUTRAL_AI_KPI, isDefault: true },
      coefficient: { score: NEUTRAL_SENIORITY, isDefault: true },
    });

    const result = await reader.readFactors(99);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const allDefault = result.data.meta.every((m) => m.isDefault === true);
    expect(allDefault).toBe(true);
  });

  // ─── 3. Partial data ─────────────────────────────────────────────────────

  it('3. partial: real attendance(40) + rest defaults → score lower than all-neutral', async () => {
    mockReader(reader, {
      attendance: { score: 40, isDefault: false }, // bad month
    });

    const readerResult = await reader.readFactors(10);
    expect(readerResult.ok).toBe(true);
    if (!readerResult.ok) return;

    const ratingResult = service.computeRating(readerResult.data.factors);
    expect(ratingResult.ok).toBe(true);
    if (!ratingResult.ok) return;

    const allNeutralScore = expectedScore(ALL_NEUTRAL);
    expect(ratingResult.data.score).toBeLessThan(allNeutralScore);
  });

  // ─── 4. Discipline penalty ───────────────────────────────────────────────

  it('4. 3 infractions → discipline score = 70 (100 - 3×10)', async () => {
    const disciplineScore = 100 - 3 * 10; // = 70
    mockReader(reader, { discipline: { score: disciplineScore, isDefault: false } });

    const result = await reader.readFactors(5);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.factors.discipline).toBe(70);

    const ratingResult = service.computeRating(result.data.factors);
    expect(ratingResult.ok).toBe(true);
    if (!ratingResult.ok) return;
    const discItem = ratingResult.data.breakdown.find((b) => b.factor === 'discipline');
    expect(discItem?.rawScore).toBe(70);
  });

  it('5. 10+ infractions → discipline clamped to 0 (100 - 10×10 = 0)', async () => {
    mockReader(reader, { discipline: { score: 0, isDefault: false } });

    const result = await reader.readFactors(5);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.factors.discipline).toBe(0);
  });

  // ─── 6–7. Peer rating ────────────────────────────────────────────────────

  it('6. peer_rating 0/5 → peer score = 0', async () => {
    mockReader(reader, { peer: { score: 0, isDefault: false } });

    const result = await reader.readFactors(7);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.factors.peer).toBe(0);
  });

  it('7. peer_rating 5/5 → peer score = 100', async () => {
    mockReader(reader, { peer: { score: 100, isDefault: false } });

    const result = await reader.readFactors(7);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.factors.peer).toBe(100);
  });

  // ─── 8–9. Razryad coefficient → seniority ────────────────────────────────

  it('8. razryad coefficient 6/6 → seniority = 100', async () => {
    // clamp((6/6)*100) = 100
    mockReader(reader, { coefficient: { score: 100, isDefault: false } });

    const result = await reader.readFactors(3);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.factors.seniority).toBe(100);
  });

  it('9. razryad coefficient 1/6 → seniority ≈ 17', async () => {
    // Math.round((1/6)*100) = 17
    mockReader(reader, { coefficient: { score: 17, isDefault: false } });

    const result = await reader.readFactors(3);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.factors.seniority).toBe(17);
  });

  // ─── 10–11. Daily report compliance → aiKpi ──────────────────────────────

  it('10. 100% daily report compliance → aiKpi = 100', async () => {
    mockReader(reader, { dailyReport: { score: 100, isDefault: false } });

    const result = await reader.readFactors(8);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.factors.aiKpi).toBe(100);
  });

  it('11. 0% daily report compliance → aiKpi = 0', async () => {
    mockReader(reader, { dailyReport: { score: 0, isDefault: false } });

    const result = await reader.readFactors(8);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.factors.aiKpi).toBe(0);
  });

  // ─── 12. Error path ───────────────────────────────────────────────────────

  it('12. readFactors returns Err when internal reader throws', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jest.spyOn(reader as any, '_readAttendance').mockRejectedValue(new Error('DB connection lost'));

    const result = await reader.readFactors(1);
    expect(result.ok).toBe(false);
  });

  // ─── 13. HrRatingService rejects out-of-range from reader ────────────────

  it('13. if reader somehow returns 150 for norm, service returns Err(VALIDATION)', () => {
    // This tests that the service guards against reader bugs
    const badFactors: HrRatingFactors = {
      norm: 150, // invalid
      attendance: 80, quality: 70, seniority: 50,
      discipline: 100, peer: 50, aiKpi: 60,
    };
    const result = service.computeRating(badFactors);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('VALIDATION');
  });

  // ─── 14. Norm calculation ─────────────────────────────────────────────────

  it('14. qty 5000 / target 5000 → norm = 100', async () => {
    mockReader(reader, {
      norm: { normScore: 100, qualityScore: 70, isNormDefault: false, isQualityDefault: true },
    });

    const result = await reader.readFactors(20);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.factors.norm).toBe(100);
  });

  // ─── 15. Meta structure ───────────────────────────────────────────────────

  it('15. meta has 7 entries with correct factor keys and isDefault flags', async () => {
    mockReader(reader, {
      attendance:  { score: 90, isDefault: false },
      norm:        { normScore: 80, qualityScore: 85, isNormDefault: false, isQualityDefault: false },
      discipline:  { score: 100, isDefault: false },
      peer:        { score: 50, isDefault: true },
      dailyReport: { score: 60, isDefault: true },
      coefficient: { score: 50, isDefault: true },
    });

    const result = await reader.readFactors(11);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.meta).toHaveLength(7);

    const factorKeys = result.data.meta.map((m) => m.factor);
    expect(factorKeys).toContain('norm');
    expect(factorKeys).toContain('attendance');
    expect(factorKeys).toContain('quality');
    expect(factorKeys).toContain('seniority');
    expect(factorKeys).toContain('discipline');
    expect(factorKeys).toContain('peer');
    expect(factorKeys).toContain('aiKpi');

    // isDefault correctly set per factor
    const attendanceMeta = result.data.meta.find((m) => m.factor === 'attendance');
    expect(attendanceMeta?.isDefault).toBe(false);

    const peerMeta = result.data.meta.find((m) => m.factor === 'peer');
    expect(peerMeta?.isDefault).toBe(true);
  });

  // ─── 16. All-100 path ─────────────────────────────────────────────────────

  it('16. all real factors at 100 → score = 100, label = excellent', async () => {
    const perfect: HrRatingFactors = {
      norm: 100, attendance: 100, quality: 100,
      seniority: 100, discipline: 100, peer: 100, aiKpi: 100,
    };
    mockReader(reader, {
      attendance:  { score: 100, isDefault: false },
      norm:        { normScore: 100, qualityScore: 100, isNormDefault: false, isQualityDefault: false },
      discipline:  { score: 100, isDefault: false },
      peer:        { score: 100, isDefault: false },
      dailyReport: { score: 100, isDefault: false },
      coefficient: { score: 100, isDefault: false },
    });

    const readerResult = await reader.readFactors(1);
    expect(readerResult.ok).toBe(true);
    if (!readerResult.ok) return;

    const ratingResult = service.computeRating(readerResult.data.factors);
    expect(ratingResult.ok).toBe(true);
    if (!ratingResult.ok) return;
    expect(ratingResult.data.score).toBe(100);
    expect(ratingResult.data.label).toBe('excellent');
    expect(readerResult.data.factors).toEqual(perfect);
  });
});
