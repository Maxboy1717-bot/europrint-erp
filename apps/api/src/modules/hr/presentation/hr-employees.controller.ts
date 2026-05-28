/**
 * @module hr-employees.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { assertFound } from '@common/assertions';
import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, NotFoundException,
  Param, ParseIntPipe, Patch, Post, Put,
  Query, UseGuards, UseInterceptors, InternalServerErrorException, UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { assertOk, throwFromError, unwrapOrThrow } from '@common/http-result';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
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

@ApiThrottle()
@ApiTags('Hr Employees')
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

  @ApiOperation({ summary: 'Get employees' })
  @ApiResponse({ status: 200, description: 'OK' })
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

  @ApiOperation({ summary: 'Get employee' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id')
  @Roles('HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR')
  async getEmployee(@Param('id') id: string) {
    const result = await this.hrRepo.findEmployeeById(id);
    assertOk(result);
    assertFound(result.data, `Xodim #${id} topilmadi`);
    return result.data;
  }

  @ApiOperation({ summary: 'Get employee kpi' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
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

  @ApiOperation({ summary: 'Create employee' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
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

  @ApiOperation({ summary: 'Update employee' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Put(':id')
  @Roles('HR_MANAGER', 'SUPER_ADMIN')
  @UsePipes(new ZodValidationPipe(HrUpdateEmployeeSchema))
  async updateEmployee(@Param('id') id: string, @Body() body: HrUpdateEmployeeDto) {
    return unwrapOrThrow(await this.hrRepo.updateEmployee(id, body));
  }

  @ApiOperation({ summary: 'Update employee status' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
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

  @ApiOperation({ summary: 'Soft-delete employee (sets status=terminated, deleted_at=now)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('HR_MANAGER', 'SUPER_ADMIN')
  async deleteEmployee(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const existing = await this.hrRepo.findEmployeeById(String(id));
    assertOk(existing);
    if (!existing.data) throw new NotFoundException(`Xodim #${id} topilmadi`);
    const result = await this.hrRepo.updateEmployee(String(id), {
      status:           'terminated',
      employment_status: 'terminated',
      deleted_at:       _time.now().toISOString(),
    });
    assertOk(result);
    return { success: true, message: "Xodim o'chirildi", deletedBy: user?.id ?? null };
  }

  @ApiOperation({ summary: 'Review salary' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post(':employeeId/salary-review')
  @Roles('DIRECTOR', 'SUPER_ADMIN')
  @UsePipes(new ZodValidationPipe(HrReviewSalarySchema))
  async reviewSalary(
    @Param('employeeId') employeeId: string,
    @Body() body: HrReviewSalaryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    // 1. Read current employee to get existing base_salary
    const empResult = await this.hrRepo.findEmployeeById(employeeId);
    assertOk(empResult);
    const emp = empResult.data;

    const currentSalary = emp ? Number(emp['base_salary'] ?? 0) : 0;
    const newSalary      = currentSalary + body.proposedIncrease;
    const today          = _time.now().toISOString().split('T')[0];

    // 2. INSERT into salary_history: record the salary-review entry
    const histResult = await this.hrRepo.savePayroll({
      employeeId:  parseInt(employeeId, 10),
      employee_id: parseInt(employeeId, 10),
      periodStart: today,
      periodEnd:   today,
      baseSalary:  newSalary,
      gross:       newSalary,
      // Carry review metadata in other_bonuses field (0) and notes via reason
      otherBonuses: 0,
      netSalary:    newSalary,
    });
    assertOk(histResult);

    // 3. UPDATE employees.base_salary with the new salary
    const updateResult = await this.hrRepo.updateEmployee(employeeId, { baseSalary: newSalary });
    assertOk(updateResult);

    return {
      message:          "Maosh muvaffaqiyatli yangilandi",
      employeeId,
      previousSalary:   currentSalary,
      newSalary,
      proposedIncrease: body.proposedIncrease,
      reason:           body.reason ?? null,
      reviewedBy:       user?.id ?? null,
      reviewedAt:       _time.now().toISOString(),
    };
  }
}
