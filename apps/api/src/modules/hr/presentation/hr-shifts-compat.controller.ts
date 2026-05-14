/**
 * @module hr-shifts-compat.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards, UseInterceptors, UsePipes } from '@nestjs/common';
import { assertOk, throwFromError, unwrapOrInternal, unwrapOrThrow } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ShiftService } from '../shift/shift.service';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {
  HrCreateScheduleSchema, HrCreateScheduleDto,
  HrCreateSwapRequestSchema, HrCreateSwapRequestDto,
} from './dto/hr.dto';
import { z } from 'zod';

const HrApproveSwapSchema = z.object({ notes: z.string().optional() });

const SHIFT_TIMES: Record<string, { start: string; end: string }> = {
  MORNING: { start: '08:00', end: '17:00' },
  EVENING: { start: '17:00', end: '02:00' },
  NIGHT:   { start: '22:00', end: '07:00' },
  day:     { start: '08:00', end: '17:00' },
};

@Throttle({ default: { limit: 120, ttl: 60_000 } })
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'HR_SPECIALIST', 'MANAGER', 'DIRECTOR')
@Controller('hr')
export class HrShiftsCompatController {
  constructor(private readonly shiftService: ShiftService) {}

  @Get('shifts/schedule')
  async getSchedule(
    @Query('weekStart') weekStart: string,
    @Query('week_start') weekStartSnake: string,
    @Query('departmentId') departmentId: string,
    @Query('department_id') departmentIdSnake: string,
    @Query('employee_id') employeeId: string,
  ) {
    const ws   = weekStart || weekStartSnake;
    const dept = departmentId || departmentIdSnake;
    return unwrapOrInternal(await this.shiftService.getSchedule({
      weekStart:    ws || undefined,
      departmentId: dept ? parseInt(dept, 10) : undefined,
      employeeId:   employeeId ? parseInt(employeeId, 10) : undefined,
    }));
  }

  @Post('shifts/schedule')
  @UsePipes(new ZodValidationPipe(HrCreateScheduleSchema))
  async createSchedule(
    @Body() body: HrCreateScheduleDto,
  ) {
    const times = SHIFT_TIMES[body.shift_type ?? 'day'] ?? SHIFT_TIMES['day'];
    const userLookup = (!body.employee_id && body.user_id)
      ? await this.shiftService.findEmployeeByUserId(body.user_id)
      : null;
    const empId = body.employee_id
      ? Number(body.employee_id)
      : userLookup?.ok ? (userLookup.data as number) : 0;
    const _rAssignShift = await this.shiftService.assignShift({
      employeeId: Number(empId ?? 0),
      shiftDate:  body.shift_date,
      shiftType:  body.shift_type ?? 'MORNING',
      startTime:  body.start_time ?? times.start,
      endTime:    body.end_time ?? times.end,
      notes:      body.notes,
    });
    assertOk(_rAssignShift);
    return _rAssignShift.data;
  }

  @Get('shifts/swap-requests')
  async getSwapRequests() {
    return unwrapOrThrow(await this.shiftService.getSwapRequests());
  }

  @Post('shifts/swap-request')
  @UsePipes(new ZodValidationPipe(HrCreateSwapRequestSchema))
  async createSwapRequest(
    @Body() body: HrCreateSwapRequestDto,
  ) {
    const shiftLookup = (!body.from_shift_id && body.from_employee_id && body.shift_date)
      ? await this.shiftService.findShiftByEmployeeAndDate(Number(body.from_employee_id), body.shift_date)
      : null;
    const fromShiftId = body.from_shift_id
      ?? (shiftLookup?.ok ? (shiftLookup.data as number) : undefined);
    return fromShiftId
      ? this.shiftService.requestSwap({
          fromEmployeeId: Number(body.from_employee_id ?? 0),
          toEmployeeId:   Number(body.to_employee_id ?? 0),
          fromShiftId,
          reason:         body.reason,
        }).then(r => unwrapOrThrow(r))
      : { ok: false, message: 'Shift topilmadi' };
  }

  @Patch('shifts/swap-request/:id/approve')
  @UsePipes(new ZodValidationPipe(HrApproveSwapSchema))
  async approveSwapRequest(@Param('id', ParseIntPipe) id: number, @Body() _body: { notes?: string }) {
    return unwrapOrThrow(await this.shiftService.approveSwap(id));
  }

  @Delete('shifts/:id')
  async deleteShift(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrThrow(await this.shiftService.deleteShift(id));
  }
}
