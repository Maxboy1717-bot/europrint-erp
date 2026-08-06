/**
 * @module lms-core.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { castTo } from '@common/db-rows';
import { Result, Err } from '@common/result';
import { LmsExamsRepository } from '../../infrastructure/repositories/drizzle-lms-exams.repo';
import { CreateExamDto, SubmitExamDto } from '../../presentation/dto/lms-core.dto';
import { EXAM_PASSED_EVENT, type ExamPassedPayload } from '../../infrastructure/event-handlers/exam-passed.contract';

@Injectable()
export class LmsCoreService {
  private readonly logger = new Logger(LmsCoreService.name);

  constructor(
    private readonly examsRepo: LmsExamsRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getLesson(id: string): Promise<Result<Record<string, unknown>>> {
    return this.examsRepo.findLesson(id);
  }

  async listExams(userId: string): Promise<Result<object[]>> {
    return this.examsRepo.findAllExams(userId);
  }

  async createExam(dto: CreateExamDto): Promise<Result<Record<string, unknown>>> {
    return this.examsRepo.saveExam(castTo<Record<string, unknown>>(dto));
  }

  async submitExam(
    examId: string,
    userId: string,
    dto: SubmitExamDto,
  ): Promise<Result<Record<string, unknown>>> {
    if (!userId || userId === '0') return Err('Foydalanuvchi aniqlanmadi');
    const answers = Array.isArray(dto.answers)
      ? (dto.answers as Array<{ questionId: number; selectedOption: number }>)
      : [];
    const result = await this.examsRepo.submitExam(examId, userId, answers);
    // audit 2026-08-06 T15: this is the path the real FE (LMSDashboard) uses, but it
    // never emitted lms.exam.passed — so the razryad auto-request listener
    // (exam-passed-razryad.listener.ts) could never fire. The "canonical"
    // submitAttemptById path that does emit is unreachable (attempts are always
    // inserted as status='submitted'). Emit here too, same guard pattern as
    // lms-exams.service.ts.
    if (result.ok && result.data['passed'] === true) {
      try {
        const payload: ExamPassedPayload = {
          examId:    Number(result.data['exam_id'] ?? parseInt(examId, 10)),
          userId:    parseInt(userId, 10),
          attemptId: Number(result.data['id'] ?? 0),
          score:     Number(result.data['score'] ?? 0),
          passedAt:  new Date().toISOString(),
        };
        this.eventEmitter.emit(EXAM_PASSED_EVENT, payload);
      } catch (e) {
        this.logger.warn(`exam.passed emit skipped (exam=${examId}, user=${userId}): ${String(e)}`);
      }
    }
    return result;
  }

  /** Returns exam questions (no correct_option) for the FE exam-taking UI. */
  async getExamQuestions(examId: string): Promise<Result<object[]>> {
    return this.examsRepo.findExamQuestions(examId);
  }

  async getRecentActivity(userId: string): Promise<Result<object[]>> {
    if (!userId || userId === '0') return Err('Foydalanuvchi aniqlanmadi');
    return this.examsRepo.findRecentActivity(userId);
  }

  async getMyProgress(userId: string): Promise<Result<Record<string, unknown>>> {
    if (!userId || userId === '0') return Err('Foydalanuvchi aniqlanmadi');
    return this.examsRepo.findMyProgress(userId);
  }

  /** Returns top performers sorted by completed_courses DESC, avg_score DESC (max 20). */
  async getLeaderboard(): Promise<Result<object[]>> {
    return this.examsRepo.findLeaderboard();
  }

  /** A5: records a lesson completion on the user's course enrollment (real progress write). */
  async completeCourse(userId: string, courseId: number, lessonId: number | null): Promise<Result<{ certificateIssued: boolean; saved: boolean }>> {
    if (!userId || userId === '0') return Err('Foydalanuvchi aniqlanmadi');
    if (!courseId) return Err('courseId talab qilinadi');
    return this.examsRepo.recordLessonProgress(userId, courseId, lessonId);
  }
}
