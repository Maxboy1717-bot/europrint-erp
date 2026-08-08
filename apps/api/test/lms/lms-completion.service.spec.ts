/**
 * @module lms-completion.service.spec
 * @description Unit tests for LmsCompletionService — the pure 3-condition
 * course-completion gate (EP-LMS-070).
 *
 * Test structure:
 *   A. All 3 conditions pass → completed=true, reasons=[]
 *   B. Single condition failing (C1 / C2 / C3) → completed=false + reason
 *   C. Two conditions failing → completed=false + 2 reasons
 *   D. All three failing → completed=false + 3 reasons
 *   E. Threshold boundary cases (pass/fail boundary, exact equality)
 *   F. Malformed / NaN / Infinity / null / missing fields → Err with VALIDATION
 *   G. Static helper defaultThreshold
 *
 * No mocks needed — pure function, zero DI dependencies.
 */

import {
  LmsCompletionService,
  LmsCompletionProgress,
} from '../../src/modules/lms/application/services/lms-completion.service';
import {
  LMS_GENERAL_PASS_THRESHOLD_PCT,
  LMS_TX_PASS_THRESHOLD_PCT,
  LMS_MIN_TOPIC_COUNT,
} from '../../src/modules/lms/application/constants/lms-completion.constants';

// ---------------------------------------------------------------------------
// Helper: build a fully-passing progress object
// ---------------------------------------------------------------------------
function passingProgress(overrides: Partial<LmsCompletionProgress> = {}): LmsCompletionProgress {
  return {
    theoryScorePct:   LMS_GENERAL_PASS_THRESHOLD_PCT, // exactly at threshold
    passThresholdPct: LMS_GENERAL_PASS_THRESHOLD_PCT,
    practicalPassed:  true,
    totalTopics:      12,
    confirmedTopics:  12,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
describe('LmsCompletionService.evaluate', () => {
  let svc: LmsCompletionService;

  beforeEach(() => {
    svc = new LmsCompletionService();
  });

  // =========================================================================
  // A. All three conditions pass
  // =========================================================================
  describe('A — all 3 conditions pass', () => {
    it('returns completed=true when all conditions are met', () => {
      const res = svc.evaluate(passingProgress());
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.completed).toBe(true);
        expect(res.data.reasons).toHaveLength(0);
      }
    });

    it('returns exactly 3 condition detail entries', () => {
      const res = svc.evaluate(passingProgress());
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.conditions).toHaveLength(3);
      }
    });

    it('all 3 conditions have passed=true', () => {
      const res = svc.evaluate(passingProgress());
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.conditions.every(c => c.passed)).toBe(true);
      }
    });

    it('works with TX pass threshold of 100%', () => {
      const res = svc.evaluate(passingProgress({
        theoryScorePct:   100,
        passThresholdPct: LMS_TX_PASS_THRESHOLD_PCT,
      }));
      expect(res.ok).toBe(true);
      if (res.ok) expect(res.data.completed).toBe(true);
    });

    it('works with 1 topic confirmed out of 1 total (minimum valid varaqa)', () => {
      const res = svc.evaluate(passingProgress({
        totalTopics:     LMS_MIN_TOPIC_COUNT,
        confirmedTopics: LMS_MIN_TOPIC_COUNT,
      }));
      expect(res.ok).toBe(true);
      if (res.ok) expect(res.data.completed).toBe(true);
    });
  });

  // =========================================================================
  // B. Single condition failing
  // =========================================================================
  describe('B — single condition failing', () => {
    describe('B1 — C1 fails (theory score below threshold)', () => {
      it('completed=false when theory score is below threshold', () => {
        const res = svc.evaluate(passingProgress({ theoryScorePct: 50, passThresholdPct: 70 }));
        expect(res.ok).toBe(true);
        if (res.ok) {
          expect(res.data.completed).toBe(false);
          expect(res.data.reasons).toHaveLength(1);
        }
      });

      it('the failing reason contains C1_THEORY_SCORE text', () => {
        const res = svc.evaluate(passingProgress({ theoryScorePct: 50, passThresholdPct: 70 }));
        expect(res.ok).toBe(true);
        if (res.ok) {
          const c1 = res.data.conditions.find(c => c.condition === 'C1_THEORY_SCORE');
          expect(c1).toBeDefined();
          expect(c1?.passed).toBe(false);
          expect(c1?.reason).toContain('50%');
          expect(c1?.reason).toContain('70%');
        }
      });

      it('C2 and C3 still show passed=true', () => {
        const res = svc.evaluate(passingProgress({ theoryScorePct: 0, passThresholdPct: 70 }));
        expect(res.ok).toBe(true);
        if (res.ok) {
          const c2 = res.data.conditions.find(c => c.condition === 'C2_PRACTICAL_PASSED');
          const c3 = res.data.conditions.find(c => c.condition === 'C3_TOPICS_CONFIRMED');
          expect(c2?.passed).toBe(true);
          expect(c3?.passed).toBe(true);
        }
      });
    });

    describe('B2 — C2 fails (practical not passed)', () => {
      it('completed=false when practical is not passed', () => {
        const res = svc.evaluate(passingProgress({ practicalPassed: false }));
        expect(res.ok).toBe(true);
        if (res.ok) {
          expect(res.data.completed).toBe(false);
          expect(res.data.reasons).toHaveLength(1);
        }
      });

      it('the failing reason references C2_PRACTICAL_PASSED', () => {
        const res = svc.evaluate(passingProgress({ practicalPassed: false }));
        expect(res.ok).toBe(true);
        if (res.ok) {
          const c2 = res.data.conditions.find(c => c.condition === 'C2_PRACTICAL_PASSED');
          expect(c2?.passed).toBe(false);
          expect(res.data.reasons[0]).toBe(c2?.reason);
        }
      });

      it('C1 and C3 still show passed=true', () => {
        const res = svc.evaluate(passingProgress({ practicalPassed: false }));
        expect(res.ok).toBe(true);
        if (res.ok) {
          const c1 = res.data.conditions.find(c => c.condition === 'C1_THEORY_SCORE');
          const c3 = res.data.conditions.find(c => c.condition === 'C3_TOPICS_CONFIRMED');
          expect(c1?.passed).toBe(true);
          expect(c3?.passed).toBe(true);
        }
      });
    });

    describe('B3 — C3 fails (topics not fully confirmed)', () => {
      it('completed=false when some topics are not confirmed', () => {
        const res = svc.evaluate(passingProgress({ totalTopics: 12, confirmedTopics: 11 }));
        expect(res.ok).toBe(true);
        if (res.ok) {
          expect(res.data.completed).toBe(false);
          expect(res.data.reasons).toHaveLength(1);
        }
      });

      it('the failing reason references topic counts', () => {
        const res = svc.evaluate(passingProgress({ totalTopics: 12, confirmedTopics: 9 }));
        expect(res.ok).toBe(true);
        if (res.ok) {
          const c3 = res.data.conditions.find(c => c.condition === 'C3_TOPICS_CONFIRMED');
          expect(c3?.passed).toBe(false);
          expect(c3?.reason).toContain('9');
          expect(c3?.reason).toContain('12');
        }
      });

      it('completed=false when confirmedTopics=0', () => {
        const res = svc.evaluate(passingProgress({ totalTopics: 12, confirmedTopics: 0 }));
        expect(res.ok).toBe(true);
        if (res.ok) {
          expect(res.data.completed).toBe(false);
          const c3 = res.data.conditions.find(c => c.condition === 'C3_TOPICS_CONFIRMED');
          expect(c3?.passed).toBe(false);
        }
      });

      it('C1 and C2 still show passed=true', () => {
        const res = svc.evaluate(passingProgress({ totalTopics: 5, confirmedTopics: 3 }));
        expect(res.ok).toBe(true);
        if (res.ok) {
          const c1 = res.data.conditions.find(c => c.condition === 'C1_THEORY_SCORE');
          const c2 = res.data.conditions.find(c => c.condition === 'C2_PRACTICAL_PASSED');
          expect(c1?.passed).toBe(true);
          expect(c2?.passed).toBe(true);
        }
      });
    });
  });

  // =========================================================================
  // C. Two conditions failing
  // =========================================================================
  describe('C — two conditions failing simultaneously', () => {
    it('C1+C2 both fail → 2 reasons returned', () => {
      const res = svc.evaluate(passingProgress({ theoryScorePct: 40, practicalPassed: false }));
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.completed).toBe(false);
        expect(res.data.reasons).toHaveLength(2);
      }
    });

    it('C1+C3 both fail → 2 reasons returned', () => {
      const res = svc.evaluate(passingProgress({ theoryScorePct: 30, confirmedTopics: 5 }));
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.completed).toBe(false);
        expect(res.data.reasons).toHaveLength(2);
      }
    });

    it('C2+C3 both fail → 2 reasons returned', () => {
      const res = svc.evaluate(passingProgress({ practicalPassed: false, confirmedTopics: 0 }));
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.completed).toBe(false);
        expect(res.data.reasons).toHaveLength(2);
      }
    });
  });

  // =========================================================================
  // D. All three failing
  // =========================================================================
  describe('D — all three conditions failing', () => {
    it('3 reasons when all conditions fail', () => {
      const res = svc.evaluate({
        theoryScorePct:   0,
        passThresholdPct: 70,
        practicalPassed:  false,
        totalTopics:      12,
        confirmedTopics:  0,
      });
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.completed).toBe(false);
        expect(res.data.reasons).toHaveLength(3);
      }
    });

    it('all 3 condition details have passed=false', () => {
      const res = svc.evaluate({
        theoryScorePct:   0,
        passThresholdPct: 70,
        practicalPassed:  false,
        totalTopics:      12,
        confirmedTopics:  0,
      });
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.conditions.every(c => !c.passed)).toBe(true);
      }
    });
  });

  // =========================================================================
  // E. Threshold boundary cases
  // =========================================================================
  describe('E — boundary / exact-equality cases', () => {
    it('theory score exactly at threshold passes (>=)', () => {
      const res = svc.evaluate(passingProgress({ theoryScorePct: 70, passThresholdPct: 70 }));
      expect(res.ok).toBe(true);
      if (res.ok) {
        const c1 = res.data.conditions.find(c => c.condition === 'C1_THEORY_SCORE');
        expect(c1?.passed).toBe(true);
      }
    });

    it('theory score one point below threshold fails', () => {
      const res = svc.evaluate(passingProgress({ theoryScorePct: 69, passThresholdPct: 70 }));
      expect(res.ok).toBe(true);
      if (res.ok) {
        const c1 = res.data.conditions.find(c => c.condition === 'C1_THEORY_SCORE');
        expect(c1?.passed).toBe(false);
      }
    });

    it('TX course: score 99 with threshold 100 fails (must be exact 100)', () => {
      const res = svc.evaluate(passingProgress({
        theoryScorePct:   99,
        passThresholdPct: LMS_TX_PASS_THRESHOLD_PCT, // 100
      }));
      expect(res.ok).toBe(true);
      if (res.ok) {
        const c1 = res.data.conditions.find(c => c.condition === 'C1_THEORY_SCORE');
        expect(c1?.passed).toBe(false);
        expect(res.data.completed).toBe(false);
      }
    });

    it('TX course: score exactly 100 with threshold 100 passes', () => {
      const res = svc.evaluate(passingProgress({
        theoryScorePct:   100,
        passThresholdPct: LMS_TX_PASS_THRESHOLD_PCT,
      }));
      expect(res.ok).toBe(true);
      if (res.ok) {
        const c1 = res.data.conditions.find(c => c.condition === 'C1_THEORY_SCORE');
        expect(c1?.passed).toBe(true);
      }
    });

    it('passThresholdPct=0 means any score (even 0) passes C1', () => {
      const res = svc.evaluate(passingProgress({ theoryScorePct: 0, passThresholdPct: 0 }));
      expect(res.ok).toBe(true);
      if (res.ok) {
        const c1 = res.data.conditions.find(c => c.condition === 'C1_THEORY_SCORE');
        expect(c1?.passed).toBe(true);
      }
    });

    it('all topics confirmed = total passes C3 exactly', () => {
      const res = svc.evaluate(passingProgress({ totalTopics: 5, confirmedTopics: 5 }));
      expect(res.ok).toBe(true);
      if (res.ok) {
        const c3 = res.data.conditions.find(c => c.condition === 'C3_TOPICS_CONFIRMED');
        expect(c3?.passed).toBe(true);
      }
    });

    it('one topic short (11/12) fails C3', () => {
      const res = svc.evaluate(passingProgress({ totalTopics: 12, confirmedTopics: 11 }));
      expect(res.ok).toBe(true);
      if (res.ok) {
        const c3 = res.data.conditions.find(c => c.condition === 'C3_TOPICS_CONFIRMED');
        expect(c3?.passed).toBe(false);
      }
    });

    it('score=100 and threshold=100 passes C1', () => {
      const res = svc.evaluate(passingProgress({ theoryScorePct: 100, passThresholdPct: 100 }));
      expect(res.ok).toBe(true);
      if (res.ok) {
        const c1 = res.data.conditions.find(c => c.condition === 'C1_THEORY_SCORE');
        expect(c1?.passed).toBe(true);
      }
    });
  });

  // =========================================================================
  // F. Malformed input → Err with VALIDATION
  // =========================================================================
  describe('F — malformed input returns Err(VALIDATION)', () => {
    it('null input → Err', () => {
      const res = svc.evaluate(null as unknown as LmsCompletionProgress);
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('VALIDATION');
    });

    it('undefined input → Err', () => {
      const res = svc.evaluate(undefined as unknown as LmsCompletionProgress);
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('VALIDATION');
    });

    it('string input → Err', () => {
      const res = svc.evaluate('bad' as unknown as LmsCompletionProgress);
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('VALIDATION');
    });

    it('theoryScorePct = NaN → Err', () => {
      const res = svc.evaluate(passingProgress({ theoryScorePct: NaN }));
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('VALIDATION');
    });

    it('theoryScorePct = Infinity → Err', () => {
      const res = svc.evaluate(passingProgress({ theoryScorePct: Infinity }));
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('VALIDATION');
    });

    it('theoryScorePct = -Infinity → Err', () => {
      const res = svc.evaluate(passingProgress({ theoryScorePct: -Infinity }));
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('VALIDATION');
    });

    it('theoryScorePct > 100 → Err', () => {
      const res = svc.evaluate(passingProgress({ theoryScorePct: 101 }));
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('VALIDATION');
    });

    it('theoryScorePct < 0 → Err', () => {
      const res = svc.evaluate(passingProgress({ theoryScorePct: -1 }));
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('VALIDATION');
    });

    it('passThresholdPct = NaN → Err', () => {
      const res = svc.evaluate(passingProgress({ passThresholdPct: NaN }));
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('VALIDATION');
    });

    it('passThresholdPct > 100 → Err', () => {
      const res = svc.evaluate(passingProgress({ passThresholdPct: 101 }));
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('VALIDATION');
    });

    it('passThresholdPct < 0 → Err', () => {
      const res = svc.evaluate(passingProgress({ passThresholdPct: -1 }));
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('VALIDATION');
    });

    it('practicalPassed = string "true" → Err (must be actual boolean)', () => {
      const res = svc.evaluate(passingProgress({ practicalPassed: 'true' as unknown as boolean }));
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('VALIDATION');
    });

    it('practicalPassed = 1 → Err (truthy int is not boolean)', () => {
      const res = svc.evaluate(passingProgress({ practicalPassed: 1 as unknown as boolean }));
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('VALIDATION');
    });

    it('practicalPassed = null → Err', () => {
      const res = svc.evaluate(passingProgress({ practicalPassed: null as unknown as boolean }));
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('VALIDATION');
    });

    it('totalTopics = 0 → Err (prevents divide-by-zero)', () => {
      const res = svc.evaluate(passingProgress({ totalTopics: 0, confirmedTopics: 0 }));
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('VALIDATION');
    });

    it('totalTopics < 0 → Err', () => {
      const res = svc.evaluate(passingProgress({ totalTopics: -1, confirmedTopics: 0 }));
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('VALIDATION');
    });

    it('totalTopics = NaN → Err', () => {
      const res = svc.evaluate(passingProgress({ totalTopics: NaN }));
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('VALIDATION');
    });

    it('totalTopics = 1.5 (float) → Err', () => {
      const res = svc.evaluate(passingProgress({ totalTopics: 1.5, confirmedTopics: 1 }));
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('VALIDATION');
    });

    it('confirmedTopics > totalTopics → Err', () => {
      const res = svc.evaluate(passingProgress({ totalTopics: 5, confirmedTopics: 6 }));
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('VALIDATION');
    });

    it('confirmedTopics < 0 → Err', () => {
      const res = svc.evaluate(passingProgress({ totalTopics: 5, confirmedTopics: -1 }));
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('VALIDATION');
    });

    it('confirmedTopics = NaN → Err', () => {
      const res = svc.evaluate(passingProgress({ confirmedTopics: NaN }));
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('VALIDATION');
    });

    it('confirmedTopics = 2.9 (float) → Err', () => {
      const res = svc.evaluate(passingProgress({ totalTopics: 5, confirmedTopics: 2.9 }));
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.code).toBe('VALIDATION');
    });
  });

  // =========================================================================
  // G. Static defaultThreshold helper
  // =========================================================================
  describe('G — LmsCompletionService.defaultThreshold', () => {
    it('safety_tx returns LMS_TX_PASS_THRESHOLD_PCT (100)', () => {
      expect(LmsCompletionService.defaultThreshold('safety_tx')).toBe(LMS_TX_PASS_THRESHOLD_PCT);
    });

    it('general returns LMS_GENERAL_PASS_THRESHOLD_PCT (70)', () => {
      expect(LmsCompletionService.defaultThreshold('general')).toBe(LMS_GENERAL_PASS_THRESHOLD_PCT);
    });

    it('regulation returns LMS_GENERAL_PASS_THRESHOLD_PCT', () => {
      expect(LmsCompletionService.defaultThreshold('regulation')).toBe(LMS_GENERAL_PASS_THRESHOLD_PCT);
    });

    it('razryad_exam returns LMS_GENERAL_PASS_THRESHOLD_PCT', () => {
      expect(LmsCompletionService.defaultThreshold('razryad_exam')).toBe(LMS_GENERAL_PASS_THRESHOLD_PCT);
    });

    it('onboarding returns LMS_GENERAL_PASS_THRESHOLD_PCT', () => {
      expect(LmsCompletionService.defaultThreshold('onboarding')).toBe(LMS_GENERAL_PASS_THRESHOLD_PCT);
    });
  });

  // =========================================================================
  // H. Condition key uniqueness / structure contract
  // =========================================================================
  describe('H — output structure contract', () => {
    it('conditions array always has exactly 3 entries on valid input', () => {
      const cases: Partial<LmsCompletionProgress>[] = [
        {},
        { practicalPassed: false },
        { theoryScorePct: 0, practicalPassed: false, confirmedTopics: 0 },
      ];
      for (const overrides of cases) {
        const res = svc.evaluate(passingProgress(overrides));
        expect(res.ok).toBe(true);
        if (res.ok) expect(res.data.conditions).toHaveLength(3);
      }
    });

    it('condition keys are unique in every response', () => {
      const res = svc.evaluate(passingProgress());
      expect(res.ok).toBe(true);
      if (res.ok) {
        const keys = res.data.conditions.map(c => c.condition);
        const uniqueKeys = new Set(keys);
        expect(uniqueKeys.size).toBe(3);
      }
    });

    it('reasons array contains exactly the reasons of failed conditions', () => {
      const res = svc.evaluate(passingProgress({ theoryScorePct: 0, practicalPassed: false }));
      expect(res.ok).toBe(true);
      if (res.ok) {
        const failedReasons = res.data.conditions
          .filter(c => !c.passed)
          .map(c => c.reason);
        expect(res.data.reasons).toEqual(failedReasons);
      }
    });

    it('each condition has a non-empty reason string', () => {
      const res = svc.evaluate(passingProgress());
      expect(res.ok).toBe(true);
      if (res.ok) {
        for (const c of res.data.conditions) {
          expect(typeof c.reason).toBe('string');
          expect(c.reason.length).toBeGreaterThan(0);
        }
      }
    });
  });
});
