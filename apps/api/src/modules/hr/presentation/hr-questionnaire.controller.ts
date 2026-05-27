/**
 * @module hr-questionnaire.controller
 * @description REST endpoints for HR questionnaire templates and candidate responses.
 * Routes: GET /questionnaire-templates, GET /questionnaire
 */

import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { safeCall } from '@common/result';
import { unwrapOrInternal } from '@common/http-result';

type Row = Record<string, unknown>;

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller()
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles('HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR', 'ADMIN', 'MANAGER')
export class HrQuestionnaireController {

  /** GET /api/questionnaire — candidate questionnaire responses list */
  @Get('questionnaire')
  async getQuestionnaire(
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await safeCall(async () => {
      const lim = Math.min(parseInt(limit ?? '50', 10) || 50, 200);
      const rows = await runQuery<Row>(sql`
        SELECT
          qr.id,
          qr.full_name        AS title,
          qr.phone,
          qr.lang             AS category,
          qr.status,
          qr.created_at,
          qr.reviewed_at,
          qt.template_name    AS template,
          p.name_uz           AS position_name,
          (
            SELECT COUNT(*)::int
            FROM jsonb_array_elements(qr.responses) r
          )                   AS questions_count,
          0                   AS responses_count
        FROM questionnaire_responses qr
        LEFT JOIN questionnaire_templates qt ON qt.id::text = qr.template_id
        LEFT JOIN positions p ON p.id = qr.position_id
        WHERE qr.deleted_at IS NULL
          ${status ? sql`AND qr.status = ${status}` : sql``}
        ORDER BY qr.created_at DESC
        LIMIT ${lim}
      `);
      return rows.rows as Row[];
    }, 'DB_ERROR');
    return unwrapOrInternal(result);
  }

  /** GET /api/questionnaire-templates — questionnaire templates with question counts */
  @Get('questionnaire-templates')
  async getQuestionnaireTemplates(
    @Query('type') type?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await safeCall(async () => {
      const lim = Math.min(parseInt(limit ?? '50', 10) || 50, 200);
      const rows = await runQuery<Row>(sql`
        SELECT
          qt.id,
          COALESCE(qt.template_name, 'Nomsiz shablon') AS title,
          COALESCE(qt.template_type, 'general')        AS category,
          qt.description,
          qt.is_active,
          qt.created_at,
          COALESCE(qcount.cnt, 0)::int                 AS questions_count
        FROM questionnaire_templates qt
        LEFT JOIN (
          SELECT template_id, COUNT(*)::int AS cnt
          FROM questionnaire_questions
          GROUP BY template_id
        ) qcount ON qcount.template_id = qt.id
        WHERE qt.is_active = true
          ${type ? sql`AND qt.template_type = ${type}` : sql``}
        ORDER BY qt.created_at DESC
        LIMIT ${lim}
      `);
      return rows.rows as Row[];
    }, 'DB_ERROR');
    return unwrapOrInternal(result);
  }
}
