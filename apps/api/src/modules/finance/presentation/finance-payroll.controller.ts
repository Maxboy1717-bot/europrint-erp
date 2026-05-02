import { Controller, Get, Query, Logger, UseGuards, UseInterceptors } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { FinancePayrollService } from '../application/finance-payroll.service';
import { unwrapOrInternal } from '@common/http-result';


@Roles('admin', 'director', 'hr_manager', 'accountant', 'FINANCE_MANAGER', 'SUPER_ADMIN')
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('payroll')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
export class FinancePayrollController {
  private readonly logger = new Logger(FinancePayrollController.name);

  constructor(private readonly svc: FinancePayrollService) {}

  @Get('by-department')
  async byDepartment(@Query('periodId') periodId?: string) {
    return unwrapOrInternal(await this.svc.byDepartment(periodId));
  }

  @Get('by-brigade')
  async byBrigade(@Query('periodId') periodId?: string) {
    return unwrapOrInternal(await this.svc.byBrigade(periodId));
  }

  @Get('tax-summary')
  async taxSummary(@Query('periodId') periodId?: string) {
    return unwrapOrInternal(await this.svc.taxSummary(periodId));
  }
}
