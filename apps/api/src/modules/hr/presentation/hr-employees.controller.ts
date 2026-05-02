import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { assertFound } from '@common/assertions';
import {
  Body, Controller, Get, Inject, NotFoundException, Param, Patch, Post, Put,
  Query, UseGuards, UseInterceptors, InternalServerErrorException, UsePipes,
} from '@nestjs/common';
import { assertOk, throwFromError, unwrapOrThrow } from '@common/http-result';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { HR_REPO, IHrRepo } from '../domain/repositories/i-hr.repo';
import { GetEmployeesQuery } from '../application/queries/get-employees.query';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {
  HrCreateEmployeeSchema, HrCreateEmployeeDto,
  HrUpdateEmployeeSchema, HrUpdateEmployeeDto,
  HrUpdateEmployeeStatusSchema, HrUpdateEmployeeStatusDto,
  HrReviewSalarySchema, HrReviewSalaryDto,
} from './dto/hr.dto';

interface AuthenticatedUser { id: number; role: string; }

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('hr/employees')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles('HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR')
export class HrEmployeesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    @Inject(HR_REPO) private readonly hrRepo: IHrRepo,
  ) {}

  @Get()
  @Roles('HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR')
  async getEmployees(@Query() query: { status?: string; department?: string; search?: string; page?: string; limit?: string }) {
    const res = await this.queryBus.execute(
      new GetEmployeesQuery({
        department: query.department,
        status:     query.status,
        page:       parseInt(query.page ?? '1', 10),
        limit:      parseInt(query.limit ?? '20', 10),
      }),
    );
    return unwrapOrThrow(res);
  }

  @Get(':id')
  @Roles('HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR')
  async getEmployee(@Param('id') id: string) {
    const result = await this.hrRepo.findEmployeeById(id);
    assertOk(result);
    assertFound(result.data, `Xodim #${id} topilmadi`);
    return result.data;
  }

  @Get(':employeeId/kpi')
  @Roles('HR_SPECIALIST', 'HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  async getEmployeeKpi(@Param('employeeId') employeeId: string) {
    const period = _time.now().toISOString().slice(0, 7);
    const [attendanceResult, leaveBalance] = await Promise.all([
      this.hrRepo.getAttendanceStats(employeeId, period),
      this.hrRepo.getLeaveBalance(employeeId),
    ]);
    return {
      employeeId,
      period,
      attendance:   attendanceResult?.ok ? (attendanceResult).data : {},
      leaveBalance: leaveBalance.ok ? leaveBalance.data : null,
    };
  }

  @Post()
  @Roles('HR_MANAGER', 'SUPER_ADMIN')
  @UsePipes(new ZodValidationPipe(HrCreateEmployeeSchema))
  async createEmployee(@Body() body: HrCreateEmployeeDto, @CurrentUser() _user: AuthenticatedUser) {
    const result = await this.hrRepo.saveEmployee({
      ...body,
      employeeCode: body.employeeCode ?? `EMP-${Date.now()}`,
      createdAt:    _time.now(),
      updatedAt:    _time.now(),
    });
    assertOk(result);
    return result.data;
  }

  @Put(':id')
  @Roles('HR_MANAGER', 'SUPER_ADMIN')
  @UsePipes(new ZodValidationPipe(HrUpdateEmployeeSchema))
  async updateEmployee(@Param('id') id: string, @Body() body: HrUpdateEmployeeDto) {
    return unwrapOrThrow(await this.hrRepo.updateEmployee(id, body));
  }

  @Patch(':id/status')
  @Roles('HR_MANAGER', 'DIRECTOR', 'SUPER_ADMIN')
  @UsePipes(new ZodValidationPipe(HrUpdateEmployeeStatusSchema))
  async updateEmployeeStatus(
    @Param('id') id: string,
    @Body() body: HrUpdateEmployeeStatusDto,
  ) {
    const result = await this.hrRepo.updateEmployee(id, { status: body.status, employmentStatus: body.status });
    assertOk(result);
    return { message: `Xodim holati ${body.status} ga o'zgartirildi`, data: result.data };
  }

  @Post(':employeeId/salary-review')
  @Roles('DIRECTOR', 'SUPER_ADMIN')
  @UsePipes(new ZodValidationPipe(HrReviewSalarySchema))
  reviewSalary(
    @Param('employeeId') employeeId: string,
    @Body() body: HrReviewSalaryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return {
      message:          "Maosh ko'rib chiqish yozildi",
      employeeId,
      proposedIncrease: body.proposedIncrease,
      reviewedBy:       user?.id,
      reviewedAt:       _time.now().toISOString(),
    };
  }
}
