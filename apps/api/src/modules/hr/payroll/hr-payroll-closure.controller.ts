import {
  Controller, Post, Param, ParseIntPipe,
  UseGuards, UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Throttle } from '@nestjs/throttler';
import { unwrapOrInternal } from '@common/http-result';
import { PayrollService } from './payroll.service';

const PAYROLL_CLOSE_ROLES = ['SUPER_ADMIN', 'DIRECTOR', 'PAYROLL_OFFICER', 'HR_MANAGER', 'admin'] as const;

@Throttle({ default: { limit: 30, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...PAYROLL_CLOSE_ROLES)
@Controller('hr/payroll/closure')
export class HrPayrollClosureController {
  constructor(private readonly svc: PayrollService) {}

  @Post('periods/:id/close')
  async closePeriod(@Param('id', ParseIntPipe) id: number) {
    const r = await this.svc.closePeriod(id);
    return { data: unwrapOrInternal(r) };
  }
}
