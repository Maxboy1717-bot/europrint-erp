/**
 * @module lms-card-gate.batch.spec
 * @description A3-follow-up (N+1 fix, owner-approved 2026-07-05) equivalence tests.
 *
 * Proves `LmsCardGateService.isCardTrainingCompleteWithPrefetch(cardId, employeeId, map)`
 * (NEW — consumes a pre-fetched mandatory-course Map, built once via
 * `prefetchMandatoryCourses`/`LmsRepository.findMandatoryCoursesByCards`, ONE query for
 * MANY cards) returns the byte-identical verdict that
 * `LmsCardGateService.isCardTrainingComplete(cardId, employeeId)` (EXISTING — one
 * `findMandatoryCoursesByCard` query PER card) would return for the SAME card+employee,
 * across a fixed set of scenarios with KNOWN expected pass/fail outcomes:
 *   1. No mandatory course bound to the card -> honest OPEN (allComplete=true).
 *   2. One mandatory course, fully passing -> allComplete=true.
 *   3. One mandatory course, failing, no cross-card credit -> allComplete=false.
 *   4. One mandatory course, failing directly, but WITH a Q562 cross-card credit
 *      -> allComplete=true (credited).
 *   5. Two mandatory courses, one passing + one failing -> allComplete=false
 *      (ANY-incomplete rule).
 *   6. Card missing from the prefetched map entirely (edge case; shouldn't happen when
 *      the caller prefetches with the same cardId set, but must fail SAFE) -> treated as
 *      "zero mandatory courses" -> honest OPEN, matching what `findMandatoryCoursesByCard`
 *      returns for a card with none bound (NOT a fabricated pass; this is the pre-existing
 *      "no course bound = no block" semantics, not new fail-open behavior).
 *
 * `getCompletionSnapshot` / `hasCrossCardCredit` (the per-course reads) are UNCHANGED by
 * this fix and are stubbed identically for both code paths, matching the repo-stub
 * convention already used in test/lms/lms-card-gate.service.spec.ts.
 */

import { LmsCardGateService } from '../../src/modules/lms/application/services/lms-card-gate.service';
import { AppErr, Ok, Err } from '../../src/common/result';

type RepoStub = {
  findMandatoryCoursesByCard: jest.Mock;
  findMandatoryCoursesByCards: jest.Mock;
  getCompletionSnapshot: jest.Mock;
  hasCrossCardCredit: jest.Mock;
};

function makeRepoStub(): RepoStub {
  return {
    findMandatoryCoursesByCard: jest.fn(),
    findMandatoryCoursesByCards: jest.fn(),
    getCompletionSnapshot: jest.fn(),
    hasCrossCardCredit: jest.fn(),
  };
}

const passingSnapshot = {
  theoryScorePct: 70,
  passThresholdPct: 70,
  practicalPassed: true,
  totalTopics: 5,
  confirmedTopics: 5,
};

const failingSnapshot = {
  ...passingSnapshot,
  practicalPassed: false,
};

// cardId -> mandatory course list (the "live DB" ground truth for this fixture set).
const MANDATORY_BY_CARD: Record<number, { id: number; passing_score: number }[]> = {
  201: [], // no mandatory course -> honest open
  202: [{ id: 1001, passing_score: 70 }], // single passing course
  203: [{ id: 1002, passing_score: 70 }], // single failing course, no credit
  204: [{ id: 1003, passing_score: 70 }], // single failing-direct course, WITH cross-card credit
  205: [
    { id: 1004, passing_score: 70 },
    { id: 1005, passing_score: 70 },
  ], // mixed: one pass + one fail
  // 206 intentionally absent from MANDATORY_BY_CARD -> simulates "missing from prefetch map"
};

// courseId -> snapshot + credit fixture (keyed by employeeId=999 for every scenario).
const COURSE_FIXTURES: Record<number, { snapshot: typeof passingSnapshot; credit: boolean }> = {
  1001: { snapshot: passingSnapshot, credit: false },
  1002: { snapshot: failingSnapshot, credit: false },
  1003: { snapshot: failingSnapshot, credit: true },
  1004: { snapshot: passingSnapshot, credit: false },
  1005: { snapshot: failingSnapshot, credit: false },
};

const EMPLOYEE_ID = 999;

function wireRepoForEvaluation(repo: RepoStub): void {
  repo.getCompletionSnapshot.mockImplementation(async (_employeeId: number, courseId: number) => {
    const fx = COURSE_FIXTURES[courseId];
    if (!fx) return Err(AppErr('NOT_FOUND', `no fixture for course ${courseId}`));
    return Ok(fx.snapshot);
  });
  repo.hasCrossCardCredit.mockImplementation(async (_employeeId: number, courseId: number) => {
    const fx = COURSE_FIXTURES[courseId];
    return Ok(fx ? fx.credit : false);
  });
}

describe('LmsCardGateService — A3-follow-up batch-prefetch equivalence (owner-approved 2026-07-05)', () => {
  const ALL_CARD_IDS = [201, 202, 203, 204, 205, 206];

  function buildPrefetchedMap(): Map<number, { id: number; passing_score: number }[]> {
    const map = new Map<number, { id: number; passing_score: number }[]>();
    for (const [cardIdStr, courses] of Object.entries(MANDATORY_BY_CARD)) {
      map.set(Number(cardIdStr), courses);
    }
    // NOTE: 206 deliberately NOT set -> exercises the "missing from map" fail-safe path.
    return map;
  }

  it.each(ALL_CARD_IDS)('card #%d: isCardTrainingCompleteWithPrefetch matches isCardTrainingComplete exactly', async (cardId) => {
    // --- solo (existing) path ---
    const soloRepo = makeRepoStub();
    wireRepoForEvaluation(soloRepo);
    soloRepo.findMandatoryCoursesByCard.mockResolvedValue(Ok(MANDATORY_BY_CARD[cardId] ?? []));
    const soloSvc = new LmsCardGateService(soloRepo as never);
    const soloR = await soloSvc.isCardTrainingComplete(cardId, EMPLOYEE_ID);

    // --- batch-prefetched (new) path ---
    const batchRepo = makeRepoStub();
    wireRepoForEvaluation(batchRepo);
    const batchSvc = new LmsCardGateService(batchRepo as never);
    const prefetchedMap = buildPrefetchedMap();
    const batchR = await batchSvc.isCardTrainingCompleteWithPrefetch(cardId, EMPLOYEE_ID, prefetchedMap);

    expect(soloR.ok).toBe(true);
    expect(batchR.ok).toBe(true);
    if (!soloR.ok || !batchR.ok) return;
    expect(batchR.data).toEqual(soloR.data);

    // The prefetched path must NEVER call findMandatoryCoursesByCard (that's the fixed N+1).
    expect(batchRepo.findMandatoryCoursesByCard).not.toHaveBeenCalled();
  });

  it('produces the SAME known pass/fail verdict per card (fixed expected table)', async () => {
    const repo = makeRepoStub();
    wireRepoForEvaluation(repo);
    const svc = new LmsCardGateService(repo as never);
    const map = buildPrefetchedMap();

    const expected: Record<number, boolean> = {
      201: true, // no mandatory course -> open
      202: true, // single passing course -> open
      203: false, // single failing, no credit -> blocked
      204: true, // single failing-direct BUT credited -> open
      205: false, // mixed pass+fail -> blocked (ANY-incomplete rule)
      206: true, // missing from map -> treated as zero mandatory -> honest open
    };
    for (const cardId of ALL_CARD_IDS) {
      const r = await svc.isCardTrainingCompleteWithPrefetch(cardId, EMPLOYEE_ID, map);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.allComplete).toBe(expected[cardId]);
    }
  });

  it('prefetchMandatoryCourses delegates to LmsRepository.findMandatoryCoursesByCards (batch source)', async () => {
    const repo = makeRepoStub();
    const map = buildPrefetchedMap();
    repo.findMandatoryCoursesByCards.mockResolvedValue(Ok(map));
    const svc = new LmsCardGateService(repo as never);

    const r = await svc.prefetchMandatoryCourses(ALL_CARD_IDS);
    expect(r.ok).toBe(true);
    expect(repo.findMandatoryCoursesByCards).toHaveBeenCalledWith(ALL_CARD_IDS);
    if (r.ok) expect(r.data).toBe(map);
  });

  it('input validation on the prefetched path matches the solo path (VALIDATION errors, no repo calls)', async () => {
    const repo = makeRepoStub();
    const svc = new LmsCardGateService(repo as never);
    const map = buildPrefetchedMap();

    const badCard = await svc.isCardTrainingCompleteWithPrefetch(0, EMPLOYEE_ID, map);
    expect(badCard.ok).toBe(false);
    if (!badCard.ok) expect(badCard.error.code).toBe('VALIDATION');

    const badEmp = await svc.isCardTrainingCompleteWithPrefetch(202, -1, map);
    expect(badEmp.ok).toBe(false);
    if (!badEmp.ok) expect(badEmp.error.code).toBe('VALIDATION');

    expect(repo.getCompletionSnapshot).not.toHaveBeenCalled();
  });

  it('a per-course snapshot failure still fails CLOSED on the prefetched path (fail-closed preserved)', async () => {
    const repo = makeRepoStub();
    repo.getCompletionSnapshot.mockResolvedValue(Err(AppErr('DB_ERROR', 'read failed')));
    const svc = new LmsCardGateService(repo as never);
    const map = buildPrefetchedMap();

    const r = await svc.isCardTrainingCompleteWithPrefetch(202, EMPLOYEE_ID, map);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.allComplete).toBe(false);
      expect(r.data.courses[0].complete).toBe(false);
    }
  });
});
