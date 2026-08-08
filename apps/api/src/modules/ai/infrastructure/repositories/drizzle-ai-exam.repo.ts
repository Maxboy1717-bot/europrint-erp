/**
 * @module drizzle-ai-exam.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { eq, sql } from 'drizzle-orm';
import { DrizzleService } from '@common/services/drizzle.service';
import { runQuery } from '@shared/db';
import { safeCall, Result } from '@common/result';
import { aiExamAttempts } from '@europrint/schemas';
import { AiExamAttempt, AiExamDetail } from '../../presentation/dto/ai-exam.dto';

@Injectable()
export class DrizzleAiExamRepo {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly i18n: I18nService,
  ) {}

  async findAllAttempts(): Promise<Result<AiExamAttempt[]>> {
    return safeCall(async () => {
      const rows = await this.drizzle.db
        .select()
        .from(aiExamAttempts)
        .limit(100);
      return (Array.isArray(rows) ? rows : []).map((r): AiExamAttempt => ({
        id:             r.id,
        userId:         r.employeeId,
        employeeId:     r.employeeId,
        fullName:       '',
        positionName:   '',
        positionNameRu: '',
        score:          r.score,
        status:         r.status,
        startedAt:      r.createdAt?.toISOString() ?? _time.now().toISOString(),
        completedAt:    r.submittedAt?.toISOString() ?? null,
        analyzedAt:     r.analyzedAt?.toISOString() ?? null,
      }));
    });
  }

  async findAttemptById(id: string): Promise<Result<AiExamDetail | null>> {
    return safeCall(async () => {
      const [row] = await this.drizzle.db
        .select()
        .from(aiExamAttempts)
        .where(eq(aiExamAttempts.id, id))
        .limit(1);
      if (!row) return null;
      const detail: AiExamDetail = {
        attempt: {
          id:          row.id,
          userId:      String(row.employeeId),
          positionId:  '',
          questions:   (row.questions as { id: string; question: string; category: string }[]) ?? [],
          answers:     (row.answers as Record<string, string>) ?? null,
          gptAnalysis: row.gptAnalysis ?? null,
          score:       row.score,
          evaluation:  (row.evaluation as Record<string, { comment: string; score: number; maxScore: number }>) ?? null,
          status:      row.status,
          startedAt:   row.createdAt?.toISOString() ?? '',
          completedAt: row.submittedAt?.toISOString() ?? null,
          analyzedAt:  row.analyzedAt?.toISOString() ?? null,
        },
        user:     { id: row.employeeId, employeeId: '', fullName: '', lang: 'uz' },
        position: { id: '', name: '', nameRu: null },
      };
      return detail;
    });
  }

  async assignExam(userId: string, positionId: string): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [row] = await this.drizzle.db
        .insert(aiExamAttempts)
        .values({ employeeId: userId, status: 'assigned', questions: [] })
        .returning();
      if (!row) throw new InternalServerErrorException(await this.i18n.t('errors.examAssignmentFailed'));
      return { id: row.id, userId, positionId, status: 'assigned' };
    });
  }

  async submitAttempt(attemptId: string, answers: Record<string, string>): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [row] = await this.drizzle.db
        .update(aiExamAttempts)
        .set({ answers, status: 'submitted', submittedAt: _time.now() })
        .where(eq(aiExamAttempts.id, attemptId))
        .returning();
      if (!row) throw new NotFoundException(await this.i18n.t('errors.examAttemptNotFound', { args: { id: attemptId } }));
      return { id: row.id, status: 'submitted', answerCount: Object.keys(answers).length };
    });
  }

  async deleteAttempt(id: string): Promise<Result<void>> {
    return safeCall(async () => {
      const deleted = await this.drizzle.db
        .delete(aiExamAttempts)
        .where(eq(aiExamAttempts.id, id))
        .returning({ id: aiExamAttempts.id });
      if (deleted.length === 0) throw new NotFoundException(await this.i18n.t('errors.examAttemptNotFound', { args: { id } }));
    });
  }

  // ─── Card-scoped (ORG Phase 4B) ───────────────────────────────────────────
  // Parametrized SQL on the real integer columns (user_id/position_id/org_function_id);
  // the Drizzle aiExamAttempts schema predates org_function_id + the integer ids.

  /**
   * Assign a per-card AI exam (EP-ORG-046): question pool = hr_question_bank filtered by
   * card-type (org_function_id) + razryad (or razryad-agnostic). Persists ai_exam_attempts
   * scoped to the card. NOT NULL columns user_id/position_id/questions/answers all supplied.
   */
  async assignExamToCard(userId: number, orgFunctionId: number, razryadLevelId: number | null): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      type Q = { id: number; question_uz: string | null; question_ru: string | null; category: string | null };
      const pool = await runQuery<Q>(sql`
        SELECT id, question_uz, question_ru, category
        FROM hr_question_bank
        WHERE org_function_id = ${orgFunctionId} AND is_active = true
          AND (${razryadLevelId}::int IS NULL OR razryad_level_id = ${razryadLevelId} OR razryad_level_id IS NULL)
        ORDER BY difficulty ASC NULLS LAST, id ASC
        LIMIT 20
      `);
      const questions = (Array.isArray(pool.rows) ? pool.rows : []).map((q) => ({
        id: String(q.id), question: String(q.question_uz ?? ''),
        questionRu: String(q.question_ru ?? ''), category: String(q.category ?? ''),
      }));
      const ins = await runQuery<{ id: number }>(sql`
        INSERT INTO ai_exam_attempts (user_id, position_id, org_function_id, questions, answers, status, assigned_at)
        VALUES (${userId}, ${orgFunctionId}, ${orgFunctionId}, ${JSON.stringify(questions)}::jsonb, '{}'::jsonb, 'assigned', NOW())
        RETURNING id
      `);
      const id = (Array.isArray(ins.rows) ? ins.rows : [])[0]?.id ?? null;
      return { id, userId, orgFunctionId, razryadLevelId, status: 'assigned', questionCount: questions.length };
    });
  }

  /** All AI-exam attempts for a card (EP-ORG, card UI "this card's exams"). */
  async findAttemptsByCard(orgFunctionId: number): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => {
      const r = await runQuery<Record<string, unknown>>(sql`
        SELECT id, user_id, status, score,
               jsonb_array_length(COALESCE(questions, '[]'::jsonb)) AS question_count,
               assigned_at, completed_at
        FROM ai_exam_attempts
        WHERE org_function_id = ${orgFunctionId}
        ORDER BY assigned_at DESC NULLS LAST, id DESC
        LIMIT 100
      `);
      return Array.isArray(r.rows) ? r.rows : [];
    });
  }
}
