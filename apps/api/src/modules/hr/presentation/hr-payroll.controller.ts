import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import {
  Body, Controller, Get, Inject, InternalServerErrorException, Param, Post, Query,
  UseGuards, UseInterceptors, UsePipes,
} from '@nestjs/common';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { HR_REPO, IHrRepo } from '../domain/repositories/i-hr.repo';

import { MS_PER_DAY } from '@common/constants/app.constants';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { HrCalculatePayrollSchema, HrCalculatePayrollDto } from './dto/hr.dto';
interface AuthenticatedUser { id: number; sub?: number; }

const INPS_EMPLOYEE_RATE = 0.08;
const JSHD_EMPLOYER_RATE = 0.12;

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('hr/payroll')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
export class HrPayrollController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    @Inject(HR_REPO) private readonly hrRepo: IHrRepo,
  ) {}

  @Get()
  @Roles('PAYROLL_OFFICER', 'HR_MANAGER', 'DIRECTOR', 'SUPER_ADMIN')
  async getPayrolls(@Query() query: { employeeId?: string; period?: string; status?: string }) {
    const result = await this.hrRepo.findPayroll({
      employeeId: query.employeeId,
      period:     query.period,
      status:     query.status,
    });
    assertOk(result);
    return result.data;
  }

  @Get('summary/:period')
  @Roles('PAYROLL_OFFICER', 'DIRECTOR', 'SUPER_ADMIN')
  async getPayrollSummary(@Param('period') period: string) {
    return unwrapOrThrow(await this.hrRepo.getPayrollSummary(period));
  }

  @Post('calculate')
  @Roles('PAYROLL_OFFICER', 'HR_MANAGER', 'SUPER_ADMIN')
  @UsePipes(new ZodValidationPipe(HrCalculatePayrollSchema))
  async calculatePayroll(
    @Body() body: HrCalculatePayrollDto,
    @CurrentUser() _user: AuthenticatedUser,
  ) {
    const period       = body.period ?? _time.now().toISOString().slice(0, 7);
    const overtimeRate = body.overtimeRate ?? 1.5;
    const dailyRate    = body.baseSalary / 22;
    const overtimePay  = (body.overtimeHours ?? 0) * (dailyRate / 8) * overtimeRate;
    const grossSalary  = body.baseSalary + overtimePay + (body.bonus ?? 0);
    const inpsEmployee = grossSalary * INPS_EMPLOYEE_RATE;
    const jshdEmployer = grossSalary * JSHD_EMPLOYER_RATE;
    const netSalary    = grossSalary - inpsEmployee - (body.otherDeductions ?? 0);

    const result = await this.hrRepo.savePayroll({
      employeeId:    body.employeeId,
      periodStart:   new Date(`${period}-01`),
      periodEnd:     new Date(new Date(`${period}-01`).setMonth(new Date(`${period}-01`).getMonth() + 1) - MS_PER_DAY),
      baseSalary:    body.baseSalary,
      netSalary,
      bonus:         body.bonus ?? 0,
      otherDeductions: body.otherDeductions ?? 0,
    });
    assertOk(result);
    return { ...result.data, grossSalary, netSalary, inpsEmployee, jshdEmployer, period };
  }

  @Post(':payrollId/approve')
  @Roles('DIRECTOR', 'SUPER_ADMIN')
  async approvePayroll(@Param('payrollId') payrollId: string, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.hrRepo.updatePayroll(payrollId, {
      status:     'approved',
      approvedBy: user?.sub ?? user?.id,
    } as Record<string, unknown>);
    assertOk(result);
    return { message: 'Oylik maosh tasdiqlandi', ...result.data };
  }

  @Post(':payrollId/post-to-gl')
  @Roles('DIRECTOR', 'SUPER_ADMIN')
  async postToGL(@Param('payrollId') payrollId: string, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.hrRepo.updatePayroll(payrollId, {
      status:   'paid',
      postedBy: user?.sub ?? user?.id,
    } as Record<string, unknown>);
    assertOk(result);
    return { message: "Oylik maosh buxgalteriyaga o'tkazildi", ...result.data };
  }
}
