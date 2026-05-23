/**
 * @module enps.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db , runQuery } from '@shared/db';
import { eq, sql } from 'drizzle-orm';
import { enps_surveys, enps_responses } from '@shared/db';
import { safeCall, Result } from '@common/result';

type Row = Record<string, unknown>;

@Injectable()
export class EnpsRepository {
  async createSurvey(dto: { title: string; description?: string; period: string; startDate?: string; endDate: string; createdBy?: number }): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.insert(enps_surveys).values({
        title:       dto.title,
        description: dto.description ?? null,
        period:      dto.period,
        startDate:  (dto.startDate ?? null) as string,
        endDate:    dto.endDate,
        createdBy:  dto.createdBy ?? null,
        status:      'draft',
      }).returning();
      return castTo<Row>((rows[0] ?? {}));
      }, 'DB_ERROR');
  }

  async launchSurvey(surveyId: number): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.update(enps_surveys)
        .set({ status: 'active', startDate: sql`CURRENT_DATE` })
        .where(eq(enps_surveys.id, surveyId))
        .returning();
      return castTo<Row>((rows[0] ?? {}));
      }, 'DB_ERROR');
  }

  async closeSurvey(surveyId: number): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.update(enps_surveys)
        .set({ status: 'closed', endDate: sql`CURRENT_DATE` })
        .where(eq(enps_surveys.id, surveyId))
        .returning();
      return castTo<Row>((rows[0] ?? {}));
      }, 'DB_ERROR');
  }

  async submitResponse(dto: { surveyId: number; employeeId: number; score: number; comment?: string; answers?: Record<string, unknown> }): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.insert(enps_responses).values({
        survey_id:   dto.surveyId,
        employee_id: dto.employeeId,
        score:       dto.score,
        comment:     dto.comment ?? null,
        answers:     dto.answers ?? null,
      }).returning();
      return castTo<Row>((rows[0] ?? {}));
      }, 'DB_ERROR');
  }

  async getSurveyResults(surveyId: number): Promise<Result<Row>> {
    return safeCall(async () => {
      const r = await db.select({
        total_responses: sql<number>`COUNT(*)`,
        avg_score:       sql<number>`AVG(${enps_responses.score})`,
        promoters:       sql<number>`COUNT(*) FILTER (WHERE ${enps_responses.score} >= 9)`,
        passives:        sql<number>`COUNT(*) FILTER (WHERE ${enps_responses.score} BETWEEN 7 AND 8)`,
        detractors:      sql<number>`COUNT(*) FILTER (WHERE ${enps_responses.score} <= 6)`,
      })
        .from(enps_responses)
        .where(eq(enps_responses.survey_id, surveyId));
      return (r[0] ?? {}) as Row;
      }, 'DB_ERROR');
  }

  async listSurveys(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT s.*, COUNT(r.id) AS response_count
        FROM enps_surveys s
        LEFT JOIN enps_responses r ON r.survey_id = s.id
        GROUP BY s.id
        ORDER BY s.created_at DESC
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async getPendingSurveys(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT s.id AS survey_id, s.title,
               COUNT(e.id) FILTER (WHERE er.id IS NULL) AS pending_count
        FROM enps_surveys s
        CROSS JOIN employees e
        LEFT JOIN enps_responses er ON er.survey_id = s.id AND er.employee_id = e.id
        WHERE s.status = 'active' AND e.status = 'active' AND s.end_date >= CURRENT_DATE
        GROUP BY s.id, s.title
        HAVING COUNT(e.id) FILTER (WHERE er.id IS NULL) > 0
        ORDER BY pending_count DESC
        LIMIT 5
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }
}
