import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Controller, Get, InternalServerErrorException, Param, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { GlService } from '../gl/gl.service';
import { FinanceAccountingService } from '../application/finance-accounting.service';
import { FinanceActionsService } from '../application/finance-actions.service';
import { RATE_USD_UZS, RATE_EUR_UZS, RATE_CNY_UZS } from '@common/constants/app.constants';
import { unwrapOrInternal, unwrapOrThrow } from '@common/http-result';

const FINANCE_ROLES = ['FINANCE_MANAGER', 'ACCOUNTANT', 'SUPER_ADMIN', 'DIRECTOR'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('finance')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...FINANCE_ROLES)
export class FinanceMainController {
  constructor(
    private readonly glSvc: GlService,
    private readonly accountingSvc: FinanceAccountingService,
    private readonly actionsSvc: FinanceActionsService,
  ) {}

  @Get('dashboard')
  async getDashboard() {
    return unwrapOrInternal(await this.accountingSvc.getDashboard());
  }

  @Get('gl-entries')
  async getGlEntries(@Query('page') page?: string, @Query('limit') limit?: string) {
    return unwrapOrInternal(await this.glSvc.findAllDocuments({ page, limit }));
  }

  @Get('gl-accounts')
  async getGlAccounts() {
    return unwrapOrInternal(await this.glSvc.findAllAccounts());
  }

  @Get('exchange-rates')
  getExchangeRates() {
    return {
      base: 'UZS',
      date: _time.now().toISOString().slice(0, 10),
      rates: { USD: RATE_USD_UZS, EUR: RATE_EUR_UZS, RUB: 140, CNY: RATE_CNY_UZS },
    };
  }

  @Get('transactions')
  getTransactions(@Query() _query: Record<string, unknown>) {
    return { data: [], pagination: { total: 0, page: 1, limit: 20 } };
  }

  @Get('budget')
  getBudget(@Query() _query: Record<string, unknown>) {
    return { data: [], pagination: { total: 0, page: 1, limit: 20 } };
  }

  @Get('cash-flow')
  getCashFlow(@Query() _query: Record<string, unknown>) {
    return { data: [], pagination: { total: 0, page: 1, limit: 20 } };
  }

  @Get('reports')
  getReports(@Query() _query: Record<string, unknown>) {
    return { data: [], pagination: { total: 0, page: 1, limit: 20 } };
  }

  @Get('accounts')
  async getAccounts(@Query() _query: Record<string, unknown>) {
    return unwrapOrInternal(await this.glSvc.findAllAccounts());
  }

  @Get('expenses')
  getExpenses(@Query() _query: Record<string, unknown>) {
    return { data: [], pagination: { total: 0, page: 1, limit: 20 } };
  }

  @Get('expense-reports')
  async getExpenseReports(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return unwrapOrInternal(await this.accountingSvc.getExpenseReports(status, Number(page ?? 1), Number(limit ?? 20)));
  }

  @Get('expense-reports/:id')
  async getExpenseReport(@Param('id') id: string) {
    return unwrapOrInternal(await this.accountingSvc.getExpenseReportById(id));
  }

  @Get('loans')
  getLoans(@Query('status') _status?: string, @Query('page') _page?: string) {
    return { items: [], total: 0 };
  }

  @Get('loans/:id')
  getLoanById(@Param('id') _id: string) {
    return { loan: null };
  }

  @Get('gl-entries/:id/reverse')
  getGlEntryReverse(@Param('id') _id: string) {
    return { reversed: false };
  }

  @Get('accounting')
  async getAccountingOverview() {
    const data = await this.accountingSvc.getDashboard();
    return { data };
  }

  @Get('salary-benchmark/:userId')
  async getSalaryBenchmark(@Param('userId') userId: string) {
    const r = await this.actionsSvc.getSalaryBenchmark();
    const row = unwrapOrThrow(r);
    return {
      data: {
        userId,
        market_min: row['market_min'] ?? null,
        market_median: row['market_median'] ?? null,
        market_max: row['market_max'] ?? null,
        market_avg: row['market_avg'] ?? null,
        sample_size: Number(row['sample_size'] ?? 0),
        currency: 'UZS',
      },
    };
  }
}
