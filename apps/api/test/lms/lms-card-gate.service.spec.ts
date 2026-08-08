/**
 * @module lms-card-gate.service.spec
 * @description Unit tests for LmsCardGateService (EP-ORG-027 / EP-LMS-070) — the
 * DB-orchestration wrapper around the pure {@link LmsCompletionService} gate.
 *
 * The DB reads (LmsRepository) are stubbed with jest.fn() Result-returning mocks
 * so the service's OWN logic is what's under test:
 *   A. Input validation short-circuits BEFORE touching the repo (fail fast)
 *   B. "No mandatory course bound" -> honest OPEN (allComplete=true), not fabricated
 *   C. Hard repo failure propagates as Err (findMandatoryCoursesByCard)
 *   D. Per-course evaluation: pass / fail / Q562 cross-card credit / fail-closed on
 *      snapshot or evaluate errors
 *   E. isCardTrainingCompleteBool fail-closed semantics
 *   F. getCardCourseStatusAggregate roll-up math (completedPct/creditedCount/salaryGateOpen)
 *
 * No live DB — LmsRepository is a plain jest.fn() stub (Result<T> shaped), matching
 * the established convention (see test/lms/lms-core.service.spec.ts).
 */

import { LmsCardGateService } from '../../src/modules/lms/application/services/lms-card-gate.service';
import { AppErr, Ok, Err } from '../../src/common/result';

type RepoStub = {
  findMandatoryCoursesByCard: jest.Mock;
  getCompletionSnapshot: jest.Mock;
  hasCrossCardCredit: jest.Mock;
};

function makeRepoStub(): RepoStub {
  return {
    findMandatoryCoursesByCard: jest.fn(),
    getCompletionSnapshot: jest.fn(),
    hasCrossCardCredit: jest.fn(),
  };
}

// A fully-passing completion snapshot (matches LmsCompletionService's 3 conditions).
const passingSnapshot = {
  theoryScorePct: 70,
  passThresholdPct: 70,
  practicalPassed: true,
  totalTopics: 5,
  confirmedTopics: 5,
};

// A snapshot that fails C2 (practical not passed) — deterministic single-reason failure.
const failingSnapshot = {
  ...passingSnapshot,
  practicalPassed: false,
};

describe('LmsCardGateService', () => {
  let repo: RepoStub;
  let svc: LmsCardGateService;

  beforeEach(() => {
    repo = makeRepoStub();
    svc = new LmsCardGateService(repo as never);
  });

  it('class is defined', () => {
    expect(LmsCardGateService).toBeDefined();
  });

  it('class name matches expected', () => {
    expect(LmsCardGateService.name).toBe('LmsCardGateService');
  });

  it('is constructible with a repo stub', () => {
    expect(svc).toBeInstanceOf(LmsCardGateService);
  });

  // =========================================================================
  // A. Input validation — fails BEFORE touching the repo
  // =========================================================================
  describe('A — input validation short-circuits', () => {
    it('cardId=0 returns Err(VALIDATION) without calling the repo', async () => {
      const res = await svc.isCardTrainingComplete(0, 1);
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('VALIDATION');
      expect(repo.findMandatoryCoursesByCard).not.toHaveBeenCalled();
    });

    it('cardId negative returns Err(VALIDATION)', async () => {
      const res = await svc.isCardTrainingComplete(-5, 1);
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('VALIDATION');
    });

    it('cardId non-integer (float) returns Err(VALIDATION)', async () => {
      const res = await svc.isCardTrainingComplete(1.5, 1);
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('VALIDATION');
    });

    it('employeeId=0 returns Err(VALIDATION) without calling the repo', async () => {
      const res = await svc.isCardTrainingComplete(1, 0);
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('VALIDATION');
      expect(repo.findMandatoryCoursesByCard).not.toHaveBeenCalled();
    });

    it('employeeId negative returns Err(VALIDATION)', async () => {
      const res = await svc.isCardTrainingComplete(1, -1);
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('VALIDATION');
    });
  });

  // =========================================================================
  // B. No mandatory course bound to the card => honest OPEN
  // =========================================================================
  describe('B — no mandatory course bound => honest open (Q-40, not fabricated)', () => {
    it('allComplete=true, mandatoryCourseCount=0, empty courses/reasons', async () => {
      repo.findMandatoryCoursesByCard.mockResolvedValue(Ok([]));
      const res = await svc.isCardTrainingComplete(10, 20);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data).toEqual({
          cardId: 10,
          employeeId: 20,
          allComplete: true,
          mandatoryCourseCount: 0,
          incompleteCourseIds: [],
          courses: [],
          reasons: [],
        });
      }
      // No mandatory course => the per-course snapshot/credit reads are never attempted.
      expect(repo.getCompletionSnapshot).not.toHaveBeenCalled();
      expect(repo.hasCrossCardCredit).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // C. Hard repo failure on the course lookup propagates
  // =========================================================================
  describe('C — findMandatoryCoursesByCard failure propagates', () => {
    it('returns the same Err (does not swallow or fabricate)', async () => {
      repo.findMandatoryCoursesByCard.mockResolvedValue(Err(AppErr('DB_ERROR', 'boom')));
      const res = await svc.isCardTrainingComplete(1, 1);
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('DB_ERROR');
    });
  });

  // =========================================================================
  // D. Per-course evaluation paths
  // =========================================================================
  describe('D — per-course evaluation', () => {
    it('a single passing mandatory course => allComplete=true, complete detail', async () => {
      repo.findMandatoryCoursesByCard.mockResolvedValue(Ok([{ id: 101, passing_score: 70 }]));
      repo.getCompletionSnapshot.mockResolvedValue(Ok(passingSnapshot));

      const res = await svc.isCardTrainingComplete(1, 5);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.allComplete).toBe(true);
        expect(res.data.mandatoryCourseCount).toBe(1);
        expect(res.data.incompleteCourseIds).toEqual([]);
        expect(res.data.courses).toEqual([
          { courseId: 101, complete: true, viaCrossCardCredit: false, reasons: [] },
        ]);
      }
      // Directly complete => Q562 cross-card credit lookup is never needed.
      expect(repo.hasCrossCardCredit).not.toHaveBeenCalled();
    });

    it('a failing course with NO cross-card credit => allComplete=false, reasons carry over', async () => {
      repo.findMandatoryCoursesByCard.mockResolvedValue(Ok([{ id: 202, passing_score: 70 }]));
      repo.getCompletionSnapshot.mockResolvedValue(Ok(failingSnapshot));
      repo.hasCrossCardCredit.mockResolvedValue(Ok(false));

      const res = await svc.isCardTrainingComplete(1, 5);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.allComplete).toBe(false);
        expect(res.data.incompleteCourseIds).toEqual([202]);
        expect(res.data.courses[0].complete).toBe(false);
        expect(res.data.courses[0].viaCrossCardCredit).toBe(false);
        expect(res.data.reasons.length).toBeGreaterThan(0);
        expect(res.data.reasons[0]).toContain('Kurs #202');
      }
      expect(repo.hasCrossCardCredit).toHaveBeenCalledWith(5, 202);
    });

    it('a failing course WITH a Q562 cross-card credit => counts as complete', async () => {
      repo.findMandatoryCoursesByCard.mockResolvedValue(Ok([{ id: 303, passing_score: 70 }]));
      repo.getCompletionSnapshot.mockResolvedValue(Ok(failingSnapshot));
      repo.hasCrossCardCredit.mockResolvedValue(Ok(true));

      const res = await svc.isCardTrainingComplete(1, 5);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.allComplete).toBe(true);
        expect(res.data.incompleteCourseIds).toEqual([]);
        expect(res.data.courses[0]).toEqual({
          courseId: 303,
          complete: true,
          viaCrossCardCredit: true,
          reasons: [],
        });
      }
    });

    it('getCompletionSnapshot failure fails CLOSED (course marked incomplete, not skipped)', async () => {
      repo.findMandatoryCoursesByCard.mockResolvedValue(Ok([{ id: 404, passing_score: 70 }]));
      repo.getCompletionSnapshot.mockResolvedValue(Err(AppErr('DB_ERROR', 'read failed')));

      const res = await svc.isCardTrainingComplete(1, 5);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.allComplete).toBe(false);
        expect(res.data.courses[0].complete).toBe(false);
        expect(res.data.courses[0].reasons[0]).toContain('progress');
      }
      // A hard read failure must never fall through to a credit check.
      expect(repo.hasCrossCardCredit).not.toHaveBeenCalled();
    });

    it('multiple mandatory courses: ANY incomplete => card-level allComplete=false', async () => {
      repo.findMandatoryCoursesByCard.mockResolvedValue(
        Ok([
          { id: 1, passing_score: 70 },
          { id: 2, passing_score: 70 },
        ]),
      );
      repo.getCompletionSnapshot
        .mockResolvedValueOnce(Ok(passingSnapshot))
        .mockResolvedValueOnce(Ok(failingSnapshot));
      repo.hasCrossCardCredit.mockResolvedValue(Ok(false));

      const res = await svc.isCardTrainingComplete(1, 5);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.allComplete).toBe(false);
        expect(res.data.mandatoryCourseCount).toBe(2);
        expect(res.data.incompleteCourseIds).toEqual([2]);
      }
    });
  });

  // =========================================================================
  // E. isCardTrainingCompleteBool — fail-closed convenience wrapper
  // =========================================================================
  describe('E — isCardTrainingCompleteBool fail-closed semantics', () => {
    it('returns true when the underlying verdict is allComplete=true', async () => {
      repo.findMandatoryCoursesByCard.mockResolvedValue(Ok([]));
      const open = await svc.isCardTrainingCompleteBool(1, 1);
      expect(open).toBe(true);
    });

    it('returns false (never throws) when input validation fails', async () => {
      const open = await svc.isCardTrainingCompleteBool(0, 1);
      expect(open).toBe(false);
    });

    it('returns false when the repo hard-fails', async () => {
      repo.findMandatoryCoursesByCard.mockResolvedValue(Err(AppErr('DB_ERROR', 'boom')));
      const open = await svc.isCardTrainingCompleteBool(1, 1);
      expect(open).toBe(false);
    });
  });

  // =========================================================================
  // F. getCardCourseStatusAggregate — roll-up math (T11-13)
  // =========================================================================
  describe('F — getCardCourseStatusAggregate roll-up', () => {
    it('no mandatory course => completedPct=100 (honest open), salaryGateOpen=true', async () => {
      repo.findMandatoryCoursesByCard.mockResolvedValue(Ok([]));
      const res = await svc.getCardCourseStatusAggregate(1, 1);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.totalMandatory).toBe(0);
        expect(res.data.completedCount).toBe(0);
        expect(res.data.completedPct).toBe(100);
        expect(res.data.salaryGateOpen).toBe(true);
      }
    });

    it('2 courses, 1 direct-complete + 1 credited => counts and pct are correct', async () => {
      repo.findMandatoryCoursesByCard.mockResolvedValue(
        Ok([
          { id: 1, passing_score: 70 },
          { id: 2, passing_score: 70 },
        ]),
      );
      repo.getCompletionSnapshot
        .mockResolvedValueOnce(Ok(passingSnapshot)) // course 1: direct pass
        .mockResolvedValueOnce(Ok(failingSnapshot)); // course 2: needs credit
      repo.hasCrossCardCredit.mockResolvedValue(Ok(true));

      const res = await svc.getCardCourseStatusAggregate(1, 1);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.totalMandatory).toBe(2);
        expect(res.data.completedCount).toBe(2);
        expect(res.data.incompleteCount).toBe(0);
        expect(res.data.creditedCount).toBe(1);
        expect(res.data.completedPct).toBe(100);
        expect(res.data.salaryGateOpen).toBe(true);
      }
    });

    it('2 courses, 1 complete + 1 incomplete => completedPct=50, salaryGateOpen=false', async () => {
      repo.findMandatoryCoursesByCard.mockResolvedValue(
        Ok([
          { id: 1, passing_score: 70 },
          { id: 2, passing_score: 70 },
        ]),
      );
      repo.getCompletionSnapshot
        .mockResolvedValueOnce(Ok(passingSnapshot))
        .mockResolvedValueOnce(Ok(failingSnapshot));
      repo.hasCrossCardCredit.mockResolvedValue(Ok(false));

      const res = await svc.getCardCourseStatusAggregate(1, 1);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.completedCount).toBe(1);
        expect(res.data.incompleteCount).toBe(1);
        expect(res.data.creditedCount).toBe(0);
        expect(res.data.completedPct).toBe(50);
        expect(res.data.salaryGateOpen).toBe(false);
        expect(res.data.incompleteCourseIds).toEqual([2]);
      }
    });

    it('propagates Err from the underlying gate (e.g. bad cardId) without fabricating an aggregate', async () => {
      const res = await svc.getCardCourseStatusAggregate(0, 1);
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('VALIDATION');
    });
  });
});
