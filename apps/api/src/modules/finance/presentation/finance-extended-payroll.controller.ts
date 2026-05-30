/**
 * @module finance-extended-payroll.controller
 * @description Payroll endpoints split from finance-extended.controller.ts (Rule 16: ≤ 300 lines).
 * The payroll calculate/ai-calculate/run/list/approve routes delegate to
 * FinanceExtendedPayrollService, which runs real INPS/JSHD/min-wage math against the
 * canonical payroll_* tables (#FX-1, resolved). `tax-calendar` and `salary-benchmark`
 * remain HTTP 501 placeholders — no source data table exists for them yet.
 */

import { Controller, Post, Get, Patch, Body, Param, Query, HttpCode, HttpException, UseGuards, UseInterceptors, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { FINANCE_ROLES, PayrollCalculateSchema, PayrollAiCalculateSchema, ApprovePayrollSchema, PayrollRunSchema } from './finance-extended-dtos';
import { notImplemented } from '@common/exceptions/not-implemented';
import { unwrapOrInternal } from '@common/http-result';
import { FinanceExtendedPayrollService } from '../finance-extended/finance-extended-payroll.service';

@ApiThrottle()
@ApiTags('Finance Extended Payroll')
@Controller('finance-extended')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...FINANCE_ROLES)
export class FinanceExtendedPayrollController {
  constructor(private readonly svc: FinanceExtendedPayrollService) {}

  @ApiOperation({ summary: 'Calculate payroll' })
  @ApiResponse({ status: 200, description: 'Persisted payroll calculation' })
  @Post('payroll/calculate')
  @HttpCode(HttpStatus.OK)
  async calculatePayroll(@Body() body: unknown) {
    const dto = PayrollCalculateSchema.parse(body);
    return unwrapOrInternal(await this.svc.calculate(dto));
  }

  @ApiOperation({ summary: 'AI calculate payroll' })
  @ApiResponse({ status: 200, description: 'Contract-based AI estimate (persisted)' })
  @Post('payroll/ai-calculate')
  @HttpCode(HttpStatus.OK)
  async aiCalculatePayroll(@Body() body: unknown) {
    const dto = PayrollAiCalculateSchema.parse(body);
    return unwrapOrInternal(await this.svc.aiCalculate(dto));
  }

  @ApiOperation({ summary: 'Run payroll for all active contracts in a period' })
  @ApiResponse({ status: 200, description: 'Batch run summary' })
  @Post('payroll/run')
  @HttpCode(HttpStatus.OK)
  async runPayroll(@Body() body: unknown) {
    const dto = PayrollRunSchema.parse(body);
    return unwrapOrInternal(await this.svc.runPayroll(dto.period));
  }

  @ApiOperation({ summary: 'Get payroll calculations' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('payroll-calculations')
  async getPayrollCalculations(@Query() _query: Record<string, unknown>) {
    return unwrapOrInternal(await this.svc.listCalculations());
  }

  @ApiOperation({ summary: 'Approve payroll calculation' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Patch('payroll-calculations/:id/approve')
  @HttpCode(HttpStatus.OK)
  async approvePayrollCalculation(@Param('id') id: string, @Body() body: unknown) {
    const dto = ApprovePayrollSchema.parse(body ?? {});
    return unwrapOrInternal(await this.svc.approveCalculation(id, dto.approvedBy));
  }

  @ApiOperation({ summary: 'Approve payroll calculation (POST mirror)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Post('payroll-calculations/:id/approve')
  @HttpCode(HttpStatus.OK)
  async postApprovePayrollCalculation(@Param('id') id: string, @Body() body: unknown) {
    const dto = ApprovePayrollSchema.parse(body ?? {});
    return unwrapOrInternal(await this.svc.approveCalculation(id, dto.approvedBy));
  }

  @ApiOperation({ summary: 'Get payroll contracts' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('payroll-contracts')
  async getPayrollContracts(@Query() _query: Record<string, unknown>) {
    return unwrapOrInternal(await this.svc.listContracts());
  }


  @ApiOperation({ summary: 'Get tax calendar' })
  @ApiResponse({ status: 501, description: 'Feature gated off - tracking #FX-1' })
  @Get('tax-calendar')
  getTaxCalendar(@Query('year') _year?: string) {
    return notImplemented('GET /finance-extended/tax-calendar');
  }

  @ApiOperation({ summary: 'Get salary benchmark' })
  @ApiResponse({ status: 501, description: 'Feature gated off - tracking #FX-1' })
  @Get('salary-benchmark/:id')
  getSalaryBenchmark(@Param('id') _id: string) {
    return notImplemented('GET /finance-extended/salary-benchmark/:id');
  }
}
