/**
 * @module ai-interview-v2.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, NotFoundException } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db , runQuery, rawSql } from '@shared/db';
import { eq, sql } from 'drizzle-orm';
import { hr_interview_sessions, vacancies } from '@shared/db';
import { safeCall, Result } from '@common/result';

type Row = Record<string, unknown>;

@Injectable()
export class AiInterviewV2Repository {
  async createSession(dto: { token: string; expiresAt: string; candidateName: string; candidateLanguage: string; candidateId?: number | null; vacancyId?: number | null; createdBy: number }): Promise<Result<Row>> {
    return safeCall(async () => {
      // Use rawSql to avoid Drizzle schema/DB column mismatch issues
      const r = await rawSql(sql`
        INSERT INTO hr_interview_sessions
          (token, expires_at, candidate_name, candidate_language, status, candidate_id, vacancy_id, created_by)
        VALUES
          (${dto.token}, ${dto.expiresAt}::timestamptz, ${dto.candidateName}, ${dto.candidateLanguage ?? 'uz'},
           'pending', ${dto.candidateId ?? null}, ${dto.vacancyId ?? null}, ${dto.createdBy})
        RETURNING id, token, expires_at, candidate_name, candidate_language, status, candidate_id, vacancy_id, created_at
      `);
      const row = (r as { rows?: Row[] }).rows?.[0] ?? {};
      return castTo<Row>(row);
      }, 'DB_ERROR');
  }

  async findSessionByToken(token: string): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT s.id, s.token, s.candidate_name, s.candidate_language, s.status,
               s.expires_at, s.started_at, s.camera_rejections,
               v.title AS job_title
        FROM hr_interview_sessions s
        LEFT JOIN vacancies v ON v.id = s.vacancy_id
        WHERE s.token = ${token}
      `);
      return (rows.rows[0] ?? null) as Row | null;
      }, 'DB_ERROR');
  }

  async markSessionExpired(token: string): Promise<void> {
    await db.update(hr_interview_sessions)
      .set({ status: 'expired' })
      .where(eq(hr_interview_sessions.token, token));
  }

  async startSession(sessionId: number): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.update(hr_interview_sessions).set({
        status:     'active',
        started_at: _time.now(),
      }).where(sql`${hr_interview_sessions.id} = ${sessionId} AND ${hr_interview_sessions.status} IN ('pending')`).returning();
      if (!rows[0]) throw new NotFoundException(`Session #${sessionId} not found or already active`);
      return castTo<Row>((rows[0] ?? {}));
      }, 'DB_ERROR');
  }

  async completeSession(sessionId: number, scores: { communicationScore?: number; confidenceScore?: number; problemSolvingScore?: number; bodyLanguageScore?: number; emotionalStateScore?: number; professionalAppearanceScore?: number; overallScore?: number; recommendation?: string; aiSummary?: string; transcript?: string }): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.update(hr_interview_sessions).set({
        status:                      'completed',
        completed_at:                _time.now(),
        communication_score:         scores.communicationScore ?? null,
        confidence_score:            scores.confidenceScore ?? null,
        problem_solving_score:       scores.problemSolvingScore ?? null,
        body_language_score:         scores.bodyLanguageScore ?? null,
        emotional_state_score:       scores.emotionalStateScore ?? null,
        professional_appearance_score: scores.professionalAppearanceScore ?? null,
        overall_score:               scores.overallScore ?? null,
        recommendation:              scores.recommendation ?? null,
        ai_summary:                  scores.aiSummary ?? null,
        transcript:                  scores.transcript ?? null,
      }).where(eq(hr_interview_sessions.id, sessionId)).returning();
      return castTo<Row>((rows[0] ?? {}));
      }, 'DB_ERROR');
  }

  async cancelSession(sessionId: number, reason: string): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.update(hr_interview_sessions).set({
        status:       'cancelled',
        ai_summary:   `Cancelled: ${reason}`,
        completed_at: _time.now(),
      }).where(eq(hr_interview_sessions.id, sessionId)).returning();
      return castTo<Row>((rows[0] ?? {}));
      }, 'DB_ERROR');
  }

  async findSessionForCameraReport(token: string): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.select({
        id:                 hr_interview_sessions.id,
        status:             hr_interview_sessions.status,
        camera_rejections:  hr_interview_sessions.camera_rejections,
        candidate_language: hr_interview_sessions.candidate_language,
      })
        .from(hr_interview_sessions)
        .where(eq(hr_interview_sessions.token, token))
        .limit(1);
      return castTo<Row | null>((rows[0] ?? null));
      }, 'DB_ERROR');
  }

  async cancelByCameraRejection(token: string, newCount: number): Promise<void> {
    await db.update(hr_interview_sessions).set({
      status:            'cancelled',
      camera_rejections: newCount,
      ai_summary:        'Cancelled: camera_rejected_3_times',
      completed_at:      _time.now(),
    }).where(eq(hr_interview_sessions.token, token));
  }

  async updateCameraRejectionCount(token: string, newCount: number): Promise<void> {
    await db.update(hr_interview_sessions)
      .set({ camera_rejections: newCount })
      .where(eq(hr_interview_sessions.token, token));
  }

  async listSessions(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await db.select()
        .from(hr_interview_sessions)
        .orderBy(sql`${hr_interview_sessions.created_at} DESC`)
        .limit(100);
      return castTo<Row[]>(rows);
      }, 'DB_ERROR');
  }

  async getSession(id: number): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.select()
        .from(hr_interview_sessions)
        .where(eq(hr_interview_sessions.id, id))
        .limit(1);
      if (!rows[0]) throw new NotFoundException(`Session #${id} not found`);
      return castTo<Row>((rows[0] ?? {}));
      }, 'DB_ERROR');
  }

  async getPipelineStats(): Promise<Result<Row>> {
    return safeCall(async () => {
      const r = await db.select({
        pending_count:   sql<number>`COUNT(*) FILTER (WHERE ${hr_interview_sessions.status} = 'pending')`,
        active_count:    sql<number>`COUNT(*) FILTER (WHERE ${hr_interview_sessions.status} = 'active')`,
        completed_count: sql<number>`COUNT(*) FILTER (WHERE ${hr_interview_sessions.status} = 'completed')`,
        expired_count:   sql<number>`COUNT(*) FILTER (WHERE ${hr_interview_sessions.status} = 'expired')`,
        today_count:     sql<number>`COUNT(*) FILTER (WHERE DATE(${hr_interview_sessions.created_at}) = CURRENT_DATE)`,
      }).from(hr_interview_sessions);
      return (r[0] ?? { pending_count: 0, active_count: 0, completed_count: 0, expired_count: 0, today_count: 0 }) as Row;
      }, 'DB_ERROR');
  }
}
