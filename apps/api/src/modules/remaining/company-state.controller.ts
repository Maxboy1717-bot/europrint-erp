/**
 * @module company-state.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { BadRequestException, Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { throwFromError, unwrapOrThrow } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CompanyStateService } from './company-state.service';
import { CompanyStateSnapshotCron } from './company-state-snapshot.cron';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';
import { z } from 'zod';

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@Controller('company-state')
@UseGuards(RolesGuard)
@Roles('director', 'manager', 'super_admin', 'admin', 'cfo', 'finance_manager', 'ceo')
export class CompanyStateController {
  constructor(
    private readonly svc: CompanyStateService,
    private readonly snapshot: CompanyStateSnapshotCron,
    private readonly i18n: I18nService,
  ) {}

  @Get('current')
  async getCurrent() {
    return unwrapOrThrow(await this.svc.getCurrent());
  }

  // ─── holat tarixi (company_state_log) ────────────────────────────────────────

  @Get('history')
  async getHistory(@Param('limit') _l?: string) {
    const rows = await rawSql(sql`
      SELECT id, state_code, kpis, score_total, detected_at, resolved_at
      FROM company_state_log
      ORDER BY detected_at DESC
      LIMIT 90
    `);
    return rows.rows;
  }

  /**
   * T21-B1 #23: 30-kun holat trendi — kunlik snapshot'lardan (company_state_log)
   * oxirgi N kun (default 30) score_total + state_code qatori, oldindan (ASC)
   * tartiblangan — FE trend-grafik uchun tayyor. `days` 1..365 oralig'ida.
   */
  @Get('trend')
  async getTrend(@Query('days') daysParam?: string) {
    const days = CompanyStateController.TrendDaysSchema.parse(daysParam ?? '30');
    const rows = await rawSql(sql`
      SELECT
        date_trunc('day', detected_at)::date AS day,
        state_code,
        score_total,
        detected_at
      FROM company_state_log
      WHERE detected_at >= NOW() - (${days}::int * INTERVAL '1 day')
      ORDER BY detected_at ASC
    `);
    return { days, points: rows.rows };
  }

  /**
   * EP-DIR-001: trigger a daily holat snapshot on demand (the @Cron writes the same
   * row automatically at 06:00). Idempotent per calendar day. director/admin only.
   */
  @Post('snapshot')
  @Roles('director', 'super_admin', 'admin', 'ceo')
  async takeSnapshot() {
    return unwrapOrThrow(await this.snapshot.snapshotNow());
  }

  /**
   * EP-DIR-005 (vision 05-director #3): run the consecutive daily-decline
   * detector on demand (the cron also runs it right after the daily snapshot).
   * Emits an `EP-DIR-005` domain event when 3 consecutive daily declines are
   * detected (idempotent per calendar day). director/admin only.
   */
  @Post('decline-check')
  @Roles('director', 'super_admin', 'admin', 'ceo')
  async checkDecline() {
    return unwrapOrThrow(await this.svc.detectConsecutiveDecline());
  }

  // ─── state_thresholds config (owner-configurable bands + weights) ────────────

  // T21-B1 #23: trend `days` query — coerced int, 1..365 (default handled at call site).
  private static readonly TrendDaysSchema = z.coerce.number().int().min(1).max(365);

  private static readonly UpdateThresholdSchema = z.object({
    min_value: z.number().optional(),
    max_value: z.number().optional(),
    weight:    z.number().positive().max(1).optional(),
  });

  @Get('thresholds')
  async getThresholds() {
    const rows = await rawSql(sql`
      SELECT id, metric_key, level_code, min_value, max_value, weight
      FROM state_thresholds
      ORDER BY metric_key, level_code
    `);
    return rows.rows;
  }

  @Patch('thresholds/:id')
  async updateThreshold(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    const dto = CompanyStateController.UpdateThresholdSchema.parse(body);
    const rows = await rawSql(sql`
      UPDATE state_thresholds SET
        min_value = COALESCE(${dto.min_value ?? null}::numeric, min_value),
        max_value = COALESCE(${dto.max_value ?? null}::numeric, max_value),
        weight    = COALESCE(${dto.weight    ?? null}::numeric, weight)
      WHERE id = ${id}
      RETURNING id, metric_key, level_code, min_value, max_value, weight
    `);
    const result = rows.rows[0] ?? undefined;
    if (!result) throw new BadRequestException(await this.i18n.t('errors.stateThresholdNotFound', { args: { id } }));
    return result;
  }
}
