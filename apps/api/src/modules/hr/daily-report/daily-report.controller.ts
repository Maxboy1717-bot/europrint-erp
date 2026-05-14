/**
 * @module daily-report.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Controller, UseGuards, Get, HttpCode, HttpStatus, Post, Patch, Body, Param, ParseIntPipe, Query, Logger, UseInterceptors, Res } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { DailyReportService } from './daily-report.service';
import { Roles } from '../../../common/decorators/roles.decorator';
import { unwrapOrInternal } from '@common/http-result';

const SubmitReportSchema = z.object({
  employee_id:     z.number().int(),
  report_date:     z.string().optional(),
  tasks_completed: z.string().optional(),
  completed_tasks: z.string().optional(),
  metrics:         z.string().optional(),
  blockers:        z.string().optional(),
  mood:            z.string().optional(),
  productive_hours: z.number().optional(),
  tomorrow_plan:   z.string().optional(),
  planned_tasks:   z.string().optional(),
});
class SubmitReportDto extends createZodDto(SubmitReportSchema) {}

const OverrideReportSchema = z.object({
  hr_user_id:     z.number().int().optional(),
  override_notes: z.string().optional(),
});
class OverrideReportDto extends createZodDto(OverrideReportSchema) {}

@Roles('admin', 'manager', 'supervisor', 'operator', 'employee')
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@Controller('hr-v2/daily-reports')
export class DailyReportController {
  private readonly logger = new Logger(DailyReportController.name);
  constructor(private readonly svc: DailyReportService) {}

  @Post()
  async submit(@Body() body: SubmitReportDto) {
    return unwrapOrInternal(await this.svc.submitReport({
      employeeId:     body.employee_id,
      reportDate:     body.report_date,
      tasksCompleted: body.tasks_completed || body.completed_tasks || '',
      metrics:        body.metrics,
      tomorrowPlan:   body.tomorrow_plan || body.planned_tasks,
      blockers:       body.blockers,
      mood:           body.mood,
      productiveHours: body.productive_hours,
    }));
  }

  @Patch(':id/override')
  async override(@Param('id', ParseIntPipe) id: number, @Body() body: OverrideReportDto) {
    return unwrapOrInternal(await this.svc.hrOverride(id, body.hr_user_id || 1, body.override_notes ?? ''));
  }

  @Get('stats')
  async stats(@Query('date') date: string) {
    return unwrapOrInternal(await this.svc.getStats(date));
  }

  @Get('by-date')
  async byDate(@Query('date') date: string) {
    return unwrapOrInternal(await this.svc.getByDate(date || _time.now().toISOString().split('T')[0]));
  }

  @Get('employee/:id')
  async byEmployee(@Param('id', ParseIntPipe) id: number, @Query('limit') limit: string) {
    return unwrapOrInternal(await this.svc.getByEmployee(id, parseInt(limit || '30')));
  }

  @Get('employee')
  async getEmployeeReports() { return { data: [], total: 0 }; }

  @Get('department')
  async getDepartmentReports() { return { data: [], total: 0 }; }

  @Get()
  async listReports(@Query('date') _date?: string, @Query('limit') _limit?: string) {
    return { data: [], total: 0 };
  }

  @Get(':id/pdf')
  async exportPdf(@Param('id', ParseIntPipe) id: number, @Res() reply: FastifyReply) {
    const r = await this.svc.generatePdf(id);
    if (!r.ok) {
      await reply.status(404).send({ ok: false, error: r.error?.message ?? 'PDF yaratishda xatolik' });
      return;
    }
    const filename = `daily-report-${id}-${_time.now().toISOString().split('T')[0]}.pdf`;
    await reply
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .send(Buffer.from(r.data));
  }
}
