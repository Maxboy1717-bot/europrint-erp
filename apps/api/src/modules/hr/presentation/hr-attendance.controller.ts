/**
 * @module hr-attendance.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import {
  Body, Controller, Get, Inject, InternalServerErrorException, Param, Post, Query,
  UseGuards, UseInterceptors, UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { throwFromError, assertOk } from '@common/http-result';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { HR_REPO, IHrRepo } from '../domain/repositories/i-hr.repo';
import { HrAttendanceService } from '../application/hr-attendance.service';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { HrCheckInSchema, HrCheckInDto, HrCheckOutSchema, HrCheckOutDto } from './dto/hr.dto';

@ApiThrottle()
@ApiTags('Hr Attendance')
@Controller('hr/attendance')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
export class HrAttendanceController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    @Inject(HR_REPO) private readonly hrRepo: IHrRepo,
    private readonly attendanceSvc: HrAttendanceService,
  ) {}

  @ApiOperation({ summary: 'Get today attendance' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('today')
  @Roles('HR_SPECIALIST', 'HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  async getTodayAttendance() {
    const data = await this.attendanceSvc.getTodayAll();
    return { data };
  }

  @ApiOperation({ summary: 'Get attendance' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  @Roles('HR_SPECIALIST', 'HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  getAttendance(@Query() query: { employeeId?: string; period?: string }) {
    const period = query.period ?? _time.now().toISOString().slice(0, 7);
    return query.employeeId
      ? this.hrRepo.findAttendance(query.employeeId, period).then(r => {
          assertOk(r);
          return r.data;
        })
      : this.attendanceSvc.getTodayAll().then(d => ({ data: d }));
  }

  @ApiOperation({ summary: 'Get attendance summary' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get(':employeeId/summary/:period')
  @Roles('HR_SPECIALIST', 'HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  async getAttendanceSummary(
    @Param('employeeId') employeeId: string,
    @Param('period') period: string,
  ) {
    const [result, stats] = await Promise.all([
      this.hrRepo.findAttendance(employeeId, period),
      this.hrRepo.getAttendanceStats(employeeId, period),
    ]);
    return { data: {
      records:    result.ok ? result.data : [],
      summary:    (stats as { data?: unknown })?.data ?? {},
      employeeId,
      period,
    }};
  }

  @ApiOperation({ summary: 'Check in' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('check-in')
  @Roles('HR_SPECIALIST', 'HR_MANAGER', 'SUPER_ADMIN')
  @UsePipes(new ZodValidationPipe(HrCheckInSchema))
  async checkIn(@Body() body: HrCheckInDto) {
    const result = await this.hrRepo.saveAttendance({
      employeeId:     body.employeeId,
      attendanceDate: body.attendanceDate ?? _time.now().toISOString().split('T')[0],
      checkInTime:    body.checkInTime ? new Date(body.checkInTime) : _time.now(),
      status:         'present',
      source:         body.source ?? 'manual',
      createdAt:      _time.now(),
      updatedAt:      _time.now(),
    });
    assertOk(result);
    return { message: 'Kirish qayd etildi', ...result.data };
  }

  @ApiOperation({ summary: 'Check out' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('check-out')
  @Roles('HR_SPECIALIST', 'HR_MANAGER', 'SUPER_ADMIN')
  @UsePipes(new ZodValidationPipe(HrCheckOutSchema))
  async checkOut(@Body() body: HrCheckOutDto) {
    const result = await this.hrRepo.saveAttendance({
      employeeId:      body.employeeId,
      attendanceDate:  _time.now().toISOString().split('T')[0],
      checkOutTime:    body.checkOutTime ? new Date(body.checkOutTime) : _time.now(),
      overtimeMinutes: body.overtimeMinutes ?? 0,
      status:          'present',
      source:          'manual',
      updatedAt:       _time.now(),
    });
    assertOk(result);
    return { message: 'Chiqish qayd etildi', ...result.data };
  }
}
