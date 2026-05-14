/**
 * @module reports.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { FinanceReportsService } from '../reports/reports.service';
import { unwrapOrInternal } from '@common/http-result';

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('reports')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles('FINANCE_MANAGER', 'ACCOUNTANT', 'SUPER_ADMIN', 'DIRECTOR')
export class ReportsController {
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
}
