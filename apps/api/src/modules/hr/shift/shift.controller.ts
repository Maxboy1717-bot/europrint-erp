/**
 * @module shift.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import {
  Controller, UseGuards, Get, Post, Patch, Delete, HttpCode, HttpStatus,
  Body, Param, ParseIntPipe, Query, Logger, UseInterceptors, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { ShiftService } from './shift.service';
import { Roles } from '../../../common/decorators/roles.decorator';
import { unwrapOrInternal } from '@common/http-result';

const AssignShiftSchema = z.object({
  employee_id: z.number().int().optional(),
  user_id:     z.string().optional(),
  shift_date:  z.string().min(1),
  shift_type:  z.string().optional(),
  start_time:  z.string().optional(),
  end_time:    z.string().optional(),
  notes:       z.string().optional(),
});
class AssignShiftDto extends createZodDto(AssignShiftSchema) {}

const RequestSwapSchema = z.object({
  from_employee_id: z.union([z.number().int(), z.string()]).optional(),
  to_employee_id:   z.union([z.number().int(), z.string()]).optional(),
  from_shift_id:    z.number().int().optional(),
  shift_date:       z.string().optional(),
  reason:           z.string().min(1),
});
class RequestSwapDto extends createZodDto(RequestSwapSchema) {}

const ScheduleQuerySchema = z.object({
  employee_id:   z.string().optional(),
  department_id: z.string().optional(),
  week_start:    z.string().optional(),
});
class ScheduleQueryDto extends createZodDto(ScheduleQuerySchema) {}

@Roles('admin', 'manager', 'supervisor', 'hr_manager', 'employee')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@ApiTags('Shift')
@ApiBearerAuth()
@Controller('hr-v2/shifts')
export class ShiftController {
  private readonly logger = new Logger(ShiftController.name);
  constructor(private readonly svc: ShiftService) {}

  @ApiOperation({ summary: 'Shift tayinlash' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  async assign(@Body() body: AssignShiftDto) {
    // Accept employee_id (numeric) or user_id (string from FE /api/users list)
    let employeeId: number;
    if (body.employee_id) {
      employeeId = body.employee_id;
    } else if (body.user_id) {
      const r = await this.svc.findEmployeeByUserId(body.user_id);
      employeeId = r.ok && r.data ? r.data : (parseInt(body.user_id, 10) || 0);
    } else {
      throw new BadRequestException('employee_id yoki user_id kerak');
    }
    return unwrapOrInternal(await this.svc.assignShift({
      employeeId,
      shiftDate:  body.shift_date,
      shiftType:  body.shift_type ?? 'day',
      startTime:  body.start_time ?? '08:00',
      endTime:    body.end_time   ?? '17:00',
      notes:      body.notes,
    }));
  }

  @ApiOperation({ summary: 'Swap so\'rovi yuborish' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('swap-request')
  async requestSwap(@Body() body: RequestSwapDto) {
    // Accept string or number IDs; resolve shift_id from employee+date if not provided
    const fromEmpId = typeof body.from_employee_id === 'string'
      ? (parseInt(body.from_employee_id, 10) || 0) : (body.from_employee_id ?? 0);
    const toEmpId = typeof body.to_employee_id === 'string'
      ? (parseInt(body.to_employee_id, 10) || 0) : (body.to_employee_id ?? 0);
    let fromShiftId = body.from_shift_id ?? 0;
    if (!fromShiftId && fromEmpId && body.shift_date) {
      const r = await this.svc.findShiftByEmployeeAndDate(fromEmpId, body.shift_date);
      fromShiftId = r.ok && r.data ? r.data : 0;
    }
    return unwrapOrInternal(await this.svc.requestSwap({
      fromEmployeeId: fromEmpId,
      toEmployeeId:   toEmpId,
      fromShiftId,
      reason:         body.reason,
    }));
  }

  @ApiOperation({ summary: 'Swap tasdiqlash' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id/approve-swap')
  async approveSwap(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.svc.approveSwap(id));
  }

  @ApiOperation({ summary: 'Haftalik jadval' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('schedule')
  async getSchedule(@Query() query: ScheduleQueryDto) {
    return unwrapOrInternal(await this.svc.getSchedule({
      employeeId:   query.employee_id   ? parseInt(query.employee_id)   : undefined,
      departmentId: query.department_id ? parseInt(query.department_id) : undefined,
      weekStart:    query.week_start,
    }));
  }

  @ApiOperation({ summary: 'Swap so\'rovlar ro\'yxati' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('swap-requests')
  async getSwapRequests() {
    return unwrapOrInternal(await this.svc.getSwapRequests());
  }

  @ApiOperation({ summary: 'Smena o\'chirish' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteShift(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.svc.deleteShift(id));
  }
}
