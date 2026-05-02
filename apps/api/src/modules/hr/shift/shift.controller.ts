import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Controller, UseGuards, Get, Post, Patch, Body, Param, ParseIntPipe, Query, Logger, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { ShiftService } from './shift.service';
import { Roles } from '../../../common/decorators/roles.decorator';
import { unwrapOrInternal } from '@common/http-result';

const AssignShiftSchema = z.object({
  employee_id: z.number().int(),
  shift_date:  z.string().min(1),
  shift_type:  z.string().optional(),
  start_time:  z.string().min(1),
  end_time:    z.string().min(1),
  notes:       z.string().optional(),
});
class AssignShiftDto extends createZodDto(AssignShiftSchema) {}

const RequestSwapSchema = z.object({
  from_employee_id: z.number().int(),
  to_employee_id:   z.number().int(),
  from_shift_id:    z.number().int(),
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
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@Controller('hr-v2/shifts')
export class ShiftController {
  private readonly logger = new Logger(ShiftController.name);
  constructor(private readonly svc: ShiftService) {}

  @Post()
  async assign(@Body() body: AssignShiftDto) {
    return unwrapOrInternal(await this.svc.assignShift({
      employeeId: body.employee_id,
      shiftDate: body.shift_date,
      shiftType: body.shift_type || 'day',
      startTime: body.start_time,
      endTime: body.end_time,
      notes: body.notes,
    }));
  }

  @Post('swap-request')
  async requestSwap(@Body() body: RequestSwapDto) {
    return unwrapOrInternal(await this.svc.requestSwap({
      fromEmployeeId: body.from_employee_id,
      toEmployeeId: body.to_employee_id,
      fromShiftId: body.from_shift_id,
      reason: body.reason,
    }));
  }

  @Patch(':id/approve-swap')
  async approveSwap(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.svc.approveSwap(id));
  }

  @Get('schedule')
  async getSchedule(@Query() query: ScheduleQueryDto) {
    return unwrapOrInternal(await this.svc.getSchedule({
      employeeId: query.employee_id ? parseInt(query.employee_id) : undefined,
      departmentId: query.department_id ? parseInt(query.department_id) : undefined,
      weekStart: query.week_start,
    }));
  }
}
