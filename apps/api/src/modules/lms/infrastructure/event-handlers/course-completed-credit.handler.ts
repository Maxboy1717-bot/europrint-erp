/**
 * @module lms/course-completed-credit.handler
 * @description T10-10 (Q562 / EP-ORG-027): cross-card credit listener.
 *   When an enrollment is COMPLETED and its course is UNIVERSAL (courses.is_universal),
 *   the completion replicates as a "credit" onto the employee's OTHER cards — so the same
 *   universal darslik (e.g. TX instruktaj) counts as passed on every card the employee holds,
 *   without re-taking it. The credit is recorded in `lms_cross_card_credits` (canonical ledger);
 *   {@link LmsCardGateService.evaluateCourse} already reads it via `hasCrossCardCredit` (READ side,
 *   built FAZA-07). This handler is the missing WRITE side.
 *
 * WIRING (oltin-ip naqshi — xuddi CardEmployeeAssignedHandler kabi): the LMS completion path
 *   (lms-enrollments controller `completeEnrollment` / `updateProgress` -> 'completed') emits
 *   `lms.course.completed` via EventEmitter2 (app global `EventEmitterModule.forRoot()`). This
 *   listener attaches with `@OnEvent` (CqrsModule NOT required). The event topic + payload contract
 *   are declared HERE so the emitter (controller) imports this single literal — no shared constants edit.
 *
 * FABRIKATSIYA TAQIQ (Q-40): `courses.is_universal` is owner-data (DEFAULT false). A non-universal
 *   course is a no-op (nothing written). An employee holding only the source card is a no-op
 *   (no other card to credit). NO credit row is ever invented.
 *
 * IDEMPOTENT: `recordCrossCardCredits` INSERT ... ON CONFLICT (course_id, employee_id, target_card_id)
 *   DO NOTHING — a re-fired completion (retry, repeated PATCH) never duplicates a credit.
 *
 * NEVER THROWS: any failure is logged and swallowed — the enrollment completion (already committed
 *   upstream) must not be rolled back and the golden-thread must not break.
 */

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { LmsRepository } from '../repositories/drizzle-lms.repo';

/**
 * Canonical EventEmitter2 topic the LMS completion path publishes when an enrollment reaches
 * 'completed'. Declared here so the emitter (lms-enrollments controller) and this listener share
 * one literal — no cross-cutting constants file edit.
 */
export const COURSE_COMPLETED_EVENT = 'lms.course.completed' as const;

/** Payload contract for {@link COURSE_COMPLETED_EVENT}. */
export interface CourseCompletedPayload {
  /** employees.id — the person who completed the course (enrollments.employee_id). */
  employeeId: number;
  /** courses.id of the completed course. */
  courseId: number;
  /**
   * org_departments.id — the CARD on which the course was completed (enrollments.card_id).
   * Cross-card credit replicates FROM this source card TO the employee's other cards.
   * When the completing enrollment has no card trail this is omitted and the handler no-ops.
   */
  sourceCardId?: number;
  /** users.id of who confirmed completion (audit only; stored as credited_by). */
  completedBy?: number;
}

@Injectable()
export class CourseCompletedCreditHandler {
  private readonly logger = new Logger(CourseCompletedCreditHandler.name);

  constructor(private readonly lmsRepo: LmsRepository) {}

  /**
   * EventEmitter2 entrypoint. Wraps the pure handler so any credit-write failure is logged
   * but never propagates (the enrollment completion is already committed upstream).
   */
  @OnEvent(COURSE_COMPLETED_EVENT)
  async onCourseCompleted(payload: CourseCompletedPayload): Promise<void> {
    try {
      await this.handle(payload);
    } catch (error: unknown) {
      this.logger.error(
        { payload, err: error instanceof Error ? error.message : String(error) },
        'LMS cross-card credit FAILED — boshqa kartalarga kredit yozilmadi',
      );
    }
  }

  /**
   * Replicate a universal-course completion as a cross-card credit onto the employee's other cards.
   * No-op (logged) when the payload is invalid, the source card is unknown, the course is not
   * universal, or the employee holds no other card (FABRIKATSIYA YO'Q — Q-40).
   */
  async handle(payload: CourseCompletedPayload): Promise<void> {
    const employeeId = Number(payload?.employeeId);
    const courseId = Number(payload?.courseId);
    const sourceCardId = Number(payload?.sourceCardId);

    if (!Number.isInteger(employeeId) || employeeId <= 0 || !Number.isInteger(courseId) || courseId <= 0) {
      this.logger.warn({ payload }, 'LMS cross-card credit: invalid payload (employeeId/courseId) — skipped');
      return;
    }
    if (!Number.isInteger(sourceCardId) || sourceCardId <= 0) {
      // Completion not tied to a card (e.g. legacy enrollment with no card_id) — cross-card credit
      // has no source to replicate FROM. Honest skip, not an error.
      this.logger.log({ employeeId, courseId }, 'LMS cross-card credit: kurs kartaga bog\'lanmagan (card_id yo\'q) — skipped');
      return;
    }

    const r = await this.lmsRepo.recordCrossCardCredits(
      employeeId,
      courseId,
      sourceCardId,
      Number.isInteger(payload?.completedBy) ? Number(payload?.completedBy) : undefined,
    );
    if (!r.ok) {
      this.logger.error({ employeeId, courseId, sourceCardId, err: r.error }, 'LMS cross-card credit: yozib bo\'lmadi');
      return;
    }

    if (!r.data.universal) {
      // Q562 SHART: only universal courses replicate. Non-universal = nothing to do (owner data).
      this.logger.log({ courseId }, 'LMS cross-card credit: kurs universal emas — kredit ko\'chmadi (owner data)');
      return;
    }

    this.logger.log(
      { employeeId, courseId, sourceCardId, targetCards: r.data.targetCardIds, credited: r.data.credited },
      'LMS cross-card credit: universal kurs boshqa kartalarga kreditlandi',
    );
  }
}
