/**
 * @module lms-exams.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Result, Ok, Err, AppErr } from '@common/result';
import { LmsExamsRepository, type ReTeachNotificationRow } from '../../infrastructure/repositories/drizzle-lms-exams.repo';
import {
  EXAM_PASSED_EVENT,
  type ExamPassedPayload,
} from '../../infrastructure/event-handlers/exam-passed.contract';
import { LMS_AUTO_RETEACH_FAIL_THRESHOLD } from '../constants/lms-completion.constants';

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

    // ⭐ EP-LMS #3: 2 marta yiqilsa AVTO qayta-oqish (rahbar tasdiqisiz) + murabbiy/HR xabar.
    //   Grading allaqachon saqlangan; bu blok NON-BLOCKING — xatosi imtihon natijasini buzmaydi.
    if (!passedBool && Number.isInteger(examId) && examId > 0) {
      await this.maybeAutoReTeach(examId, Number(userId));
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

  /**
   * EP-LMS #3 — auto re-teach on repeated failure. When a user has failed one exam
   * LMS_AUTO_RETEACH_FAIL_THRESHOLD (2) times, reopen the exam's course enrollment to
   * in_progress (no supervisor approval) and notify the failing employee + card mentor(s)
   * + HR. Fully non-blocking + Result-based; never throws into submitExam.
   */
  private async maybeAutoReTeach(examId: number, userId: number): Promise<void> {
    try {
      const countRes = await this.repo.countFailedSubmittedAttempts(examId, userId);
      if (!countRes.ok) {
        this.logger.warn(`re-teach count skipped exam=${examId} user=${userId}: ${countRes.error.message}`);
        return;
      }
      const failCount = countRes.data;
      if (failCount < LMS_AUTO_RETEACH_FAIL_THRESHOLD) return;

      const reopenRes = await this.repo.reopenEnrollmentForExam(examId, userId);
      if (!reopenRes.ok) {
        this.logger.warn(`re-teach reopen skipped exam=${examId} user=${userId}: ${reopenRes.error.message}`);
      }

      const recRes = await this.repo.findReTeachRecipients(examId, userId);
      const mentorIds = recRes.ok ? recRes.data.mentorIds : [];
      const hrIds = recRes.ok ? recRes.data.hrIds : [];

      const rows: ReTeachNotificationRow[] = [{
        userId,
        type: 'lms_auto_reteach',
        title: `Qayta-o'qishga yo'naltirildingiz`,
        body: `Imtihondan ${failCount} marta o'ta olmadingiz — kurs avtomatik qayta-o'qish uchun ochildi.`,
        referenceId: examId,
        referenceType: 'lms_exam',
        priority: 'high',
      }];
      const alertIds = Array.from(new Set([...mentorIds, ...hrIds])).filter(id => id !== userId);
      for (const rid of alertIds) {
        rows.push({
          userId: rid,
          type: 'lms_reteach_alert',
          title: `Xodim imtihondan 2 marta yiqildi`,
          body: `Xodim (user #${userId}) imtihondan (#${examId}) ${failCount} marta o'ta olmadi va qayta-o'qishga yo'naltirildi.`,
          referenceId: examId,
          referenceType: 'lms_exam',
          priority: 'normal',
        });
      }

      const insRes = await this.repo.insertReTeachNotifications(rows);
      if (!insRes.ok) {
        this.logger.warn(`re-teach notify skipped exam=${examId} user=${userId}: ${insRes.error.message}`);
        return;
      }
      this.logger.log(`EP-LMS#3 auto re-teach: exam=${examId} user=${userId} fails=${failCount} reopened=${reopenRes.ok ? reopenRes.data.reopened : false} notified=${insRes.data}`);
    } catch (e) {
      this.logger.warn(`maybeAutoReTeach failed exam=${examId} user=${userId}: ${String(e)}`);
    }
  }
}
