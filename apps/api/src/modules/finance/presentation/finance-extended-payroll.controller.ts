/**
 * @module finance-extended-payroll.controller
 * @description Payroll/tax/benchmark stub endpoints split from finance-extended.controller.ts
 * (Rule 16: ≤ 300 lines). All routes currently return HTTP 501 — the real PayrollService
 * INPS/JSHD/IT pipeline isn't wired here yet (see P3-26).
 */

import { Controller, Post, Get, Patch, Body, Param, Query, HttpCode, HttpException, UseGuards, UseInterceptors, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { FINANCE_ROLES, PayrollCalculateSchema, ApprovePayrollSchema } from './finance-extended-dtos';

@ApiThrottle()
@ApiTags('Finance Extended Payroll')
@Controller('finance-extended')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...FINANCE_ROLES)
export class FinanceExtendedPayrollController {
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
