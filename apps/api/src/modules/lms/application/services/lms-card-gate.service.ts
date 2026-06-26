/**
 * @module lms-card-gate.service
 * @description EP-ORG-027 LMS oylik/razryad GATE: are a CARD's mandatory courses complete?
 *
 * Vision (egasi): "Karta darsligi tugamaguncha o'sha karta oyligi to'xtaydi"
 *   + razryad o'sishi (attestation) majburiy darslik tugaganda ochiladi.
 *
 * This service is the DB-side WRAPPER around the PURE, unit-tested
 * {@link LmsCompletionService.evaluate()} 3-condition gate. It:
 *   1. resolves the CARD's mandatory, active courses (org_departments.id via courses.card_id),
 *   2. builds a real completion snapshot per course from live tables (no fabrication),
 *   3. evaluates each through the pure gate, honouring cross-card credits (Q562),
 *   4. aggregates into one card-level verdict consumers can act on.
 *
 * Consumers (additive wiring, separate phases — this phase only EXPORTS the gate):
 *   - HR payroll (FAZA 04): a card with allComplete=false withholds that card's salary.
 *   - org-structure razryad (FAZA 03): razryad growth/attestation requires allComplete=true.
 *
 * Fabrication ban (Q-40): when NO mandatory course is bound to the card
 * (courses.card_id is owner-data, currently 0/5) the verdict is allComplete=true
 * with an empty incomplete list — "no course bound = no block". This is the correct,
 * honest open state, NOT a fabricated pass. The moment the owner binds a mandatory
 * course to the card, the gate starts blocking until that course is genuinely completed.
 *
 * Op-codes: EP-ORG-027 / EP-LMS-070 / Q562 (A73)
 */

import { Injectable, Logger } from '@nestjs/common';
import { AppErr, Err, Ok, Result } from '@common/result';
import { LmsRepository } from '../../infrastructure/repositories/drizzle-lms.repo';
import { LmsCompletionService } from './lms-completion.service';

/**
 * Per-course gate detail. Returned for both passing and failing courses so the
 * caller (and UI) can show exactly which darslik is holding the card's salary.
 */
export interface CardGateCourseDetail {
  /** courses.id of the mandatory card-course */
  courseId: number;
  /** true = this course is satisfied (completed OR cross-card credited) */
  complete: boolean;
  /** true when satisfied via Q562 cross-card credit rather than direct completion */
  viaCrossCardCredit: boolean;
  /** failing-condition reasons (Uzbek) from the pure gate; empty when complete */
  reasons: string[];
}

/**
 * Card-level training verdict.
 *
 * allComplete = true  -> card's salary/razryad path is OPEN (no incomplete mandatory darslik).
 * allComplete = false -> at least one mandatory darslik is unfinished; consumers gate accordingly.
 */
export interface CardGateResult {
  cardId: number;
  employeeId: number;
  /** false => oylik-gate / razryad-gate CLOSED for this card */
  allComplete: boolean;
  /** number of mandatory courses bound to the card (0 => open by default) */
  mandatoryCourseCount: number;
  /** courses.id of every unfinished mandatory course */
  incompleteCourseIds: number[];
  /** per-course breakdown (always one entry per mandatory course) */
  courses: CardGateCourseDetail[];
  /** flat list of human-readable failing reasons across all incomplete courses */
  reasons: string[];
}

@Injectable()
export class LmsCardGateService {
  private readonly logger = new Logger(LmsCardGateService.name);

  /** Pure gate — no DI deps; constructed once, reused per evaluation. */
  private readonly gate = new LmsCompletionService();

  constructor(private readonly lmsRepo: LmsRepository) {}

  /**
   * EP-ORG-027: is the CARD's mandatory training complete for this employee?
   *
   * @param cardId     org_departments.id (the canonical karta)
   * @param employeeId employees.id of the person holding the card
   * @returns Ok<CardGateResult> describing whether the card's salary/razryad path is open.
   *          Err<AppError> only on bad input or a hard DB failure (never silently "passes").
   *
   * Semantics:
   *   - No mandatory course bound to the card  -> allComplete = true  (no block; honest open).
   *   - A mandatory course with a cross-card credit (Q562) -> counts as complete.
   *   - Otherwise the pure 3-condition gate decides per course; ANY incomplete -> allComplete = false.
   *   - A per-course snapshot/evaluation error is treated as INCOMPLETE (fail-closed), so a
   *     transient read problem never wrongly opens the salary gate.
   */
  async isCardTrainingComplete(cardId: number, employeeId: number): Promise<Result<CardGateResult>> {
    if (!Number.isInteger(cardId) || cardId <= 0) {
      return Err(AppErr('VALIDATION', `cardId noto'g'ri (musbat butun son bo'lishi kerak): ${cardId}`));
    }
    if (!Number.isInteger(employeeId) || employeeId <= 0) {
      return Err(AppErr('VALIDATION', `employeeId noto'g'ri (musbat butun son bo'lishi kerak): ${employeeId}`));
    }

    const coursesR = await this.lmsRepo.findMandatoryCoursesByCard(cardId);
    if (!coursesR.ok) return Err(coursesR.error);
    const mandatory = coursesR.data;

    // No mandatory darslik bound to this card => nothing to block (honest open, not fabricated).
    if (mandatory.length === 0) {
      return Ok({
        cardId,
        employeeId,
        allComplete: true,
        mandatoryCourseCount: 0,
        incompleteCourseIds: [],
        courses: [],
        reasons: [],
      });
    }

    const courses: CardGateCourseDetail[] = [];
    const incompleteCourseIds: number[] = [];
    const reasons: string[] = [];

    for (const c of mandatory) {
      const detail = await this.evaluateCourse(employeeId, c.id);
      courses.push(detail);
      if (!detail.complete) {
        incompleteCourseIds.push(c.id);
        reasons.push(...detail.reasons);
      }
    }

    return Ok({
      cardId,
      employeeId,
      allComplete: incompleteCourseIds.length === 0,
      mandatoryCourseCount: mandatory.length,
      incompleteCourseIds,
      courses,
      reasons,
    });
  }

  /**
   * Convenience boolean for consumers that only need the open/closed decision
   * (e.g. payroll day-gate). Fails CLOSED (returns false) on any error so a read
   * problem never accidentally opens the salary gate.
   */
  async isCardTrainingCompleteBool(cardId: number, employeeId: number): Promise<boolean> {
    const r = await this.isCardTrainingComplete(cardId, employeeId);
    return r.ok ? r.data.allComplete : false;
  }

  /**
   * Evaluate one mandatory course for one employee. Never throws — a failure is
   * surfaced as an INCOMPLETE detail (fail-closed) so the card-level gate stays safe.
   */
  private async evaluateCourse(employeeId: number, courseId: number): Promise<CardGateCourseDetail> {
    const snapR = await this.lmsRepo.getCompletionSnapshot(employeeId, courseId);
    if (!snapR.ok) {
      this.logger.warn(`gate snapshot fail emp=${employeeId} course=${courseId}: ${snapR.error.message}`);
      return this.failClosed(courseId, `Kurs #${courseId}: progress o'qib bo'lmadi`);
    }

    const evalR = this.gate.evaluate(snapR.data);
    if (!evalR.ok) {
      this.logger.warn(`gate evaluate fail emp=${employeeId} course=${courseId}: ${evalR.error.message}`);
      return this.failClosed(courseId, `Kurs #${courseId}: ${evalR.error.message}`);
    }

    if (evalR.data.completed) {
      return { courseId, complete: true, viaCrossCardCredit: false, reasons: [] };
    }

    // Not directly completed — Q562: a cross-card credit lets it count as passed.
    const creditR = await this.lmsRepo.hasCrossCardCredit(employeeId, courseId);
    if (creditR.ok && creditR.data) {
      return { courseId, complete: true, viaCrossCardCredit: true, reasons: [] };
    }

    return {
      courseId,
      complete: false,
      viaCrossCardCredit: false,
      reasons: evalR.data.reasons.map((reason) => `Kurs #${courseId}: ${reason}`),
    };
  }

  private failClosed(courseId: number, reason: string): CardGateCourseDetail {
    return { courseId, complete: false, viaCrossCardCredit: false, reasons: [reason] };
  }
}
