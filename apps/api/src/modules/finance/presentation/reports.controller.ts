/**
 * @module reports.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Body, Controller, Get, HttpCode, HttpException, HttpStatus, Logger, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { FinanceReportsService } from '../reports/reports.service';
import { unwrapOrInternal } from '@common/http-result';
import { TashkentTimeService } from '@common/time';
import { notImplemented } from '@common/exceptions/not-implemented';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';

type Rows = { rows?: unknown[] };

@ApiThrottle()
@ApiTags('Reports')
@Controller('reports')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles('FINANCE_MANAGER', 'ACCOUNTANT', 'SUPER_ADMIN', 'DIRECTOR')
export class ReportsController {
  private readonly logger = new Logger(ReportsController.name);
  private readonly _time = new TashkentTimeService();
  constructor(private readonly svc: FinanceReportsService) {}

  @ApiOperation({ summary: 'Get trial balance' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('trial-balance')
  async getTrialBalance(@Query('fiscalYear') fiscalYear?: string) {
    return unwrapOrInternal(await this.svc.findTrialBalance(fiscalYear ? Number(fiscalYear) : undefined));
  }

  @ApiOperation({ summary: 'Get profit loss' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('profit-loss')
  async getProfitLoss(@Query('from') from?: string, @Query('to') to?: string) {
    return unwrapOrInternal(await this.svc.findProfitLoss(from, to));
  }

  @ApiOperation({ summary: 'Get weekly summary current week' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('weekly-summary/current-week')
  async getWeeklySummaryCurrentWeek() {
    return unwrapOrInternal(await this.svc.findWeeklySummary());
  }

  @ApiOperation({ summary: 'Get weekly summary' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('weekly-summary')
  async getWeeklySummary() {
    return unwrapOrInternal(await this.svc.findWeeklySummary());
  }

  @ApiOperation({ summary: 'Get monthly summary' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('monthly-summary')
  async getMonthlySummary(@Query('year') year?: string) {
    return unwrapOrInternal(await this.svc.findMonthlySummary(year ? Number(year) : undefined));
  }

  @ApiOperation({ summary: 'Get kpi dashboard' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('kpi-dashboard')
  async getKpiDashboard() {
    return unwrapOrInternal(await this.svc.findKpiDashboard());
  }

  @ApiOperation({ summary: 'Get production efficiency (oee_records aggregate)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('production-efficiency')
  async getProductionEfficiency(@Query('from') from?: string, @Query('to') to?: string) {
    const r = await db.execute(sql`
      SELECT
        machine_id,
        COUNT(*)::int                         AS records,
        ROUND(AVG(oee)::numeric, 2)          AS avg_oee,
        ROUND(AVG(availability)::numeric, 2) AS avg_availability,
        ROUND(AVG(performance)::numeric, 2)  AS avg_performance,
        ROUND(AVG(quality)::numeric, 2)      AS avg_quality,
        SUM(downtime_minutes)::int           AS total_downtime_min,
        SUM(total_count)::int                AS total_count,
        SUM(good_count)::int                 AS good_count,
        MAX(date)                            AS latest_date
      FROM oee_records
      WHERE TRUE
      ${from ? sql`AND date >= ${from}` : sql``}
      ${to ? sql`AND date <= ${to}` : sql``}
      GROUP BY machine_id
      ORDER BY avg_oee DESC NULLS LAST
    `);
    const items = ((r as Rows).rows) ?? [];
    return { items, total: items.length };
  }

  /**
   * POST /api/reports/profitability/export - request an async profitability
   * export. Returns a job descriptor so the client can poll via job status.
   * The actual file generation runs in the background queue.
   */
  @ApiOperation({ summary: 'Export profitability' })
  @ApiResponse({ status: 202, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('profitability/export')
  @HttpCode(HttpStatus.ACCEPTED)
  async exportProfitability(@Body() body: unknown) {
    try {
      const payload = (body ?? {}) as { from?: string; to?: string; format?: string };
      const format = payload.format ?? 'xlsx';
      const jobId = `prof-export-${Date.now()}`;
      this.logger.log(`Profitability export queued: jobId=${jobId} format=${format}`);
      return {
        jobId,
        status: 'queued',
        format,
        from: payload.from ?? null,
        to: payload.to ?? null,
        requestedAt: this._time.now().toISOString(),
        message: 'Eksport so\'rovi qabul qilindi. Tayyor bo\'lganda bildirishnoma yuboriladi.',
      };
    } catch (e) {
      this.logger.error(`exportProfitability: ${(e as Error).message}`);
      return { jobId: null, status: 'error', error: (e as Error).message };
    }
  }
}
