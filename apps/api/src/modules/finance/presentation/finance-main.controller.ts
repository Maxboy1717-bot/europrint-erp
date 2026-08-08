/**
 * @module finance-main.controller
 * @description Read endpoints under `/finance` (dashboard, GL, exchange rates,
 * transactions, expenses, loans). The write/action endpoints (GL POST, reversal,
 * profitability recalc, AP/AR entries, salary benchmark) were extracted to
 * `finance-main-actions.controller.ts` per Rule 16 (в‰¤ 300 lines). Both controllers
 * share the `/finance` prefix and FINANCE_ROLES guard so consumers see no change.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Controller, Get, HttpException, HttpStatus, Logger, Param, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { GlService } from '../gl/gl.service';
import { FinanceAccountingService } from '../application/finance-accounting.service';
import { CashflowService } from '../cashflow/cashflow.service';
import { BudgetsService } from '../budgets/budgets.service';
import { RATE_USD_UZS, RATE_EUR_UZS, RATE_RUB_UZS, RATE_CNY_UZS } from '@common/constants/app.constants';
import { unwrapOrInternal, unwrapOrThrow } from '@common/http-result';
import { notImplemented } from '@common/exceptions/not-implemented';
import { rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';

export { FinanceMainActionsController } from './finance-main-actions.controller';

const FINANCE_ROLES = ['FINANCE_MANAGER', 'ACCOUNTANT', 'SUPER_ADMIN', 'DIRECTOR'];



@ApiThrottle()
@ApiTags('Finance Main')
@ApiBearerAuth()
@Controller('finance')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...FINANCE_ROLES)
export class FinanceMainController {
  private readonly logger = new Logger(FinanceMainController.name);

  constructor(
    private readonly glSvc: GlService,
    private readonly accountingSvc: FinanceAccountingService,
    private readonly cashflowSvc: CashflowService,
    private readonly budgetsSvc: BudgetsService,
  ) {}

  @ApiOperation({ summary: 'Get dashboard' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('dashboard')
  async getDashboard() {
    return unwrapOrInternal(await this.accountingSvc.getDashboard());
  }

  @ApiOperation({ summary: 'Get gl entries' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('gl-entries')
  async getGlEntries(@Query('page') page?: string, @Query('limit') limit?: string) {
    return unwrapOrInternal(await this.glSvc.findAllDocuments({ page, limit }));
  }

  @ApiOperation({ summary: 'Get gl accounts' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('gl-accounts')
  async getGlAccounts() {
    return unwrapOrInternal(await this.glSvc.findAllAccounts());
  }

  @ApiOperation({ summary: 'Get exchange rates' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('exchange-rates')
  async getExchangeRates() {
    try {
      const r = await rawSql(sql`
        SELECT UPPER(from_currency) AS cur, rate::numeric AS rate, rate_date
        FROM exchange_rates
        WHERE UPPER(to_currency) = 'UZS'
        ORDER BY created_at DESC LIMIT 10
      `);
      const rows = (r as { rows?: Record<string, unknown>[] }).rows ?? [];
      if (rows.length > 0) {
        const rates: Record<string, number> = {};
        let rateDate = _time.now().toISOString().slice(0, 10);
        for (const row of rows) {
          const cur = String(row['cur'] ?? '');
          if (cur && rates[cur] === undefined) {
            rates[cur] = Number(row['rate']);
            if (row['rate_date']) rateDate = String(row['rate_date']).slice(0, 10);
          }
        }
        return { base: 'UZS', date: rateDate, rates, source: 'db' };
      }
    } catch (e) {
      this.logger.warn(`exchange_rates so'rovi muvaffaqiyatsiz, zaxira kurslarga o'tildi: ${e}`);
    }
    this.logger.warn("exchange_rates jadvalida qator topilmadi — zaxira (hardcoded) kurslar qaytarilmoqda");
    return {
      base: 'UZS',
      date: _time.now().toISOString().slice(0, 10),
      rates: { USD: RATE_USD_UZS, EUR: RATE_EUR_UZS, RUB: RATE_RUB_UZS, CNY: RATE_CNY_UZS },
      source: 'default',
    };
  }

  @ApiOperation({ summary: 'Get transactions' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('transactions')
  async getTransactions(@Query() query: Record<string, unknown>) {
    return unwrapOrThrow(await this.cashflowSvc.findTransactions(query));
  }

  @ApiOperation({ summary: 'Get budget' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('budget')
  async getBudget(@Query() query: Record<string, unknown>) {
    return unwrapOrThrow(await this.budgetsSvc.findAll(query));
  }

  @ApiOperation({ summary: 'Get cash flow' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('cash-flow')
  async getCashFlow(@Query() query: Record<string, unknown>) {
    return unwrapOrThrow(await this.cashflowSvc.findTransactions(query));
  }

  // FEATURE_FLAGGED: finance reports listing not wired (tracking #FX-4).
  @ApiOperation({ summary: 'Get reports' })
  @ApiResponse({ status: 501, description: 'Feature gated off - tracking #FX-4' })
  @Get('reports')
  getReports(@Query() _query: Record<string, unknown>) {
    return notImplemented('GET /finance/reports');
  }

  @ApiOperation({ summary: 'Get accounts' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('accounts')
  async getAccounts(@Query() _query: Record<string, unknown>) {
    return unwrapOrInternal(await this.glSvc.findAllAccounts());
  }

  @ApiOperation({ summary: 'Get expenses' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('expenses')
  async getExpenses(@Query() query: Record<string, unknown>) {
    return unwrapOrInternal(await this.accountingSvc.getExpenseReports(
      query['status'] as string | undefined,
      Number(query['page'] ?? 1),
      Number(query['limit'] ?? 20),
    ));
  }

  @ApiOperation({ summary: 'Get expense reports' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('expense-reports')
  async getExpenseReports(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return unwrapOrInternal(await this.accountingSvc.getExpenseReports(status, Number(page ?? 1), Number(limit ?? 20)));
  }

  @ApiOperation({ summary: 'Get expense report' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('expense-reports/:id')
  async getExpenseReport(@Param('id') id: string) {
    return unwrapOrInternal(await this.accountingSvc.getExpenseReportById(id));
  }

  // FEATURE_FLAGGED: loans module not implemented in finance service (tracking #FX-4).
  // Note: GET /finance/loans/:id deleted - no frontend consumer (catalog 2026-05-17).
  @ApiOperation({ summary: 'Get loans' })
  @ApiResponse({ status: 501, description: 'Feature gated off - tracking #FX-4' })
  @Get('loans')
  getLoans(@Query('status') _status?: string, @Query('page') _page?: string) {
    return notImplemented('GET /finance/loans');
  }

  @ApiOperation({ summary: 'Get accounting overview' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('accounting')
  async getAccountingOverview() {
    const data = await this.accountingSvc.getDashboard();
    return { data };
  }
}
