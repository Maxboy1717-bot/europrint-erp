/**
 * @module finance-extended-payroll.controller
 * @description Payroll/tax/benchmark stub endpoints split from finance-extended.controller.ts
 * (Rule 16: в‰¤ 300 lines). All routes currently return HTTP 501 - the real PayrollService
 * INPS/JSHD/IT pipeline isn't wired here yet (see P3-26).
 *
 * FEATURE_FLAGGED: Wave 12 work to wire PayrollService. Tracking #FX-1.
 */

import { Controller, Post, Get, Patch, Body, Param, Query, HttpCode, HttpException, UseGuards, UseInterceptors, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { FINANCE_ROLES, PayrollCalculateSchema, ApprovePayrollSchema } from './finance-extended-dtos';
import { notImplemented } from '@common/exceptions/not-implemented';

@ApiThrottle()
@ApiTags('Finance Extended Payroll')
@Controller('finance-extended')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...FINANCE_ROLES)
export class FinanceExtendedPayrollController {
  @ApiOperation({ summary: 'Calculate payroll' })
  @ApiResponse({ status: 501, description: 'Feature gated off - tracking #FX-1' })
  @Post('payroll/calculate')
  @HttpCode(HttpStatus.OK)
  calculatePayroll(@Body() body: unknown) {
    PayrollCalculateSchema.parse(body);
    return notImplemented('POST /finance-extended/payroll/calculate');
  }

  @ApiOperation({ summary: 'AI calculate payroll' })
  @ApiResponse({ status: 501, description: 'Feature gated off - tracking #FX-1' })
  @Post('payroll/ai-calculate')
  @HttpCode(HttpStatus.OK)
  aiCalculatePayroll(@Body() body: unknown) {
    PayrollCalculateSchema.parse(body);
    return notImplemented('POST /finance-extended/payroll/ai-calculate');
  }

  @ApiOperation({ summary: 'Get payroll calculations' })
  @ApiResponse({ status: 501, description: 'Feature gated off - tracking #FX-1' })
  @Get('payroll-calculations')
  getPayrollCalculations(@Query() _query: Record<string, unknown>) {
    return notImplemented('GET /finance-extended/payroll-calculations');
  }

  @ApiOperation({ summary: 'Approve payroll calculation' })
  @ApiResponse({ status: 501, description: 'Feature gated off - tracking #FX-1' })
  @Patch('payroll-calculations/:id/approve')
  @HttpCode(HttpStatus.OK)
  approvePayrollCalculation(@Param('id') _id: string, @Body() body: unknown) {
    ApprovePayrollSchema.parse(body ?? {});
    return notImplemented('PATCH /finance-extended/payroll-calculations/:id/approve');
  }

  @ApiOperation({ summary: 'Approve payroll calculation (POST mirror)' })
  @ApiResponse({ status: 501, description: 'Feature gated off - tracking #FX-1' })
  @Post('payroll-calculations/:id/approve')
  @HttpCode(HttpStatus.OK)
  postApprovePayrollCalculation(@Param('id') _id: string, @Body() body: unknown) {
    ApprovePayrollSchema.parse(body ?? {});
    return notImplemented('POST /finance-extended/payroll-calculations/:id/approve');
  }

  @ApiOperation({ summary: 'Get payroll contracts' })
  @ApiResponse({ status: 501, description: 'Feature gated off - tracking #FX-1' })
  @Get('payroll-contracts')
  getPayrollContracts(@Query() _query: Record<string, unknown>) {
    return notImplemented('GET /finance-extended/payroll-contracts');
  }

  @ApiOperation({ summary: 'Get payroll tax rules' })
  @ApiResponse({ status: 501, description: 'Feature gated off - tracking #FX-1' })
  @Get('payroll-tax-rules')
  getPayrollTaxRules() {
    return notImplemented('GET /finance-extended/payroll-tax-rules');
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
