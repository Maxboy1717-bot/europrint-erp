import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { BadRequestException, Controller, UseGuards, Get, Post, Patch, Body, Param, ParseIntPipe, Query, Logger, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { DailyReportService } from './daily-report.service';
import { Roles } from '../../../common/decorators/roles.decorator';
import { unwrapOrInternal } from '@common/http-result';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';

const REPORT_TYPES = ['all', 'operator', 'office'] as const;
type ReportType = (typeof REPORT_TYPES)[number];

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

@Roles('admin', 'manager', 'supervisor', 'operator', 'employee', 'hr_manager', 'hr_specialist')
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hr-v2/daily-reports')
export class DailyReportController {
  private readonly logger = new Logger(DailyReportController.name);
  constructor(private readonly svc: DailyReportService) {}

  @Post()
  async submit(@Body() body: SubmitReportDto) {
    const metrics = body.metrics || (
      (body.blockers || body.mood || body.productive_hours)
        ? JSON.stringify({ blockers: body.blockers, mood: body.mood, productiveHours: body.productive_hours })
        : undefined
    );
    return unwrapOrInternal(await this.svc.submitReport({
      employeeId: body.employee_id,
      reportDate: body.report_date,
      tasksCompleted: body.tasks_completed || body.completed_tasks || '',
      metrics,
      tomorrowPlan: body.tomorrow_plan || body.planned_tasks,
    }));
  }

  @Patch(':id/override')
  // P1.24.2: use JWT user id instead of hardcoded fallback of 1
  async override(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: OverrideReportDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const hrUserId = body.hr_user_id ?? user?.id ?? 0;
    return unwrapOrInternal(await this.svc.hrOverride(id, hrUserId, body.override_notes ?? ''));
  }

  @Get('stats')
  // P1.24.2: wrap in { stats: {...} } and normalize field names FE expects
  async stats(@Query('date') date: string) {
    const r = await this.svc.getStats(date);
    const raw = (r.ok && r.data ? r.data as Record<string, unknown> : {});
    const submitted   = Number(raw['submitted_count']        ?? 0);
    const autoAbsent  = Number(raw['absent_count']           ?? 0);
    const totalActive = Number(raw['total_active_employees'] ?? 0);
    const pending     = Math.max(0, totalActive - submitted - autoAbsent);
    return {
      stats: {
        submitted_count:         submitted,
        auto_absent_count:       autoAbsent,
        pending_count:           pending,
        departments_with_reports: 0,  // aggregated elsewhere
      },
    };
  }

  @Get('by-date')
  async byDate(
    @Query('date') date: string,
    @Query('type') type?: string,
    @Query('limit') limit?: string,
  ) {
    const normalizedType: ReportType = REPORT_TYPES.includes(type as ReportType)
      ? (type as ReportType)
      : 'all';
    const rawLimit = parseInt(limit ?? '', 10);
    const normalizedLimit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 500) : 100;
    return unwrapOrInternal(
      await this.svc.getByDate(
        date || _time.now().toISOString().split('T')[0],
        normalizedType,
        normalizedLimit,
      ),
    );
  }

  /**
   * Frontend (`DailyReportPage.tsx:34`) calls
   *   GET /api/hr-v2/daily-reports/employee?employeeId=X&limit=14
   * so we accept `employeeId` as a required query param here.
   *
   * Declared before the parameterised by-id variant so the static path matches first.
   */
  @Get('employee')
  async byEmployeeQuery(
    @Query('employeeId') employeeId: string,
    @Query('limit') limit?: string,
  ) {
    const empId = parseInt(employeeId, 10);
    if (!Number.isFinite(empId) || empId <= 0) {
      throw new BadRequestException('employeeId is required');
    }
    return unwrapOrInternal(await this.svc.getByEmployee(empId, this.parseLimit(limit, 30)));
  }

  @Get('employee/:id')
  async byEmployeeParam(@Param('id', ParseIntPipe) id: number, @Query('limit') limit?: string) {
    return unwrapOrInternal(await this.svc.getByEmployee(id, this.parseLimit(limit, 30)));
  }

  /**
   * Frontend (`DailyReportPage.tsx:50`) calls
   *   GET /api/hr-v2/daily-reports/department/:id?date=YYYY-MM-DD
   * Returns `{ submitted, missing }` for the department's active employees.
   */
  @Get('department/:id')
  async byDepartment(
    @Param('id', ParseIntPipe) id: number,
    @Query('date') date?: string,
  ) {
    return unwrapOrInternal(
      await this.svc.getByDepartment(id, date || _time.now().toISOString().split('T')[0]),
    );
  }

  private parseLimit(raw: string | undefined, def: number): number {
    const parsed = parseInt(raw ?? String(def), 10);
    if (!Number.isFinite(parsed) || parsed <= 0) return def;
    return Math.min(parsed, 365);
  }
}
