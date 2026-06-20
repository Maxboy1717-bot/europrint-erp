/**
 * @module hr-payroll.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import {
  BadRequestException,
  Body, Controller, Get, Inject, InternalServerErrorException, Param, Post, Query,
  UseGuards, UseInterceptors, UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { HR_REPO, IHrRepo } from '../domain/repositories/i-hr.repo';
import {
  findUserIdByEmployee,
  hasAnyOrgAssignment,
} from '../../compatibility/employees-org-assignment.helper';

import { MS_PER_DAY } from '@common/constants/app.constants';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { HrCalculatePayrollSchema, HrCalculatePayrollDto } from './dto/hr.dto';
interface AuthenticatedUser { id: number; sub?: number; }


@ApiThrottle()
@ApiTags('Hr Payroll')
@Controller('hr/payroll')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
export class HrPayrollController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    @Inject(HR_REPO) private readonly hrRepo: IHrRepo,
  ) {}

  @ApiOperation({ summary: 'Get payrolls' })
  @ApiResponse({ status: 200, description: 'OK' })
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

  @ApiOperation({ summary: 'Get payroll summary' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('summary/:period')
  @Roles('PAYROLL_OFFICER', 'DIRECTOR', 'SUPER_ADMIN')
  async getPayrollSummary(@Param('period') period: string) {
    return unwrapOrThrow(await this.hrRepo.getPayrollSummary(period));
  }

  @ApiOperation({ summary: 'Calculate payroll' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('calculate')
  @Roles('PAYROLL_OFFICER', 'HR_MANAGER', 'SUPER_ADMIN')
  @UsePipes(new ZodValidationPipe(HrCalculatePayrollSchema))
  async calculatePayroll(
    @Body() body: HrCalculatePayrollDto,
    @CurrentUser() _user: AuthenticatedUser,
  ) {
    // Biznes qoida: oylik kiritishdan oldin xodim org-structure'da biriktirilgan bo'lishi shart.
    const userId = await findUserIdByEmployee(body.employeeId);
    if (userId === null) {
      throw new BadRequestException(
        `Xodim ID=${body.employeeId} uchun user yaratilmagan — oylik kiritilmaydi`,
      );
    }
    const isAssigned = await hasAnyOrgAssignment(userId);
    if (!isAssigned) {
      throw new BadRequestException(
        `Xodim ID=${body.employeeId} tashkiliy tuzilmaga biriktirilmagan — ` +
        `oylik kiritilmaydi. Avval xodim org-structure'da bo'limga assign qilinishi kerak.`,
      );
    }

    const period         = body.period ?? _time.now().toISOString().slice(0, 7);
    const overtimeRate   = body.overtimeRate ?? 1.5;
    // Razryad koeffitsienti: employees.org_function_id → org_functions.razryad_level_id → coefficient
    // 1-razryad=1.00, 2=1.25, 3=1.55, 4=1.90, 5=2.30, 6=2.80 (seed-02-razryad.sql)
    const razryadCoeff   = await this.hrRepo.getRazryadCoefficient(body.employeeId);
    const effectiveSalary = body.baseSalary * razryadCoeff;
    const dailyRate      = effectiveSalary / 22;
    const overtimePay    = (body.overtimeHours ?? 0) * (dailyRate / 8) * overtimeRate;
    const grossSalary    = effectiveSalary + overtimePay + (body.bonus ?? 0);
    // ERP is gross-only: net = gross − NON-TAX deductions. Tax (INPS/JSHD) is computed in 1C.
    const netSalary      = grossSalary - (body.otherDeductions ?? 0);

    const result = await this.hrRepo.savePayroll({
      employeeId:    body.employeeId,
      periodStart:   new Date(`${period}-01`),
      periodEnd:     new Date(new Date(`${period}-01`).setMonth(new Date(`${period}-01`).getMonth() + 1) - MS_PER_DAY),
      baseSalary:    effectiveSalary,
      netSalary,
      bonus:         body.bonus ?? 0,
      otherDeductions: body.otherDeductions ?? 0,
    });
    assertOk(result);
    return { ...result.data, grossSalary, netSalary, period, razryadCoefficient: razryadCoeff };
  }

  @ApiOperation({ summary: 'Approve payroll' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
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

  @ApiOperation({ summary: 'Post to g l' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post(':payrollId/post-to-gl')
  @Roles('DIRECTOR', 'SUPER_ADMIN')
  async postToGL(@Param('payrollId') payrollId: string, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.hrRepo.updatePayroll(payrollId, {
      status:   'paid',
      postedBy: user?.sub ?? user?.id,
      paidDate: new Date().toISOString().split('T')[0],
    } as Record<string, unknown>);
    assertOk(result);
    return { message: "Oylik maosh buxgalteriyaga o'tkazildi", ...result.data };
  }
}
