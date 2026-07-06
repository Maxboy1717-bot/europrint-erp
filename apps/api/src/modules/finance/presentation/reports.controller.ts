/**
 * @module reports.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Body, Controller, Get, HttpCode, HttpException, HttpStatus, InternalServerErrorException, Logger, Post, Query, Res, UseGuards, UseInterceptors } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { FinanceReportsService } from '../reports/reports.service';
import { TrialBalancePdfService } from '../reports/trial-balance-pdf.service';
import { unwrapOrInternal, unwrapOrThrow } from '@common/http-result';
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
  constructor(
    private readonly svc: FinanceReportsService,
    private readonly trialBalancePdf: TrialBalancePdfService,
  ) {}

  @ApiOperation({ summary: 'Get trial balance' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('trial-balance')
  async getTrialBalance(@Query('fiscalYear') fiscalYear?: string) {
    return unwrapOrInternal(await this.svc.findTrialBalance(fiscalYear ? Number(fiscalYear) : undefined));
  }

  /**
   * F10 (ACCOUNTING-STANDARDS-AUDIT-2026-07-06): "Real financial-statement export" —
   * ilgari faqat JSON qaytadigan export nuqtalari bor edi (masalan
   * POST /reports/profitability/export). Bu haqiqiy PDF fayl generatsiya qiladi
   * (pdf-lib, allaqachon tasdiqlangan bog'liqlik) real trial-balance ma'lumotidan.
   */
  @ApiOperation({ summary: 'Export trial balance as PDF' })
  @ApiResponse({ status: 200, description: 'application/pdf' })
  @Get('trial-balance/export/pdf')
  async exportTrialBalancePdf(@Query('fiscalYear') fiscalYearParam: string | undefined, @Res() res: FastifyReply) {
    const fiscalYear = fiscalYearParam ? Number(fiscalYearParam) : this._time.now().getFullYear();
    const balance = unwrapOrThrow(await this.svc.findTrialBalance(fiscalYear)) as {
      accounts: Array<{ accountCode: string; accountName: string; accountType: string; debitBalance: number; creditBalance: number }>;
      totals: { debitBalance: number; creditBalance: number };
      asOfDate: string;
    };
    const pdfResult = await this.trialBalancePdf.generateTrialBalancePdf({ ...balance, fiscalYear });
    if (!pdfResult.ok) {
      throw new InternalServerErrorException(pdfResult.error.message);
    }
    const buffer = pdfResult.data;
    res
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `attachment; filename="sinov-balansi-${fiscalYear}.pdf"`)
      .header('Content-Length', buffer.length)
      .send(buffer);
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
    // NOTE: raw SQL kept for two reasons — (1) GROUP BY machine_id with multiple
    // AVG/SUM aggregates + ORDER BY avg_oee DESC NULLS LAST is a multi-aggregate
    // report query, not a single-row CRUD lookup; (2) `oee_records` has a Drizzle
    // definition (lib/db/src/schema/pp/pp-enhanced.ts → oeeRecords) but it is only
    // exported from the separate `@workspace/db` package, which is NOT re-exported
    // through the `@shared/db` barrel this controller imports (`import { db } from
    // '@shared/db'`) — so there is no reachable schema object here to build against
    // without introducing a new cross-package import. Left as documented raw SQL.
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
   * POST /api/reports/profitability/export — returns real order_costings data.
   * File generation (xlsx/csv) requires a real export engine; until then the
   * endpoint returns the raw dataset (JSON) so callers have actual data.
   */
  @ApiOperation({ summary: 'Export profitability' })
  @ApiResponse({ status: 202, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 500, description: 'DB error during export' })
  @Post('profitability/export')
  @HttpCode(HttpStatus.ACCEPTED)
  async exportProfitability(@Body() body: unknown) {
    type Row = Record<string, unknown>;
    try {
      const payload = (body ?? {}) as { from?: string; to?: string };
      // NOTE: no reachable Drizzle schema for `order_costings` at this import path —
      // two conflicting pgTable definitions exist in the monorepo
      // (apps/api/src/shared/db/schema-finance-extended.ts and
      // lib/db/src/schema/fi-budgets.ts) but NEITHER is re-exported through the
      // `@shared/db` barrel this controller imports (`import { db } from
      // '@shared/db'`), and the two definitions disagree on `id` (integer PK vs
      // serial) and on the column set (only fi-budgets.ts has energy_cost/
      // waste_cost/gross_profit/profit_margin, which this query selects). Forcing
      // a conversion would require picking one of two divergent schemas and adding
      // a new cross-file import — left as documented raw SQL until the duplicate
      // `order_costings` schema definitions are reconciled (see schema-finance-extended.ts:68
      // comment "needs reconciliation first").
      const r = await db.execute(sql`
        SELECT id, sales_order_id, production_order_id,
               material_cost, labor_cost, overhead_cost, energy_cost, waste_cost,
               total_cost, selling_price, gross_profit, profit_margin,
               status, calculated_at, created_at
        FROM order_costings
        WHERE TRUE
        ${payload.from ? sql`AND calculated_at >= ${payload.from}::timestamptz` : sql``}
        ${payload.to   ? sql`AND calculated_at <= ${payload.to}::timestamptz`   : sql``}
        ORDER BY calculated_at DESC NULLS LAST LIMIT 500
      `);
      const rows = (((r as { rows?: Row[] }).rows) ?? []);
      this.logger.log(`Profitability export: ${rows.length} rows returned`);
      return { data: rows, total: rows.length, exportedAt: this._time.now().toISOString() };
    } catch (e) {
      this.logger.error(`exportProfitability: ${(e as Error).message}`);
      // Q6 (2026-07-04): was silently swallowed into a 202 { data: [], total: 0, error }
      // body — caller saw "Accepted, zero rows" for a failed DB query, indistinguishable
      // from "no data in range". Now surfaces as a real 500 (Q-40 catch-swallow fix).
      throw new InternalServerErrorException((e as Error).message);
    }
  }
}
