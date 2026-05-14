/**
 * @module financial-reports.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Body, Controller, Get, HttpCode, HttpStatus, Logger, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrInternal } from '@common/http-result';
import { FinancialReportsQueryService } from '../services/financial-reports-query.service';
import { FinancialReportsAnalyticsService } from '../services/financial-reports-analytics.service';
import { FinancialReportsDailyCron } from '../cron/financial-reports-daily.cron';

const REPORT_ROLES = ['FINANCE_MANAGER', 'ACCOUNTANT', 'SUPER_ADMIN', 'DIRECTOR'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('financial-reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...REPORT_ROLES)
export class FinancialReportsController {
  private readonly logger = new Logger(FinancialReportsController.name);

  constructor(
    private readonly query: FinancialReportsQueryService,
    private readonly analytics: FinancialReportsAnalyticsService,
    private readonly dailyCron: FinancialReportsDailyCron,
  ) {}

  // ─── Core data endpoints ────────────────────────────────────────────────

  @Get('kassa')
  async getKassa(@Query('date') date?: string) {
    return unwrapOrInternal(await this.query.getCashSummary(date));
  }

  @Get('ombor')
  async getOmbor(@Query('warehouseId') warehouseId?: string) {
    return unwrapOrInternal(await this.query.getWarehouseBalance(warehouseId ? parseInt(warehouseId, 10) : undefined));
  }

  @Get('debitorlar')
  async getDebitorlar(@Query('date') date?: string) {
    return unwrapOrInternal(await this.query.getReceivables(date));
  }

  @Get('kreditorlar')
  async getKreditorlar(@Query('date') date?: string) {
    return unwrapOrInternal(await this.query.getPayables(date));
  }

  @Get('balans')
  async getBalans(@Query('date') date?: string) {
    return unwrapOrInternal(await this.query.getBalanceSheet(date));
  }

  @Get('ishlab-chiqarish')
  async getIshlabChiqarish(@Query('date') date?: string) {
    return unwrapOrInternal(await this.query.getProductionMetrics(date));
  }

  // ─── Analytics endpoint ─────────────────────────────────────────────────

  @Get('analytics')
  async getAnalytics(@Query('date') date?: string) {
    const today = date ?? _time.now().toISOString().slice(0, 10);
    const [cashR, balanceR, productionR] = await Promise.all([
      this.query.getCashSummary(today),
      this.query.getBalanceSheet(today),
      this.query.getProductionMetrics(today),
    ]);

    const cash    = cashR.ok    ? cashR.data    : null;
    const balance = balanceR.ok ? balanceR.data : null;
    const prod    = productionR.ok ? productionR.data : null;

    const liquidity = balance
      ? this.analytics.liquidityRatios(
          balance.currentAssets, 0, cash?.closingBalance ?? 0, balance.currentLiabilities,
        )
      : null;

    const profitability = balance
      ? this.analytics.roaRoe(balance.retainedEarnings, balance.totalAssets, balance.equity)
      : null;

    const cashTrend = cash
      ? this.analytics.trendAnalysis([cash.openingBalance, cash.closingBalance])
      : null;

    return {
      date: today,
      liquidity,
      profitability,
      cashTrend,
      productionEfficiency: prod?.efficiencyPct ?? null,
      ccc: null,
    };
  }

  // ─── Dashboard ───────────────────────────────────────────────────────────

  @Get('dashboard')
  async getDashboard(@Query('date') date?: string) {
    return unwrapOrInternal(await this.query.getDashboard(date));
  }

  // ─── Alert endpoints ─────────────────────────────────────────────────────

  @Get('alerts/overstock')
  async getOverstockAlerts() {
    return unwrapOrInternal(await this.query.getOverstockAlerts());
  }

  @Get('alerts/overdue-debts')
  async getOverdueDebtAlerts() {
    return unwrapOrInternal(await this.query.getOverdueDebtAlerts());
  }

  @Post('alerts/send-report')
  @HttpCode(HttpStatus.OK)
  async sendReportNow(@Body() _body: Record<string, unknown>) {
    this.logger.log('Manual report trigger requested');
    // Fire daily report pipeline without waiting for cron
    this.dailyCron.dailyReport().catch((err) => this.logger.error(`Manual trigger error: ${String(err)}`));
    return { sent: true, triggeredAt: _time.now().toISOString() };
  }
}
