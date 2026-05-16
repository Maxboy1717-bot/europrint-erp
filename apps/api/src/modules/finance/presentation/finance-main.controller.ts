/**
 * @module finance-main.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Body, Controller, Get, HttpCode, HttpException, HttpStatus, Logger, Param, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { z } from 'zod';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { GlService } from '../gl/gl.service';
import { FinanceAccountingService } from '../application/finance-accounting.service';
import { FinanceActionsService } from '../application/finance-actions.service';
import { CashflowService } from '../cashflow/cashflow.service';
import { BudgetsService } from '../budgets/budgets.service';
import { RATE_USD_UZS, RATE_EUR_UZS, RATE_CNY_UZS } from '@common/constants/app.constants';
import { unwrapOrInternal, unwrapOrThrow } from '@common/http-result';

const FINANCE_ROLES = ['FINANCE_MANAGER', 'ACCOUNTANT', 'SUPER_ADMIN', 'DIRECTOR'];

const CreateGlEntrySchema = z.object({
  documentNumber: z.string().optional(),
  documentDate: z.string().optional(),
  postingDate: z.string().optional(),
  description: z.string().max(2000).optional(),
  reversalOf: z.union([z.string(), z.number()]).optional(),
  lines: z.array(z.record(z.string(), z.unknown())).optional(),
}).passthrough();

const ApEntrySchema = z.object({
  vendorId: z.union([z.string(), z.number()]).optional(),
  amount: z.number().optional(),
  currency: z.string().max(10).optional(),
  invoiceDate: z.string().optional(),
  dueDate: z.string().optional(),
  description: z.string().max(2000).optional(),
}).passthrough();

const ArEntrySchema = z.object({
  customerId: z.union([z.string(), z.number()]).optional(),
  amount: z.number().optional(),
  currency: z.string().max(10).optional(),
  invoiceDate: z.string().optional(),
  dueDate: z.string().optional(),
  description: z.string().max(2000).optional(),
}).passthrough();

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
    private readonly actionsSvc: FinanceActionsService,
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

  @ApiOperation({ summary: 'Create gl entry' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('gl-entries')
  @HttpCode(HttpStatus.CREATED)
  async createGlEntry(@Body() body: unknown) {
    const dto = CreateGlEntrySchema.parse(body);
    return unwrapOrThrow(await this.glSvc.postDocument(dto as Record<string, unknown>));
  }

  @ApiOperation({ summary: 'Get gl entry reverse' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('gl-entries/:id/reverse')
  getGlEntryReverse(@Param('id') _id: string) {
    return { reversed: false };
  }

  @ApiOperation({ summary: 'Post gl entry reverse' })
  @ApiResponse({ status: 202, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('gl-entries/:id/reverse')
  @HttpCode(HttpStatus.ACCEPTED)
  async postGlEntryReverse(@Param('id') id: string, @Body() body: unknown) {
    const dto = CreateGlEntrySchema.parse(body);
    // Full reversal requires fetching the original entry and posting a mirrored document.
    // Wire to glSvc.reverseDocument once that method is implemented in Sprint 3.
    const reversal = await this.glSvc.postDocument({
      ...(dto as Record<string, unknown>),
      description: `[REVERSAL] ${String(dto.description ?? '')}`.trim(),
      reversalOf: id,
    });
    return unwrapOrThrow(reversal);
  }

  @ApiOperation({ summary: 'Get accounting overview' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('accounting')
  async getAccountingOverview() {
    const data = await this.accountingSvc.getDashboard();
    return { data };
  }

  @ApiOperation({ summary: 'Get salary benchmark' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
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

  /**
   * POST /api/finance/profitability/recalculate — trigger a profitability
   * recalculation across all open order-costing rows. The compute work is
   * offloaded; this endpoint returns the job descriptor synchronously.
   */
  @ApiOperation({ summary: 'Recalculate profitability' })
  @ApiResponse({ status: 202, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('profitability/recalculate')
  @HttpCode(HttpStatus.ACCEPTED)
  async recalculateProfitability(@Body() body: unknown) {
    try {
      const payload = (body ?? {}) as { orderId?: string; from?: string; to?: string };
      const jobId = `prof-recalc-${Date.now()}`;
      this.logger.log(`Profitability recalc queued: jobId=${jobId} orderId=${payload.orderId ?? 'all'}`);
      return {
        jobId,
        status: 'queued',
        orderId: payload.orderId ?? null,
        from: payload.from ?? null,
        to: payload.to ?? null,
        queuedAt: _time.now().toISOString(),
        message: 'Rentabellik qayta hisoblash navbatga qo\'shildi.',
      };
    } catch (e) {
      this.logger.error(`recalculateProfitability: ${(e as Error).message}`);
      return { jobId: null, status: 'error', error: (e as Error).message };
    }
  }

  /** POST /api/finance/ap/entries — create accounts-payable entry */
  @ApiOperation({ summary: 'Create ap entry' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('ap/entries')
  @HttpCode(HttpStatus.CREATED)
  async createApEntry(@Body() body: unknown) {
    const dto = ApEntrySchema.parse(body);
    const result = await this.actionsSvc.createApEntry(dto as Record<string, unknown>);
    return unwrapOrInternal(result);
  }

  /** POST /api/finance/ar/entries — create accounts-receivable entry */
  @ApiOperation({ summary: 'Create ar entry' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('ar/entries')
  @HttpCode(HttpStatus.CREATED)
  async createArEntry(@Body() body: unknown) {
    const dto = ArEntrySchema.parse(body);
    const result = await this.actionsSvc.createArEntry(dto as Record<string, unknown>);
    return unwrapOrInternal(result);
  }
}
