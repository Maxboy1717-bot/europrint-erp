/**
 * @module finance-payroll.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, Query, Logger, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { FinancePayrollService } from '../application/finance-payroll.service';
import { unwrapOrInternal } from '@common/http-result';


@Roles('admin', 'director', 'hr_manager', 'accountant', 'FINANCE_MANAGER', 'SUPER_ADMIN')
@ApiThrottle()
@ApiTags('Finance Payroll')
@Controller('payroll')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
export class FinancePayrollController {
  private readonly logger = new Logger(FinancePayrollController.name);

  constructor(private readonly svc: FinancePayrollService) {}

  @ApiOperation({ summary: 'By department' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('by-department')
  async byDepartment(@Query('periodId') periodId?: string) {
    return unwrapOrInternal(await this.svc.byDepartment(periodId));
  }

  @ApiOperation({ summary: 'By brigade' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('by-brigade')
  async byBrigade(@Query('periodId') periodId?: string) {
    return unwrapOrInternal(await this.svc.byBrigade(periodId));
  }

  @ApiOperation({ summary: 'Tax summary' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('tax-summary')
  async taxSummary(@Query('periodId') periodId?: string) {
    return unwrapOrInternal(await this.svc.taxSummary(periodId));
  }
}
