/**
 * @module lms-completion.service
 * @description Pure, unit-testable 3-condition course-completion gate (EP-LMS-070).
 *
 * Vision: "Darslik kartaga biriktiriladi; darslik tugamasa o'sha karta oyligi yo'q."
 *
 * A course enrollment is COMPLETED only when ALL THREE conditions are simultaneously true:
 *   C1 — Theory test score_pct >= pass_threshold_pct (from lms_test_attempts)
 *   C2 — Practical exam passed (mentor confirmation or practical rubric)
 *   C3 — All nazorat varaqasi topics confirmed (confirmed_at IS NOT NULL for every topic)
 *
 * Rules:
 *   - Pure function: no DB, no HTTP, no NestJS DI required for the core evaluate() logic.
 *   - Result<T> pattern: never throws; guards malformed input -> Err.
 *   - Thresholds come from lms-completion.constants.ts (this module only).
 *   - DO NOT touch PayrollService/oylik-block here — only the pure gate.
 *   - DO NOT add new DB tables.
 *   - Guards divide-by-zero / NaN -> Err with VALIDATION code.
 *
 * Op-codes: EP-LMS-070
 */

import {
  LMS_GENERAL_PASS_THRESHOLD_PCT,
  LMS_MAX_PASS_THRESHOLD_PCT,
  LMS_MAX_SCORE_PCT,
  LMS_MIN_PASS_THRESHOLD_PCT,
  LMS_MIN_SCORE_PCT,
  LMS_MIN_TOPIC_COUNT,
  LMS_TOPIC_CONFIRM_REQUIRED_FRACTION,
  LMS_TX_PASS_THRESHOLD_PCT,
} from '../constants/lms-completion.constants';
import { AppErr, Err, Ok, Result } from '@common/result';

// ---------------------------------------------------------------------------
// Input shape
// ---------------------------------------------------------------------------

/**
 * Progress snapshot passed to evaluate(). All fields are required so the
 * caller is explicit — undefined silently treated as "not done" is a bug magnet.
 */
export interface LmsCompletionProgress {
  /**
   * Score achieved on the final/best theory test attempt (0-100 inclusive).
   * Use the best (highest) passing attempt's score_pct.
   */
  theoryScorePct: number;

  /**
   * Per-course pass threshold (0-100 inclusive). Stored in lms_courses.pass_threshold_pct.
   * TX/safety courses = 100; general = 60-80 (HR configures — EP-LMS-009).
   */
  passThresholdPct: number;

  /**
   * Whether the practical exam has been confirmed by the mentor or RD-4 examiner.
   * Maps to lms_practical_exam_rubrics or onboarding step confirmation.
   */
  practicalPassed: boolean;

  /**
   * Total number of nazorat varaqasi topics for this enrollment.
   * Must be >= LMS_MIN_TOPIC_COUNT.
   */
  totalTopics: number;

  /**
   * Number of topics where confirmed_at IS NOT NULL (employee clicked "O'qib chiqdim").
   * Must be 0 <= confirmedTopics <= totalTopics.
   */
  confirmedTopics: number;
}

// ---------------------------------------------------------------------------
// Output shape
// ---------------------------------------------------------------------------

/**
 * Per-condition evaluation detail. Returned whether the condition passes or not
 * so the caller can surface actionable feedback to the UI or log it.
 */
export interface CompletionConditionDetail {
  /** Unique key — stable identifier for the condition */
  condition: 'C1_THEORY_SCORE' | 'C2_PRACTICAL_PASSED' | 'C3_TOPICS_CONFIRMED';
  /** Whether this individual condition is satisfied */
  passed: boolean;
  /** Human-readable reason (Uzbek) — shown when condition fails */
  reason: string;
}

/**
 * Successful evaluation result.
 *
 * completed = true  ONLY when all 3 conditions pass (EP-LMS-070).
 * completed = false if ANY condition fails; reasons list is non-empty in that case.
 */
export interface CompletionEvaluation {
  /** true = enroll status may be set to 'completed'; false = stays 'started' */
  completed: boolean;
  /** Per-condition breakdown — always 3 elements, one per condition */
  conditions: CompletionConditionDetail[];
  /** Failing condition reasons concatenated for quick display; empty when completed=true */
  reasons: string[];
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

/**
 * Pure completion-gate service.
 *
 * Marked @Injectable() so it can be used inside NestJS DI without change,
 * but it has NO constructor dependencies — making it trivially unit-testable
 * with a plain `new LmsCompletionService()`.
 */
export class LmsCompletionService {
  /**
   * Evaluate the 3-condition completion gate for one enrollment.
   *
   * @param progress - snapshot of the enrollment's current state
   * @returns Ok<CompletionEvaluation> on valid input
   *          Err<AppError> with code='VALIDATION' on malformed input
   *
   * Guards:
   *   - NaN / Infinity in any numeric field -> Err
   *   - theoryScorePct outside [LMS_MIN_SCORE_PCT, LMS_MAX_SCORE_PCT] -> Err
   *   - passThresholdPct outside [LMS_MIN_PASS_THRESHOLD_PCT, LMS_MAX_PASS_THRESHOLD_PCT] -> Err
   *   - totalTopics < LMS_MIN_TOPIC_COUNT -> Err (prevents divide-by-zero)
   *   - confirmedTopics > totalTopics -> Err (logically impossible)
   *   - confirmedTopics < 0 -> Err
   *   - non-boolean practicalPassed -> Err
   */
  evaluate(progress: LmsCompletionProgress): Result<CompletionEvaluation> {
    // -----------------------------------------------------------------------
    // Guard: input must be a plain object
    // -----------------------------------------------------------------------
    if (progress === null || progress === undefined || typeof progress !== 'object') {
      return Err(AppErr('VALIDATION', "progress kiritish majburiy (null/undefined qabul qilinmaydi)"));
    }

    const { theoryScorePct, passThresholdPct, practicalPassed, totalTopics, confirmedTopics } = progress;

    // -----------------------------------------------------------------------
    // Guard: theoryScorePct
    // -----------------------------------------------------------------------
    if (typeof theoryScorePct !== 'number' || !Number.isFinite(theoryScorePct)) {
      return Err(AppErr('VALIDATION', `theoryScorePct raqam bo'lishi kerak, olindi: ${theoryScorePct}`));
    }
    if (theoryScorePct < LMS_MIN_SCORE_PCT || theoryScorePct > LMS_MAX_SCORE_PCT) {
      return Err(AppErr(
        'VALIDATION',
        `theoryScorePct ${LMS_MIN_SCORE_PCT}-${LMS_MAX_SCORE_PCT} orasida bo'lishi kerak, olindi: ${theoryScorePct}`,
      ));
    }

    // -----------------------------------------------------------------------
    // Guard: passThresholdPct
    // -----------------------------------------------------------------------
    if (typeof passThresholdPct !== 'number' || !Number.isFinite(passThresholdPct)) {
      return Err(AppErr('VALIDATION', `passThresholdPct raqam bo'lishi kerak, olindi: ${passThresholdPct}`));
    }
    if (passThresholdPct < LMS_MIN_PASS_THRESHOLD_PCT || passThresholdPct > LMS_MAX_PASS_THRESHOLD_PCT) {
      return Err(AppErr(
        'VALIDATION',
        `passThresholdPct ${LMS_MIN_PASS_THRESHOLD_PCT}-${LMS_MAX_PASS_THRESHOLD_PCT} orasida bo'lishi kerak, olindi: ${passThresholdPct}`,
      ));
    }

    // -----------------------------------------------------------------------
    // Guard: practicalPassed must be an actual boolean
    // -----------------------------------------------------------------------
    if (typeof practicalPassed !== 'boolean') {
      return Err(AppErr('VALIDATION', `practicalPassed boolean bo'lishi kerak, olindi: ${typeof practicalPassed}`));
    }

    // -----------------------------------------------------------------------
    // Guard: totalTopics — prevents divide-by-zero and negative counts
    // -----------------------------------------------------------------------
    if (typeof totalTopics !== 'number' || !Number.isFinite(totalTopics) || !Number.isInteger(totalTopics)) {
      return Err(AppErr('VALIDATION', `totalTopics butun raqam bo'lishi kerak, olindi: ${totalTopics}`));
    }
    if (totalTopics < LMS_MIN_TOPIC_COUNT) {
      return Err(AppErr(
        'VALIDATION',
        `totalTopics kamida ${LMS_MIN_TOPIC_COUNT} bo'lishi kerak (bo'sh kurs qabul qilinmaydi), olindi: ${totalTopics}`,
      ));
    }

    // -----------------------------------------------------------------------
    // Guard: confirmedTopics — must be non-negative integer <= totalTopics
    // -----------------------------------------------------------------------
    if (typeof confirmedTopics !== 'number' || !Number.isFinite(confirmedTopics) || !Number.isInteger(confirmedTopics)) {
      return Err(AppErr('VALIDATION', `confirmedTopics butun raqam bo'lishi kerak, olindi: ${confirmedTopics}`));
    }
    if (confirmedTopics < 0) {
      return Err(AppErr('VALIDATION', `confirmedTopics manfiy bo'lishi mumkin emas, olindi: ${confirmedTopics}`));
    }
    if (confirmedTopics > totalTopics) {
      return Err(AppErr(
        'VALIDATION',
        `confirmedTopics (${confirmedTopics}) totalTopics (${totalTopics}) dan oshib ketdi — mantiqiy xato`,
      ));
    }

    // -----------------------------------------------------------------------
    // C1 — Theory test score
    // theoryScorePct must be >= passThresholdPct (EP-LMS-009 / EP-LMS-070)
    // -----------------------------------------------------------------------
    const c1Passed = theoryScorePct >= passThresholdPct;
    const c1: CompletionConditionDetail = {
      condition: 'C1_THEORY_SCORE',
      passed: c1Passed,
      reason: c1Passed
        ? `Nazariy test o'tdi: ${theoryScorePct}% >= ${passThresholdPct}%`
        : `Nazariy test o'tmadi: ${theoryScorePct}% < ${passThresholdPct}% (talab)`,
    };

    // -----------------------------------------------------------------------
    // C2 — Practical exam
    // practicalPassed must be true (mentor/RD-4 confirmed — EP-LMS-070 condition 2)
    // -----------------------------------------------------------------------
    const c2Passed = practicalPassed;
    const c2: CompletionConditionDetail = {
      condition: 'C2_PRACTICAL_PASSED',
      passed: c2Passed,
      reason: c2Passed
        ? "Amaliy imtihon tasdiqlandi (mentor/RD-4)"
        : "Amaliy imtihon hali tasdiqlanmagan — mentor yoki RD-4 tasdig'i kerak",
    };

    // -----------------------------------------------------------------------
    // C3 — Nazorat varaqasi: all topics confirmed
    // confirmedTopics / totalTopics must equal LMS_TOPIC_CONFIRM_REQUIRED_FRACTION (1.0)
    // Division is safe: totalTopics >= LMS_MIN_TOPIC_COUNT >= 1 (guarded above)
    // -----------------------------------------------------------------------
    const confirmedFraction = confirmedTopics / totalTopics;
    const c3Passed = confirmedFraction >= LMS_TOPIC_CONFIRM_REQUIRED_FRACTION;
    const c3: CompletionConditionDetail = {
      condition: 'C3_TOPICS_CONFIRMED',
      passed: c3Passed,
      reason: c3Passed
        ? `Barcha mavzular tasdiqlandi: ${confirmedTopics}/${totalTopics}`
        : `Nazorat varaqasi to'liq emas: ${confirmedTopics}/${totalTopics} mavzu tasdiqlangan (100% talab qilinadi)`,
    };

    // -----------------------------------------------------------------------
    // Final decision: ALL three must pass (EP-LMS-070)
    // -----------------------------------------------------------------------
    const conditions: CompletionConditionDetail[] = [c1, c2, c3];
    const completed = c1Passed && c2Passed && c3Passed;
    const reasons = conditions.filter(c => !c.passed).map(c => c.reason);

    return Ok<CompletionEvaluation>({ completed, conditions, reasons });
  }

  /**
   * Convenience: returns the effective pass threshold to use when none is
   * stored on the course row. Callers should prefer the per-course stored
   * value; use this only as a last-resort default.
   *
   * EP-LMS-009: TX/safety = 100%; general = LMS_GENERAL_PASS_THRESHOLD_PCT.
   */
  static defaultThreshold(courseType: 'safety_tx' | 'regulation' | 'general' | 'razryad_exam' | 'onboarding' | 'replication'): number {
    return courseType === 'safety_tx' ? LMS_TX_PASS_THRESHOLD_PCT : LMS_GENERAL_PASS_THRESHOLD_PCT;
  }
}
