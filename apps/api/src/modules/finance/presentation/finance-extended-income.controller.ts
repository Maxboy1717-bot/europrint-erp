/**
 * @module finance-extended-income.controller
 * @description Income/expense, inventory-counts, asset-inventory, and daily-metrics
 * endpoints split from the original finance-extended.controller.ts (Rule 16: ≤ 300 lines).
 * Shares the same `/finance-extended` route prefix and roles guard.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, ParseIntPipe, UseGuards, UseInterceptors, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { FinanceExtendedService } from '../finance-extended/finance-extended.service';
import { CreateIncomeExpenseSchema, UpdateIncomeExpenseSchema } from './dto/finance-dtos';
import { unwrapOrInternal } from '@common/http-result';
import { FINANCE_ROLES, CreateInventoryCountSchema, CreateAssetSchema } from './finance-extended-dtos';

@ApiThrottle()
@ApiTags('Finance Extended Income')
@Controller('finance-extended')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...FINANCE_ROLES)
export class FinanceExtendedIncomeController {
  constructor(private readonly svc: FinanceExtendedService) {}

  @ApiOperation({ summary: 'Get income expense summary' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('income-expense/summary')
  async getIncomeExpenseSummary() {
    return unwrapOrInternal(await this.svc.findIncomeExpenseSummary());
  }

  @ApiOperation({ summary: 'Get income expense' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('income-expense')
  async getIncomeExpense(@Query() query: Record<string, unknown>) {
    return unwrapOrInternal(await this.svc.findIncomeExpense(query));
  }

  @ApiOperation({ summary: 'Create income expense' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('income-expense')
  async createIncomeExpense(@Body() body: unknown) {
    const dto = CreateIncomeExpenseSchema.parse(body);
    return unwrapOrInternal(await this.svc.createIncomeExpense(dto as Record<string, unknown>));
  }

  @ApiOperation({ summary: 'Update income expense' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Put('income-expense/:id')
  async updateIncomeExpense(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const dto = UpdateIncomeExpenseSchema.parse(body);
    return unwrapOrInternal(await this.svc.updateIncomeExpense(id, dto as Record<string, unknown>));
  }

  @ApiOperation({ summary: 'Delete income expense' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete('income-expense/:id')
  async deleteIncomeExpense(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.svc.deleteIncomeExpense(id));
  }

  @ApiOperation({ summary: 'Get inventory counts' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('inventory-counts')
  async getInventoryCounts(@Query() query: Record<string, unknown>) {
    return unwrapOrInternal(await this.svc.findInventoryCounts(query));
  }

  @ApiOperation({ summary: 'Create inventory count' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('inventory-counts')
  @HttpCode(HttpStatus.CREATED)
  async createInventoryCount(@Body() body: unknown) {
    const dto = CreateInventoryCountSchema.parse(body);
    return unwrapOrInternal(await this.svc.createInventoryCount(dto));
  }

  @ApiOperation({ summary: 'Get asset inventory' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('asset-inventory')
  async getAssetInventory(@Query() query: Record<string, unknown>) {
    return unwrapOrInternal(await this.svc.findAssetInventory(query));
  }

  @ApiOperation({ summary: 'Create asset' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('asset-inventory')
  @HttpCode(HttpStatus.CREATED)
  async createAsset(@Body() body: unknown) {
    const dto = CreateAssetSchema.parse(body);
    return unwrapOrInternal(await this.svc.createAsset(dto));
  }

  @ApiOperation({ summary: 'Get asset inventory summary' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('asset-inventory/summary')
  async getAssetInventorySummary() {
    return unwrapOrInternal(await this.svc.findAssetInventorySummary());
  }

  @ApiOperation({ summary: 'Get asset by id' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('asset-inventory/:id')
  async getAssetById(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.findAssetInventoryById(id));
  }

  @ApiOperation({ summary: 'Get daily metrics' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('daily-metrics')
  async getDailyMetrics(@Query() query: Record<string, unknown>) {
    return unwrapOrInternal(await this.svc.findDailyMetrics(query));
  }

  @ApiOperation({ summary: 'Get daily metrics today' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('daily-metrics/today')
  async getDailyMetricsToday() {
    return unwrapOrInternal(await this.svc.findDailyMetrics({ date: _time.now().toISOString().split('T')[0] }));
  }

  @ApiOperation({ summary: 'Get overtime' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('overtime')
  async getOvertime(@Query() query: Record<string, unknown>) {
    return unwrapOrInternal(await this.svc.findOvertime(query));
  }

  @ApiOperation({ summary: 'Get customs' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('customs')
  async getCustoms(@Query() query: Record<string, unknown>) {
    return unwrapOrInternal(await this.svc.findCustoms(query));
  }

  @ApiOperation({ summary: 'Get insurance' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('insurance')
  async getInsurance(@Query() query: Record<string, unknown>) {
    return unwrapOrInternal(await this.svc.findInsurance(query));
  }

  @ApiOperation({ summary: 'Get ai finance insights' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('ai-finance-insights')
  getAiFinanceInsights() {
    return { insights: [], generatedAt: _time.now().toISOString() };
  }
}
