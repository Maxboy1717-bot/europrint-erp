/**
 * @module daily-report.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Controller, UseGuards, Get, HttpCode, HttpException, HttpStatus, Post, Patch, Body, Param, ParseIntPipe, Query, Logger, UseInterceptors, Res } from '@nestjs/common';

// P3-26: aggregated employee/department report endpoints aren't wired yet.
const notImplemented = (route: string): never => {
  throw new HttpException(
    { message: `Endpoint not yet implemented: ${route}`, code: 'NOT_IMPLEMENTED' },
    HttpStatus.NOT_IMPLEMENTED,
  );
};
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { FastifyReply } from 'fastify';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
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
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@ApiTags('Daily Report')
@ApiBearerAuth()
@Controller('hr-v2/daily-reports')
export class DailyReportController {
  private readonly logger = new Logger(DailyReportController.name);
  constructor(private readonly svc: DailyReportService) {}

  @ApiOperation({ summary: 'Submit' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
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

  @ApiOperation({ summary: 'Override' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id/override')
  async override(@Param('id', ParseIntPipe) id: number, @Body() body: OverrideReportDto) {
    return unwrapOrInternal(await this.svc.hrOverride(id, body.hr_user_id || 1, body.override_notes ?? ''));
  }

  @ApiOperation({ summary: 'Stats' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('stats')
  async stats(@Query('date') date: string) {
    return unwrapOrInternal(await this.svc.getStats(date));
  }

  @ApiOperation({ summary: 'By date' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('by-date')
  async byDate(@Query('date') date: string) {
    return unwrapOrInternal(await this.svc.getByDate(date || _time.now().toISOString().split('T')[0]));
  }

  @ApiOperation({ summary: 'By employee' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('employee/:id')
  async byEmployee(@Param('id', ParseIntPipe) id: number, @Query('limit') limit: string) {
    return unwrapOrInternal(await this.svc.getByEmployee(id, parseInt(limit || '30')));
  }

  @ApiOperation({ summary: 'Get employee reports' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Get('employee')
  async getEmployeeReports() {
    return notImplemented('GET /daily-reports/employee');
  }

  @ApiOperation({ summary: 'Get department reports' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Get('department')
  async getDepartmentReports() {
    return notImplemented('GET /daily-reports/department');
  }

  @ApiOperation({ summary: 'Get department reports by id' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('department/:id')
  async getDepartmentReportsById(@Param('id') id: string, @Query('date') date?: string) {
    try {
      const reportDate = date || _time.now().toISOString().split('T')[0];
      const r = await this.svc.getByDate(reportDate);
      if (!r.ok) {
        this.logger.error(`getDepartmentReportsById: ${r.error?.message ?? 'unknown'}`);
        return { data: [], total: 0, departmentId: id };
      }
      const rows = Array.isArray(r.data) ? r.data : [];
      return { data: rows, total: rows.length, departmentId: id, date: reportDate };
    } catch (e) {
      this.logger.error(`getDepartmentReportsById: ${(e as Error).message}`);
      return { data: [], total: 0, departmentId: id };
    }
  }

  @ApiOperation({ summary: 'List reports' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Get()
  async listReports(@Query('date') _date?: string, @Query('limit') _limit?: string) {
    return notImplemented('GET /daily-reports');
  }

  @ApiOperation({ summary: 'Export pdf' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
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
