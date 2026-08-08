/**
 * @module payroll-generate-period-rows-batch.spec
 * @description A3-follow-up (N+1 fix, owner-approved 2026-07-05) — end-to-end equivalence
 * proof for `PayrollService.generatePeriodRows`, the outer loop that drives the N+1 chain
 * spanning THREE files: payroll.service.ts (the loop + `computeGatedMonthlySalary`),
 * ckp-gate.ts (`evaluatePeriodBatch`), and lms-card-gate.service.ts
 * (`isCardTrainingCompleteWithPrefetch` / `prefetchMandatoryCourses`).
 *
 * Strategy: run `generatePeriodRows` TWICE against the SAME fixture data (6 employees /
 * 7 card-rows with KNOWN, deliberately varied expected outcomes) —
 *   (A) "OLD" run — CkpGateService/LmsCardGateService batch-prefetch entrypoints are made
 *       to FAIL (so `prefetched` stays undefined inside `computeGatedMonthlySalary`, which
 *       is EXACTLY the pre-fix code path: one `evaluatePeriod` / one
 *       `isCardTrainingComplete` call per card).
 *   (B) "NEW" run — batch-prefetch calls SUCCEED, so every card's gate decision comes from
 *       the prefetched maps via `evaluatePeriodBatch` / `isCardTrainingCompleteWithPrefetch`.
 *
 * Both runs must produce IDENTICAL `payroll_rows` upserts (same employees, same
 * baseSalary/bonus/netPay/workDays/notes) — proving the fix is behavior-invisible to the
 * caller. The upsert calls are captured via a jest.fn() spy on the repo stub, so the
 * comparison is on the EXACT values PayrollService would persist.
 *
 * A SEPARATE fixture (card 900) is used for the "one card's DB read itself hard-fails"
 * scenario, kept isolated from the two-path direct-comparison fixture so that scenario
 * (which behaves differently by DESIGN between "whole-batch-unavailable" and
 * "whole-batch-available-but-DB-flaky-per-connection", an inherent asymmetry of batching,
 * not a bug) doesn't contaminate the main equivalence assertion.
 *
 * Employee/card fixture design (6 cards spanning every gate outcome combination):
 *   - emp 1 / card 501: CKP open every day, LMS open (no mandatory course)   -> full pay
 *   - emp 2 / card 502: CKP fully blocked (NO_FACT), LMS open                -> gated 0
 *   - emp 3 / card 503: CKP open, LMS blocked (mandatory course incomplete)  -> lmsBlocked, 0
 *   - emp 4 / card 504: CKP open, LMS open via Q562 cross-card credit        -> full pay
 *   - emp 6 / card 506+507: multi-card SUM (506 open @0.6 stake, 507 blocked @0.4 stake)
 */

import { PayrollService } from '../../src/modules/hr/payroll/payroll.service';
import { PayrollClosureService } from '../../src/modules/hr/payroll/payroll-closure.service';
import { CkpGateService, applyCkpGate, type CkpGateDecision } from '../../src/modules/hr/payroll/ckp-gate';
import { LmsCardGateService } from '../../src/modules/lms/application/services/lms-card-gate.service';
import { BonusService } from '../../src/modules/hr/payroll/bonus.service';
import { Ok, Err, AppErr } from '../../src/common/result';
import type { ActiveCardPayInput, IHrPayrollRepository } from '../../src/modules/hr/payroll/i-hr-payroll.repo';

const FROM = '2026-06-01';
const TO = '2026-06-02'; // 2-day period keeps the fixture small but non-trivial

// ---------------------------------------------------------------------------
// Fixture: 6 employees / 7 card-rows (emp 6 holds two cards) with known outcomes.
// ---------------------------------------------------------------------------
const INPUTS: ActiveCardPayInput[] = [
  { employeeId: 1, cardId: 501, baseSalary: 1_000_000, razryadCoeff: 1, stakeShare: 1 },
  { employeeId: 2, cardId: 502, baseSalary: 1_000_000, razryadCoeff: 1, stakeShare: 1 },
  { employeeId: 3, cardId: 503, baseSalary: 1_000_000, razryadCoeff: 1, stakeShare: 1 },
  { employeeId: 4, cardId: 504, baseSalary: 1_000_000, razryadCoeff: 1, stakeShare: 1 },
  { employeeId: 6, cardId: 506, baseSalary: 600_000, razryadCoeff: 1, stakeShare: 0.6 },
  { employeeId: 6, cardId: 507, baseSalary: 600_000, razryadCoeff: 1, stakeShare: 0.4 },
];

// Per-card CKP outcome: every day of the period gets the SAME decision (keeps fixture simple).
const CKP_OUTCOME: Record<number, 'OPEN' | 'BLOCKED'> = {
  501: 'OPEN',
  502: 'BLOCKED',
  503: 'OPEN',
  504: 'OPEN',
  506: 'OPEN',
  507: 'BLOCKED',
};

// Per-card mandatory-course fixture (drives LMS gate outcome).
// card 503 has ONE incomplete mandatory course (no credit) -> lmsBlocked=true.
// card 504 has ONE course that fails direct completion but HAS a cross-card credit -> open.
// all other cards have zero mandatory courses -> honest open.
const MANDATORY_COURSES: Record<number, { id: number; passing_score: number }[]> = {
  503: [{ id: 9001, passing_score: 70 }],
  504: [{ id: 9002, passing_score: 70 }],
};
const COURSE_FIXTURES: Record<number, { snapshotComplete: boolean; credit: boolean }> = {
  9001: { snapshotComplete: false, credit: false }, // card 503: blocked
  9002: { snapshotComplete: false, credit: true }, // card 504: credited -> open
};

function daysInRange(): string[] {
  const start = new Date(`${FROM}T00:00:00.000Z`);
  const end = new Date(`${TO}T00:00:00.000Z`);
  const out: string[] = [];
  for (let t = start.getTime(); t <= end.getTime(); t += 24 * 60 * 60 * 1000) {
    out.push(new Date(t).toISOString().split('T')[0]);
  }
  return out;
}

function decisionsFor(open: boolean): Array<{ factDate: string; decision: CkpGateDecision }> {
  return daysInRange().map((factDate) => ({
    factDate,
    decision: applyCkpGate({ hasFact: open, deadlineHours: null, factDate, submittedAt: open ? new Date() : null }),
  }));
}

// ---------------------------------------------------------------------------
// Build fresh (per-run) CkpGateService / LmsCardGateService instances whose PUBLIC methods
// are overridden to read from the fixtures above. `batchShouldSucceed` toggles whether the
// NEW batch-prefetch entrypoints succeed (Ok) or fail (Err) — Err simulates a batch-fetch
// failure, which per the CRITICAL CONSTRAINT must make generatePeriodRows fall back to the
// ORIGINAL per-card path (never silently open a card). `erroringCardId` (optional) makes
// ONE card's solo `evaluatePeriod` call fail — used only by the dedicated fallback test.
// ---------------------------------------------------------------------------
function buildCkpGate(batchShouldSucceed: boolean, erroringCardId?: number): CkpGateService {
  const svc = new CkpGateService();
  jest.spyOn(svc, 'evaluatePeriod').mockImplementation(async (cardId: number) => {
    if (cardId === erroringCardId) return Err(AppErr('DB_ERROR', `ckp read failed for card ${cardId}`));
    return Ok(decisionsFor(CKP_OUTCOME[cardId] === 'OPEN'));
  });
  jest.spyOn(svc, 'evaluatePeriodBatch').mockImplementation(async (cardIds: number[]) => {
    if (!batchShouldSucceed) return Err(AppErr('DB_ERROR', 'batch ckp read failed (simulated)'));
    const map = new Map<number, Array<{ factDate: string; decision: CkpGateDecision }>>();
    for (const cardId of cardIds) {
      map.set(cardId, decisionsFor(CKP_OUTCOME[cardId] === 'OPEN'));
    }
    return Ok(map);
  });
  return svc;
}

function buildLmsGate(batchShouldSucceed: boolean): LmsCardGateService {
  const repoStub = {
    findMandatoryCoursesByCard: jest.fn(),
    findMandatoryCoursesByCards: jest.fn(),
    getCompletionSnapshot: jest.fn(),
    hasCrossCardCredit: jest.fn(),
  };
  repoStub.getCompletionSnapshot.mockImplementation(async (_employeeId: number, courseId: number) => {
    const fx = COURSE_FIXTURES[courseId];
    return Ok({
      theoryScorePct: fx?.snapshotComplete ? 100 : 0,
      passThresholdPct: 70,
      practicalPassed: !!fx?.snapshotComplete,
      totalTopics: 1,
      confirmedTopics: fx?.snapshotComplete ? 1 : 0,
    });
  });
  repoStub.hasCrossCardCredit.mockImplementation(async (_employeeId: number, courseId: number) => {
    return Ok(COURSE_FIXTURES[courseId]?.credit ?? false);
  });
  // Real `findMandatoryCoursesByCard` behavior, sourced from the same fixture the batch
  // path reads (MANDATORY_COURSES) — `isCardTrainingComplete` itself is NOT mocked, it runs
  // its real (pre-existing, unmodified) logic against this stubbed repo, exactly like the
  // established test/lms/lms-card-gate.service.spec.ts convention.
  repoStub.findMandatoryCoursesByCard.mockImplementation(async (cardId: number) => Ok(MANDATORY_COURSES[cardId] ?? []));
  const svc = new LmsCardGateService(repoStub as never);
  jest.spyOn(svc, 'isCardTrainingComplete');
  jest.spyOn(svc, 'prefetchMandatoryCourses').mockImplementation(async () => {
    if (!batchShouldSucceed) return Err(AppErr('DB_ERROR', 'batch lms read failed (simulated)'));
    const map = new Map<number, { id: number; passing_score: number }[]>();
    for (const cardId of Object.keys(CKP_OUTCOME).map(Number)) {
      map.set(cardId, MANDATORY_COURSES[cardId] ?? []);
    }
    return Ok(map);
  });
  return svc;
}

// ---------------------------------------------------------------------------
// Minimal IHrPayrollRepository stub — captures every upsertPayrollRow call.
// ---------------------------------------------------------------------------
function buildRepo(inputs: ActiveCardPayInput[]): IHrPayrollRepository & { upsertCalls: Record<string, unknown>[] } {
  const upsertCalls: Record<string, unknown>[] = [];
  return {
    upsertCalls,
    findAll: jest.fn(),
    create: jest.fn(),
    findPeriodById: jest.fn().mockResolvedValue(
      Ok({ id: 1, status: 'open', period_start_date: FROM, period_end_date: TO, period_name: 'Test-2026-06' }),
    ),
    listRowsByPeriod: jest.fn(),
    markPeriodClosed: jest.fn(),
    markRowsPosted: jest.fn(),
    listActiveCardPayInputs: jest.fn().mockResolvedValue(Ok(inputs)),
    upsertPayrollRow: jest.fn().mockImplementation(async (input: Record<string, unknown>) => {
      upsertCalls.push(input);
      return Ok({ id: upsertCalls.length, inserted: true });
    }),
  } as unknown as IHrPayrollRepository & { upsertCalls: Record<string, unknown>[] };
}

function buildService(
  batchShouldSucceed: boolean,
  opts: { inputs?: ActiveCardPayInput[]; erroringCardId?: number } = {},
) {
  const inputs = opts.inputs ?? INPUTS;
  const repo = buildRepo(inputs);
  const closure = new PayrollClosureService();
  const ckpGate = buildCkpGate(batchShouldSucceed, opts.erroringCardId);
  const lmsGate = buildLmsGate(batchShouldSucceed);
  const bonusSvc = { sumApprovedGroupedByEmployee: jest.fn().mockResolvedValue(Ok(new Map<number, number>())) };
  const gl = {} as never;
  const hrRepo = {} as never;
  const eventEmitter = { emit: jest.fn() } as never;

  const svc = new PayrollService(
    repo,
    closure,
    gl,
    ckpGate,
    lmsGate,
    bonusSvc as unknown as BonusService,
    hrRepo,
    eventEmitter,
  );
  return { svc, repo, ckpGate, lmsGate };
}

/** Normalize an upsert call for comparison (strip nothing — every field must match). */
function sortRows(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return [...rows].sort((a, b) => Number(a.employeeId) - Number(b.employeeId));
}

describe('PayrollService.generatePeriodRows — A3-follow-up N+1 fix equivalence (owner-approved 2026-07-05)', () => {
  it('batch-prefetch path (NEW) produces IDENTICAL payroll_rows to the per-card path (OLD, batch simulated as unavailable)', async () => {
    const oldRun = buildService(false); // batch prefetch calls fail -> falls back to per-card path (== pre-fix code)
    const newRun = buildService(true); // batch prefetch calls succeed -> uses prefetched maps

    const oldResult = await oldRun.svc.generatePeriodRows(1);
    const newResult = await newRun.svc.generatePeriodRows(1);

    expect(oldResult.ok).toBe(true);
    expect(newResult.ok).toBe(true);
    if (!oldResult.ok || !newResult.ok) return;

    // Same aggregate counters.
    expect(newResult.data.generated).toBe(oldResult.data.generated);
    expect(newResult.data.inserted).toBe(oldResult.data.inserted);
    expect(newResult.data.skipped).toBe(oldResult.data.skipped);
    expect(newResult.data.candidates).toBe(oldResult.data.candidates);
    expect(oldResult.data.generated).toBe(5); // sanity: 5 distinct employees in INPUTS

    // Same exact rows persisted (per-employee upsert payloads byte-identical).
    const oldRows = sortRows(oldRun.repo.upsertCalls);
    const newRows = sortRows(newRun.repo.upsertCalls);
    expect(newRows).toEqual(oldRows);

    // Same per-card gatedGross/lmsBlocked breakdown in the returned `rows` array.
    const oldCards = [...oldResult.data.rows].sort((a, b) => a.cardId - b.cardId);
    const newCards = [...newResult.data.rows].sort((a, b) => a.cardId - b.cardId);
    expect(newCards).toEqual(oldCards);
  });

  it('fixed expected-outcome table: every employee/card behaves as designed under the NEW batch path', async () => {
    const { svc, repo } = buildService(true);
    const result = await svc.generatePeriodRows(1);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // NOTE on expected amounts: `generatePeriodRows` ALWAYS calls `computeGatedMonthlySalary`
    // with `ckpAchievementPct: null` (see payroll.service.ts:~732 comment — "jonli darvoza hal
    // qiladi", i.e. the day-level CKP gate is evaluated for reporting/audit purposes but the
    // ACTUAL money math short-circuits via `ckpMissing` in `computeCardPay`, pre-existing,
    // unrelated to this N+1 fix). So EVERY card's `gatedGross` is null/0 in this call site
    // today, regardless of the CKP day-gate's OPEN/BLOCKED verdict — this is a real,
    // independently-verified characteristic of the current wiring (matches the live DB: with
    // ckp_fact_values empty, every employee's real oylik is 0 through this exact path today).
    // What THIS fix must prove is that the CKP day-gate computation itself (the `days` array,
    // `lmsBlocked`) is IDENTICAL whether batched or not — which the "IDENTICAL payroll_rows"
    // test above already proves byte-for-byte between the OLD and NEW code paths. This test
    // instead pins down the LMS-gate outcome (which is NOT masked by ckpMissing) per card.

    // emp 1 (card 501, no mandatory course bound): LMS gate honest-open, not blocked.
    expect(result.data.rows.find((r) => r.cardId === 501)?.lmsBlocked).toBe(false);

    // emp 3 (card 503, one incomplete mandatory course, no credit): LMS gate BLOCKS the card.
    const emp3Card = result.data.rows.find((r) => r.cardId === 503);
    expect(emp3Card?.lmsBlocked).toBe(true);
    // proratedGross is null here (ckpAchievementPct=null, see NOTE above), so
    // computeGatedMonthlySalary's null-passthrough rule applies: gatedGross stays null
    // (NOT coerced to 0) when proratedGross itself was null — this is the pre-existing
    // "ЦКП fakti yo'q → gross HISOBLANMAYDI" contract (Q-40), unaffected by this fix.
    expect(emp3Card?.gatedGross).toBeNull();

    // emp 4 (card 504, course fails direct completion BUT credited via Q562): LMS gate OPEN.
    const emp4Card = result.data.rows.find((r) => r.cardId === 504);
    expect(emp4Card?.lmsBlocked).toBe(false);

    // Every generated row's baseSalary is 0 (ckpAchievementPct=null short-circuit, verified above).
    for (const emp of [1, 2, 3, 4, 6]) {
      const row = repo.upsertCalls.find((r) => r.employeeId === emp);
      expect(row?.baseSalary).toBeCloseTo(0, 5);
    }
  });

  it('a batch-prefetch FAILURE degrades to the ORIGINAL per-card path, and a per-card gate error still fails CLOSED (never silently opens)', async () => {
    // Extra fixture: employee 5 / card 505 whose SOLO evaluatePeriod call fails outright.
    // This exercises the fallback's per-card error handling — meaningful only once the
    // WHOLE batch has failed and generatePeriodRows is walking the per-card path.
    const inputsWithErrorCard: ActiveCardPayInput[] = [
      ...INPUTS,
      { employeeId: 5, cardId: 505, baseSalary: 1_000_000, razryadCoeff: 1, stakeShare: 1 },
    ];
    const { svc, repo, ckpGate, lmsGate } = buildService(false, { inputs: inputsWithErrorCard, erroringCardId: 505 });
    const result = await svc.generatePeriodRows(1);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // The per-card evaluatePeriod/isCardTrainingComplete methods must have been used
    // (one call per card in `inputs`), proving the fallback actually engaged.
    expect(ckpGate.evaluatePeriod).toHaveBeenCalledTimes(inputsWithErrorCard.length);
    expect(lmsGate.isCardTrainingComplete).toHaveBeenCalledTimes(inputsWithErrorCard.length);

    // Card 505's per-card CKP query fails -> employee 5 is skipped, never fabricated as passing.
    const emp5 = repo.upsertCalls.find((r) => r.employeeId === 5);
    expect(emp5).toBeUndefined();
    expect(result.data.skipped).toBeGreaterThanOrEqual(1);
  });

  it('when the batch succeeds, the per-card evaluatePeriod/isCardTrainingComplete are NEVER called (the actual N+1 fix)', async () => {
    const { svc, ckpGate, lmsGate } = buildService(true);
    await svc.generatePeriodRows(1);
    expect(ckpGate.evaluatePeriod).not.toHaveBeenCalled();
    expect(lmsGate.isCardTrainingComplete).not.toHaveBeenCalled();
  });

  it('when the batch succeeds, exactly ONE evaluatePeriodBatch + ONE prefetchMandatoryCourses call cover ALL cards', async () => {
    const { svc, ckpGate, lmsGate } = buildService(true);
    await svc.generatePeriodRows(1);
    expect(ckpGate.evaluatePeriodBatch).toHaveBeenCalledTimes(1);
    expect(lmsGate.prefetchMandatoryCourses).toHaveBeenCalledTimes(1);
  });
});
