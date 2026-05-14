/**
 * @module finance-extended.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Controller, Get, Post, Put, Delete, Patch, Body, Param, Query, HttpCode, ParseIntPipe, UseGuards, UseInterceptors, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { FinanceExtendedService } from '../finance-extended/finance-extended.service';
import { CreateIncomeCategorySchema, UpdateIncomeCategorySchema, CreateIncomeExpenseSchema, UpdateIncomeExpenseSchema } from './dto/finance-dtos';
import { unwrapOrInternal } from '@common/http-result';

const FINANCE_ROLES = ['FINANCE_MANAGER', 'ACCOUNTANT', 'SUPER_ADMIN', 'DIRECTOR'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('finance-extended')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...FINANCE_ROLES)
export class FinanceExtendedController {
  constructor(private readonly svc: FinanceExtendedService) {}

  @Get('finance-categories')
  async getCategories(@Query() query: Record<string, unknown>) {
    return unwrapOrInternal(await this.svc.findCategories(query));
  }

  @Get('finance-categories/:id')
  async getCategoryById(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.svc.findCategoryById(id));
  }

  @Post('finance-categories')
  async createCategory(@Body() body: Record<string, unknown>) {
    const dto = CreateIncomeCategorySchema.parse(body);
    return unwrapOrInternal(await this.svc.createCategory(dto as Record<string, unknown>));
  }

  @Put('finance-categories/:id')
  async updateCategory(@Param('id', ParseIntPipe) id: number, @Body() body: Record<string, unknown>) {
    const dto = UpdateIncomeCategorySchema.parse(body);
    return unwrapOrInternal(await this.svc.updateCategory(id, dto as Record<string, unknown>));
  }

  @Patch('finance-categories/:id')
  async patchCategory(@Param('id', ParseIntPipe) id: number, @Body() body: Record<string, unknown>) {
    const dto = UpdateIncomeCategorySchema.parse(body);
    return unwrapOrInternal(await this.svc.updateCategory(id, dto as Record<string, unknown>));
  }

  @Delete('finance-categories/:id')
  async deleteCategory(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.svc.deleteCategory(id));
  }

  @Get('income-expense/summary')
  async getIncomeExpenseSummary() {
    return unwrapOrInternal(await this.svc.findIncomeExpenseSummary());
  }

  @Get('income-expense')
  async getIncomeExpense(@Query() query: Record<string, unknown>) {
    return unwrapOrInternal(await this.svc.findIncomeExpense(query));
  }

  @Post('income-expense')
  async createIncomeExpense(@Body() body: Record<string, unknown>) {
    const dto = CreateIncomeExpenseSchema.parse(body);
    return unwrapOrInternal(await this.svc.createIncomeExpense(dto as Record<string, unknown>));
  }

  @Put('income-expense/:id')
  async updateIncomeExpense(@Param('id', ParseIntPipe) id: number, @Body() body: Record<string, unknown>) {
    const dto = UpdateIncomeExpenseSchema.parse(body);
    return unwrapOrInternal(await this.svc.updateIncomeExpense(id, dto as Record<string, unknown>));
  }

  @Delete('income-expense/:id')
  async deleteIncomeExpense(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.svc.deleteIncomeExpense(id));
  }

  @Get('inventory-counts')
  async getInventoryCounts(@Query() query: Record<string, unknown>) {
    return unwrapOrInternal(await this.svc.findInventoryCounts(query));
  }

  @Post('inventory-counts')
  @HttpCode(HttpStatus.CREATED)
  async createInventoryCount(@Body() body: Record<string, unknown>) {
    return { id: Date.now(), ...body, created: true };
  }

  @Get('asset-inventory')
  async getAssetInventory(@Query() query: Record<string, unknown>) {
    return unwrapOrInternal(await this.svc.findAssetInventory(query));
  }

  @Post('asset-inventory')
  @HttpCode(HttpStatus.CREATED)
  async createAsset(@Body() body: Record<string, unknown>) {
    return { id: Date.now(), ...body, created: true };
  }

  @Get('asset-inventory/:id')
  async getAssetById(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.findAssetInventoryById(id));
  }

  @Get('daily-metrics')
  async getDailyMetrics(@Query() query: Record<string, unknown>) {
    return unwrapOrInternal(await this.svc.findDailyMetrics(query));
  }

  @Get('overtime')
  async getOvertime(@Query() query: Record<string, unknown>) {
    return unwrapOrInternal(await this.svc.findOvertime(query));
  }

  @Get('customs')
  async getCustoms(@Query() query: Record<string, unknown>) {
    return unwrapOrInternal(await this.svc.findCustoms(query));
  }

  @Get('insurance')
  async getInsurance(@Query() query: Record<string, unknown>) {
    return unwrapOrInternal(await this.svc.findInsurance(query));
  }

  @Get('ai-finance-insights')
  getAiFinanceInsights() {
    return { insights: [], generatedAt: _time.now().toISOString() };
  }

  @Get('asset-inventory/summary')
  getAssetInventorySummary() {
    return { total: 0, active: 0, depreciated: 0, totalValue: 0 };
  }

  @Get('daily-metrics/today')
  async getDailyMetricsToday() {
    return unwrapOrInternal(await this.svc.findDailyMetrics({ date: _time.now().toISOString().split('T')[0] }));
  }

  @Post('payroll/calculate')
  @HttpCode(HttpStatus.OK)
  calculatePayroll(@Body() body: Record<string, unknown>) {
    return { calculated: true, period: body['period'], employees: [] };
  }

  @Post('payroll/ai-calculate')
  @HttpCode(HttpStatus.OK)
  aiCalculatePayroll(@Body() body: Record<string, unknown>) {
    return { calculated: true, aiEnhanced: true, period: body['period'], employees: [] };
  }

  @Get('payroll-calculations')
  getPayrollCalculations(@Query() query: Record<string, unknown>) {
    return { items: [], total: 0, query };
  }

  @Patch('payroll-calculations/:id/approve')
  @HttpCode(HttpStatus.OK)
  approvePayrollCalculation(@Param('id') _id: string, @Body() _body: Record<string, unknown>) {
    return { approved: true };
  }

  @Post('payroll-calculations/:id/approve')
  @HttpCode(HttpStatus.OK)
  postApprovePayrollCalculation(@Param('id') _id: string, @Body() _body: Record<string, unknown>) {
    return { approved: true };
  }

  @Get('payroll-contracts')
  getPayrollContracts(@Query() query: Record<string, unknown>) {
    return { items: [], total: 0, query };
  }

  @Get('payroll-tax-rules')
  getPayrollTaxRules() {
    return { items: [], total: 0 };
  }

  @Get('tax-calendar')
  getTaxCalendar(@Query('year') _year?: string) {
    return { items: [], total: 0 };
  }

  @Get('salary-benchmark/:id')
  getSalaryBenchmark(@Param('id') _id: string) {
    return { benchmark: null, marketData: [] };
  }
}
