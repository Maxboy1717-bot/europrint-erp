/**
 * @module payroll-periods.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, Post, Body, Param, Query, ParseIntPipe, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { PayrollService } from '../payroll/payroll.service';
import { CalculateTaxSchema, CreatePayrollPeriodSchema } from './dto/finance-dtos';
import { unwrapOrInternal } from '@common/http-result';

const PAYROLL_ROLES = ['FINANCE_MANAGER', 'HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR', 'admin'];

@ApiThrottle()
@ApiTags('Payroll Periods')
@Controller('payroll')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...PAYROLL_ROLES)
export class PayrollPeriodsController {
  constructor(private readonly svc: PayrollService) {}

  @ApiOperation({ summary: 'Get periods' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('periods')
  async getPeriods(@Query() query: Record<string, unknown>) {
    return unwrapOrInternal(await this.svc.findAll(query));
  }

  @ApiOperation({ summary: 'Create period' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('periods')
  async createPeriod(@Body() body: unknown) {
    const dto = CreatePayrollPeriodSchema.parse(body);
    return unwrapOrInternal(await this.svc.create(dto as Record<string, unknown>));
  }

  @ApiOperation({ summary: 'Calculate period' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('periods/:id/calculate')
  async calculatePeriod(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.svc.calculatePeriod(id));
  }

  @ApiOperation({ summary: 'Close period' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('periods/:id/close')
  async closePeriod(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.svc.close(id));
  }

  @ApiOperation({ summary: 'Calculate tax' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('calculate-tax')
  calculateTax(@Body() body: unknown) {
    const dto = CalculateTaxSchema.parse(body);
    const { grossSalary } = dto;
    const TAX_RATE = 12;
    const PENSION_RATE = 8;
    const incomeTax = parseFloat(((grossSalary * TAX_RATE) / 100).toFixed(2));
    const pensionDeduction = parseFloat(((grossSalary * PENSION_RATE) / 100).toFixed(2));
    const netSalary = parseFloat((grossSalary - incomeTax - pensionDeduction).toFixed(2));
    return { grossSalary, incomeTax, pensionDeduction, netSalary, taxRate: TAX_RATE, pensionRate: PENSION_RATE };
  }
}
