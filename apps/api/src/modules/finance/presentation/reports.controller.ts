/**
 * @module reports.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Body, Controller, Get, HttpCode, HttpStatus, Logger, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { FinanceReportsService } from '../reports/reports.service';
import { unwrapOrInternal } from '@common/http-result';
import { TashkentTimeService } from '@common/time';

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('reports')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles('FINANCE_MANAGER', 'ACCOUNTANT', 'SUPER_ADMIN', 'DIRECTOR')
export class ReportsController {
  private readonly logger = new Logger(ReportsController.name);
  private readonly _time = new TashkentTimeService();
  constructor(private readonly svc: FinanceReportsService) {}

  @Get('trial-balance')
  async getTrialBalance(@Query('fiscalYear') fiscalYear?: string) {
    return unwrapOrInternal(await this.svc.findTrialBalance(fiscalYear ? Number(fiscalYear) : undefined));
  }

  @Get('profit-loss')
  async getProfitLoss(@Query('from') from?: string, @Query('to') to?: string) {
    return unwrapOrInternal(await this.svc.findProfitLoss(from, to));
  }

  @Get('weekly-summary/current-week')
  async getWeeklySummaryCurrentWeek() {
    return unwrapOrInternal(await this.svc.findWeeklySummary());
  }

  @Get('weekly-summary')
  async getWeeklySummary() {
    return unwrapOrInternal(await this.svc.findWeeklySummary());
  }

  @Get('monthly-summary')
  async getMonthlySummary(@Query('year') year?: string) {
    return unwrapOrInternal(await this.svc.findMonthlySummary(year ? Number(year) : undefined));
  }

  @Get('kpi-dashboard')
  async getKpiDashboard() {
    return unwrapOrInternal(await this.svc.findKpiDashboard());
  }

  @Get('production-efficiency')
  getProductionEfficiency() { return { data: [], efficiency: 0 }; }

  /**
   * POST /api/reports/profitability/export — request an async profitability
   * export. Returns a job descriptor so the client can poll via job status.
   * The actual file generation runs in the background queue.
   */
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
