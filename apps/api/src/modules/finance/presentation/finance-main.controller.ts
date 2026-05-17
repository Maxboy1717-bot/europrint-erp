/**
 * @module finance-main.controller
 * @description Read endpoints under `/finance` (dashboard, GL, exchange rates,
 * transactions, expenses, loans). The write/action endpoints (GL POST, reversal,
 * profitability recalc, AP/AR entries, salary benchmark) were extracted to
 * `finance-main-actions.controller.ts` per Rule 16 (≤ 300 lines). Both controllers
 * share the `/finance` prefix and FINANCE_ROLES guard so consumers see no change.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Controller, Get, HttpException, HttpStatus, Param, Query, UseGuards, UseInterceptors } from '@nestjs/common';
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
import { RATE_USD_UZS, RATE_EUR_UZS, RATE_CNY_UZS } from '@common/constants/app.constants';
import { unwrapOrInternal, unwrapOrThrow } from '@common/http-result';

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
  getExchangeRates() {
    return {
      base: 'UZS',
      date: _time.now().toISOString().slice(0, 10),
      rates: { USD: RATE_USD_UZS, EUR: RATE_EUR_UZS, RUB: 140, CNY: RATE_CNY_UZS },
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

  // P3-26: finance reports listing not yet wired.
  @ApiOperation({ summary: 'Get reports' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Get('reports')
  getReports(@Query() _query: Record<string, unknown>) {
    throw new HttpException(
      { message: 'Endpoint not yet implemented: GET /finance/reports', code: 'NOT_IMPLEMENTED' },
      HttpStatus.NOT_IMPLEMENTED,
    );
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

  // P3-26: loans module is not yet implemented in the finance service layer.
  @ApiOperation({ summary: 'Get loans' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('loans')
  getLoans(@Query('status') _status?: string, @Query('page') _page?: string) {
    throw new HttpException(
      { message: 'Endpoint not yet implemented: GET /finance/loans', code: 'NOT_IMPLEMENTED' },
      HttpStatus.NOT_IMPLEMENTED,
    );
  }

  @ApiOperation({ summary: 'Get loan by id' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('loans/:id')
  getLoanById(@Param('id') _id: string) {
    throw new HttpException(
      { message: 'Endpoint not yet implemented: GET /finance/loans/:id', code: 'NOT_IMPLEMENTED' },
      HttpStatus.NOT_IMPLEMENTED,
    );
  }

  @ApiOperation({ summary: 'Get accounting overview' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('accounting')
  async getAccountingOverview() {
    const data = await this.accountingSvc.getDashboard();
    return { data };
  }
}
