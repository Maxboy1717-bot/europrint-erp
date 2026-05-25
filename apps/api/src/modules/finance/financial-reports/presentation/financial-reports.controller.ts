/**
 * @module financial-reports.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Body, Controller, Get, HttpCode, HttpStatus, Logger, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { unwrapOrInternal } from '@common/http-result';
import { FinancialReportsQueryService } from '../services/financial-reports-query.service';
import { FinancialReportsAnalyticsService } from '../services/financial-reports-analytics.service';
import { FinancialReportsDailyCron } from '../cron/financial-reports-daily.cron';

const REPORT_ROLES = ['FINANCE_MANAGER', 'ACCOUNTANT', 'SUPER_ADMIN', 'DIRECTOR'];

@ApiThrottle()
@ApiTags('Financial Reports')
@ApiBearerAuth()
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

  @ApiOperation({ summary: 'Get kassa' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('kassa')
  async getKassa(@Query('date') date?: string) {
    return unwrapOrInternal(await this.query.getCashSummary(date));
  }

  @ApiOperation({ summary: 'Get ombor' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('ombor')
  async getOmbor(@Query('warehouseId') warehouseId?: string) {
    return unwrapOrInternal(await this.query.getWarehouseBalance(warehouseId ? parseInt(warehouseId, 10) : undefined));
  }

  @ApiOperation({ summary: 'Get debitorlar' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('debitorlar')
  async getDebitorlar(@Query('date') date?: string) {
    return unwrapOrInternal(await this.query.getReceivables(date));
  }

  @ApiOperation({ summary: 'Get kreditorlar' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('kreditorlar')
  async getKreditorlar(@Query('date') date?: string) {
    return unwrapOrInternal(await this.query.getPayables(date));
  }

  @ApiOperation({ summary: 'Get balans' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('balans')
  async getBalans(@Query('date') date?: string) {
    return unwrapOrInternal(await this.query.getBalanceSheet(date));
  }

  @ApiOperation({ summary: 'Get ishlab chiqarish' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('ishlab-chiqarish')
  async getIshlabChiqarish(@Query('date') date?: string) {
    return unwrapOrInternal(await this.query.getProductionMetrics(date));
  }

  // ─── Analytics endpoint ─────────────────────────────────────────────────

  @ApiOperation({ summary: 'Get analytics' })
  @ApiResponse({ status: 200, description: 'OK' })
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

  @ApiOperation({ summary: 'Get dashboard' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('dashboard')
  async getDashboard(@Query('date') date?: string) {
    return unwrapOrInternal(await this.query.getDashboard(date));
  }

  // ─── Alert endpoints ─────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Get overstock alerts' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('alerts/overstock')
  async getOverstockAlerts() {
    return unwrapOrInternal(await this.query.getOverstockAlerts());
  }

  @ApiOperation({ summary: 'Get overdue debt alerts' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('alerts/overdue-debts')
  async getOverdueDebtAlerts() {
    return unwrapOrInternal(await this.query.getOverdueDebtAlerts());
  }

  @ApiOperation({ summary: 'Send report now' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('alerts/send-report')
  @HttpCode(HttpStatus.OK)
  async sendReportNow(@Body() _body: Record<string, unknown>) {
    this.logger.log('Manual report trigger requested');
    // Fire daily report pipeline without waiting for cron
    this.dailyCron.dailyReport().catch((err) => this.logger.error(`Manual trigger error: ${String(err)}`));
    return { sent: true, triggeredAt: _time.now().toISOString() };
  }
}
