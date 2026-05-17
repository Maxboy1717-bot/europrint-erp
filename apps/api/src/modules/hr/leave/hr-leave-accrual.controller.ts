import {
  Controller, Post, Body,
  UseGuards, UseInterceptors, UsePipes,
} from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { Throttle } from '@nestjs/throttler';
import { unwrapOrInternal } from '@common/http-result';
import { LeaveAccrualJobService } from './leave-accrual-job.service';

const RunAccrualSchema = z.object({
  year:  z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
});
type RunAccrualDto = z.infer<typeof RunAccrualSchema>;

const ACCRUAL_ROLES = ['SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER', 'PAYROLL_OFFICER', 'admin'] as const;

@Throttle({ default: { limit: 10, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...ACCRUAL_ROLES)
@Controller('hr/leave/accrual')
export class HrLeaveAccrualController {
  constructor(private readonly job: LeaveAccrualJobService) {}

  @Post('run')
  @UsePipes(new ZodValidationPipe(RunAccrualSchema))
  async run(@Body() body: RunAccrualDto) {
    const r = await this.job.runForMonth(body.year, body.month);
    return { data: unwrapOrInternal(r) };
  }
}
