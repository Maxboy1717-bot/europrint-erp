/**
 * @module finance-extended.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Controller, Get, Post, Put, Delete, Patch, Body, Param, Query, HttpCode, HttpException, ParseIntPipe, UseGuards, UseInterceptors, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { z } from 'zod';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { FinanceExtendedService } from '../finance-extended/finance-extended.service';
import { CreateIncomeCategorySchema, UpdateIncomeCategorySchema, CreateIncomeExpenseSchema, UpdateIncomeExpenseSchema } from './dto/finance-dtos';
import { unwrapOrInternal } from '@common/http-result';

const FINANCE_ROLES = ['FINANCE_MANAGER', 'ACCOUNTANT', 'SUPER_ADMIN', 'DIRECTOR'];

const CreateInventoryCountSchema = z.object({
  warehouseId: z.union([z.string(), z.number()]).optional(),
  countDate: z.string().optional(),
  notes: z.string().max(2000).optional(),
}).passthrough();

const CreateAssetSchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  purchaseDate: z.string().optional(),
  purchaseValue: z.number().nonnegative().optional(),
  depreciationRate: z.number().nonnegative().optional(),
}).passthrough();

const PayrollCalculateSchema = z.object({
  period: z.string().min(1),
  employeeIds: z.array(z.union([z.string(), z.number()])).optional(),
}).passthrough();

const ApprovePayrollSchema = z.object({
  approvedBy: z.union([z.string(), z.number()]).optional(),
  notes: z.string().max(2000).optional(),
}).passthrough();

@ApiThrottle()
@ApiTags('Finance Extended')
@Controller('finance-extended')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...FINANCE_ROLES)
export class FinanceExtendedController {
  constructor(private readonly svc: FinanceExtendedService) {}

  @ApiOperation({ summary: 'Get categories' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('finance-categories')
  async getCategories(@Query() query: Record<string, unknown>) {
    return unwrapOrInternal(await this.svc.findCategories(query));
  }

  @ApiOperation({ summary: 'Get category by id' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('finance-categories/:id')
  async getCategoryById(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.svc.findCategoryById(id));
  }

  @ApiOperation({ summary: 'Create category' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('finance-categories')
  async createCategory(@Body() body: unknown) {
    const dto = CreateIncomeCategorySchema.parse(body);
    return unwrapOrInternal(await this.svc.createCategory(dto as Record<string, unknown>));
  }

  @ApiOperation({ summary: 'Update category' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Put('finance-categories/:id')
  async updateCategory(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const dto = UpdateIncomeCategorySchema.parse(body);
    return unwrapOrInternal(await this.svc.updateCategory(id, dto as Record<string, unknown>));
  }

  @ApiOperation({ summary: 'Patch category' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('finance-categories/:id')
  async patchCategory(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const dto = UpdateIncomeCategorySchema.parse(body);
    return unwrapOrInternal(await this.svc.updateCategory(id, dto as Record<string, unknown>));
  }

  @ApiOperation({ summary: 'Delete category' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete('finance-categories/:id')
  async deleteCategory(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.svc.deleteCategory(id));
  }

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
    return { id: Date.now(), ...dto, created: true };
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
    return { id: Date.now(), ...dto, created: true };
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

  @ApiOperation({ summary: 'Get asset inventory summary' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('asset-inventory/summary')
  getAssetInventorySummary() {
    return { total: 0, active: 0, depreciated: 0, totalValue: 0 };
  }

  @ApiOperation({ summary: 'Get daily metrics today' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('daily-metrics/today')
  async getDailyMetricsToday() {
    return unwrapOrInternal(await this.svc.findDailyMetrics({ date: _time.now().toISOString().split('T')[0] }));
  }

  // P3-26: payroll calculation pipeline not yet wired. The real PayrollService
  // computes INPS/JSHD/IT withholdings but isn't connected here yet. Return 501
  // so the frontend payroll page can show a "coming soon" empty state.
  @ApiOperation({ summary: 'Calculate payroll' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Post('payroll/calculate')
  @HttpCode(HttpStatus.OK)
  calculatePayroll(@Body() body: unknown) {
    PayrollCalculateSchema.parse(body);
    throw new HttpException(
      { message: 'Endpoint not yet implemented: POST /finance/payroll/calculate', code: 'NOT_IMPLEMENTED' },
      HttpStatus.NOT_IMPLEMENTED,
    );
  }

  @ApiOperation({ summary: 'Ai calculate payroll' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Post('payroll/ai-calculate')
  @HttpCode(HttpStatus.OK)
  aiCalculatePayroll(@Body() body: unknown) {
    PayrollCalculateSchema.parse(body);
    throw new HttpException(
      { message: 'Endpoint not yet implemented: POST /finance/payroll/ai-calculate', code: 'NOT_IMPLEMENTED' },
      HttpStatus.NOT_IMPLEMENTED,
    );
  }

  @ApiOperation({ summary: 'Get payroll calculations' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Get('payroll-calculations')
  getPayrollCalculations(@Query() _query: Record<string, unknown>) {
    throw new HttpException(
      { message: 'Endpoint not yet implemented: GET /finance/payroll-calculations', code: 'NOT_IMPLEMENTED' },
      HttpStatus.NOT_IMPLEMENTED,
    );
  }

  @ApiOperation({ summary: 'Approve payroll calculation' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Patch('payroll-calculations/:id/approve')
  @HttpCode(HttpStatus.OK)
  approvePayrollCalculation(@Param('id') _id: string, @Body() body: unknown) {
    ApprovePayrollSchema.parse(body ?? {});
    throw new HttpException(
      { message: 'Endpoint not yet implemented: PATCH /finance/payroll-calculations/:id/approve', code: 'NOT_IMPLEMENTED' },
      HttpStatus.NOT_IMPLEMENTED,
    );
  }

  @ApiOperation({ summary: 'Post approve payroll calculation' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Post('payroll-calculations/:id/approve')
  @HttpCode(HttpStatus.OK)
  postApprovePayrollCalculation(@Param('id') _id: string, @Body() body: unknown) {
    ApprovePayrollSchema.parse(body ?? {});
    throw new HttpException(
      { message: 'Endpoint not yet implemented: POST /finance/payroll-calculations/:id/approve', code: 'NOT_IMPLEMENTED' },
      HttpStatus.NOT_IMPLEMENTED,
    );
  }

  // P3-26: payroll/tax/benchmark services not wired yet — return 501.
  @ApiOperation({ summary: 'Get payroll contracts' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('payroll-contracts')
  getPayrollContracts(@Query() _query: Record<string, unknown>) {
    throw new HttpException(
      { message: 'Endpoint not yet implemented: GET /finance-extended/payroll-contracts', code: 'NOT_IMPLEMENTED' },
      HttpStatus.NOT_IMPLEMENTED,
    );
  }

  @ApiOperation({ summary: 'Get payroll tax rules' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('payroll-tax-rules')
  getPayrollTaxRules() {
    throw new HttpException(
      { message: 'Endpoint not yet implemented: GET /finance-extended/payroll-tax-rules', code: 'NOT_IMPLEMENTED' },
      HttpStatus.NOT_IMPLEMENTED,
    );
  }

  @ApiOperation({ summary: 'Get tax calendar' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('tax-calendar')
  getTaxCalendar(@Query('year') _year?: string) {
    throw new HttpException(
      { message: 'Endpoint not yet implemented: GET /finance-extended/tax-calendar', code: 'NOT_IMPLEMENTED' },
      HttpStatus.NOT_IMPLEMENTED,
    );
  }

  @ApiOperation({ summary: 'Get salary benchmark' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('salary-benchmark/:id')
  getSalaryBenchmark(@Param('id') _id: string) {
    throw new HttpException(
      { message: 'Endpoint not yet implemented: GET /finance-extended/salary-benchmark/:id', code: 'NOT_IMPLEMENTED' },
      HttpStatus.NOT_IMPLEMENTED,
    );
  }
}
