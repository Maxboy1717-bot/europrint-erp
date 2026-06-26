/**
 * @module lms-exams.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Result, Ok, Err, AppErr } from '@common/result';
import { LmsExamsRepository } from '../../infrastructure/repositories/drizzle-lms-exams.repo';
import {
  EXAM_PASSED_EVENT,
  type ExamPassedPayload,
} from '../../infrastructure/event-handlers/exam-passed.contract';

export interface ExamResult {
  score:   number;
  status:  'passed' | 'failed';
  correct: number;
  total:   number;
  passed:  boolean;
  message?: string;
}

@Injectable()
export class LmsExamsService {
  private readonly logger = new Logger(LmsExamsService.name);

  constructor(
    private readonly repo: LmsExamsRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * submitExam — grades an existing in-progress attempt and persists the result.
   * The controller passes attemptId (FK to lms_exam_attempts.id), not examId.
   * Delegates to repo.submitAttemptById which:
   *  1. resolves exam_id from the attempt row
   *  2. grades answers vs lms_exam_questions.correct_option
   *  3. UPDATEs score/passed/submitted_at/status on the existing row
   *
   * ⭐ Gap #2 (T20-A1) — IMTIHON→RAZRYAD AVTO-ZANJIR: imtihon O'TGANDA (passed)
   *   `lms.exam.passed` event emit qilinadi. Org-structure ExamPassedRazryadHandler
   *   uni qabul qilib, kartaning navbatdagi razryadiga `RazryadHistoryService.createRequest`
   *   (ai_suggested=true) avto-chaqiradi — 2-imzo oqimi (HR + rahbar) keyin qo'lda davom etadi.
   *   Emit NON-BLOCKING: event xatosi imtihon natijasini (allaqachon saqlangan) buzmaydi.
   */
  async submitExam(attemptId: number, userId: number): Promise<Result<ExamResult>> {
    const result = await this.repo.submitAttemptById(attemptId, userId, []);
    if (!result.ok) {
      const errMsg = typeof result.error === 'string' ? result.error : (result.error?.message ?? 'Urinish topilmadi');
      this.logger.warn(`submitExam failed attempt=${attemptId} user=${userId}: ${errMsg}`);
      return Err(AppErr('NOT_FOUND', errMsg));
    }
    const row = result.data as Record<string, unknown>;
    const scoreNum = Number(row.score ?? 0);
    const passedBool = Boolean(row.passed);
    const examId = Number(row.exam_id ?? 0);

    // ⭐ Gap #2: passed → razryad-so'rov avto-zanjir (NON-BLOCKING, fire-and-forget).
    if (passedBool && Number.isInteger(examId) && examId > 0) {
      try {
        const payload: ExamPassedPayload = {
          examId,
          userId: Number(userId),
          attemptId: Number(attemptId),
          score: scoreNum,
          passedAt: new Date().toISOString(),
        };
        this.eventEmitter.emit(EXAM_PASSED_EVENT, payload);
      } catch (e) {
        this.logger.warn(`exam.passed emit skipped (attempt=${attemptId}, user=${userId}): ${String(e)}`);
      }
    }

    return Ok<ExamResult>({
      score:   scoreNum,
      status:  passedBool ? 'passed' : 'failed',
      correct: 0,
      total:   0,
      passed:  passedBool,
      message: String(row.message ?? 'Imtihon topshirildi'),
    });
  }
}
