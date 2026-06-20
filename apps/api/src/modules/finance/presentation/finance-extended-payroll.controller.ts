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
import { FINANCE_ROLES, PayrollCalculateSchema, PayrollAiCalculateSchema, ApprovePayrollSchema, PayrollRunSchema, PayrollCreateContractSchema } from './finance-extended-dtos';
import { notImplemented } from '@common/exceptions/not-implemented';
import { unwrapOrInternal } from '@common/http-result';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { FinanceExtendedPayrollService } from '../finance-extended/finance-extended-payroll.service';

type Rows = { rows?: unknown[] };

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

  @ApiOperation({ summary: 'Create payroll contract' })
  @ApiResponse({ status: 201, description: 'Created' })
  @Post('payroll-contracts')
  @HttpCode(201)
  async createPayrollContract(@Body() body: unknown) {
    const dto = PayrollCreateContractSchema.parse(body);
    return unwrapOrInternal(await this.svc.createContract(dto));
  }

  @ApiOperation({ summary: 'Get tax calendar (payroll_tax_rules with validity dates)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('tax-calendar')
  async getTaxCalendar(@Query('year') year?: string) {
    const r = await db.execute(sql`
      SELECT * FROM payroll_tax_rules
      WHERE is_active = true
      ${year ? sql`AND (effective_from ILIKE ${year + '%'} OR effective_to IS NULL OR effective_to ILIKE ${year + '%'})` : sql``}
      ORDER BY effective_from DESC
    `);
    const items = ((r as Rows).rows) ?? [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Get salary benchmark for position (salary_bands)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('salary-benchmark/:id')
  async getSalaryBenchmark(@Param('id') id: string) {
    const positionId = parseInt(id, 10);
    const r = await db.execute(sql`
      SELECT * FROM salary_bands
      WHERE position_id = ${positionId} AND is_active = true
      ORDER BY effective_from DESC
    `);
    const items = ((r as Rows).rows) ?? [];
    return { positionId, items, total: items.length };
  }
}
