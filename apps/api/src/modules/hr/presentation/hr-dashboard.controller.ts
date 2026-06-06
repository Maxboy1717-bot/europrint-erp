import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Controller, Get, Param, Post, Patch, Body, HttpCode, HttpException, Query, UseGuards, UseInterceptors, HttpStatus, UsePipes, ParseIntPipe } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { HrDashboardService } from '../application/hr-dashboard.service';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { HrDailyReportSchema, HrDailyReportDto, HrBirthdaySettingsSchema, HrBirthdaySettingsDto, CreatePipSchema, CreatePipDto, UpdatePipSchema, UpdatePipDto } from './dto/hr.dto';
import { unwrapOrInternal, unwrapOrDefault } from '@common/http-result';

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('hr')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles('HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR', 'ADMIN', 'MANAGER')
export class HrDashboardController {
  constructor(private readonly svc: HrDashboardService) {}

  @Get('birthdays')
  async getBirthdays(@Query('days') days?: string) {
    return unwrapOrDefault(await this.svc.getBirthdaysUpcoming(Math.min(parseInt(days ?? '7', 10) || 7, 90)), []);
  }

  @Get('birthdays/today')
  async getBirthdaysToday() {
    return unwrapOrDefault(await this.svc.getBirthdaysToday(), []);
  }

  @Get('birthdays/upcoming')
  async getBirthdaysUpcoming(@Query('days') days?: string) {
    return unwrapOrDefault(await this.svc.getBirthdaysUpcoming(Math.min(parseInt(days ?? '7', 10) || 7, 90)), []);
  }

  @Get('milestones/upcoming')
  async getMilestonesUpcoming(@Query('days') days?: string) {
    return unwrapOrDefault(await this.svc.getMilestonesUpcoming(Math.min(parseInt(days ?? '30', 10) || 30, 180)), []);
  }

  @Get('monthly-trend')
  async getMonthlyTrend() {
    return unwrapOrDefault(await this.svc.getMonthlyTrend(), []);
  }

  @Get('monthly-trend/:lang')
  async getMonthlyTrendByLang(@Param('lang') _lang: string) {
    return unwrapOrDefault(await this.svc.getMonthlyTrend(), []);
  }

  @Get('abc-analysis')
  async getAbcAnalysis() {
    return unwrapOrDefault(await this.svc.getAbcAnalysis(), []);
  }

  @Get('alerts')
  async getAlerts() {
    return unwrapOrDefault(await this.svc.getAlerts(), []);
  }

  @Get('discipline-records')
  async getDisciplineRecords() {
    return unwrapOrDefault(await this.svc.getDisciplineRecords(), []);
  }

  @Get('pip')
  async getPip() {
    return unwrapOrDefault(await this.svc.getPip(), []);
  }

  @Post('pip')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(CreatePipSchema))
  async createPip(@Body() body: CreatePipDto): Promise<{ data: unknown }> {
    return { data: unwrapOrInternal(await this.svc.createPip(body)) };
  }

  @Patch('pip/:id')
  async updatePip(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ): Promise<{ data: unknown }> {
    const dto = UpdatePipSchema.parse(body ?? {}) as UpdatePipDto;
    return { data: unwrapOrInternal(await this.svc.updatePip(id, dto)) };
  }

  @Get('enps/surveys')
  async getEnpsSurveys() {
    return unwrapOrDefault(await this.svc.getEnpsSurveys(), []);
  }

  @Get('ai-interview/sessions')
  async getAiInterviewSessions() {
    return unwrapOrDefault(await this.svc.getAiInterviewSessions(), []);
  }

  @Get('daily-reports/stats')
  async getDailyReportsStats() {
    const r = await this.svc.getDailyReportsStats();
    return r.ok && r.data ? r.data : { total: 0, approved: 0, pending: 0, today: 0 };
  }

  @Get('adaptation/at-risk')
  async getAdaptationAtRisk() {
    return unwrapOrDefault(await this.svc.getAdaptationAtRisk(), []);
  }

  @Get('shifts/today')
  async getShiftsToday() {
    return unwrapOrDefault(await this.svc.getShiftsToday(_time.now().toISOString().split('T')[0]), []);
  }

  @Get('milestones')
  async getMilestones(@Query('page') _page?: string, @Query('limit') _limit?: string) {
    return unwrapOrDefault(await this.svc.getMilestonesUpcoming(90), []);
  }

  @Get('dashboard-stats')
  async getDashboardStats() {
    const r = await db.execute(sql`
      SELECT
        COUNT(*)::int AS total_employees,
        COUNT(*) FILTER (WHERE is_active=true)::int AS active,
        COUNT(*) FILTER (WHERE status='on_leave')::int AS on_leave,
        COUNT(*) FILTER (WHERE is_active=false)::int AS inactive
      FROM employees WHERE deleted_at IS NULL
    `);
    const row = ((r as { rows?: unknown[] }).rows ?? [])[0] ?? {};
    return { data: row };
  }

  @Get('adaptation')
  async getAdaptation() {
    return unwrapOrDefault(await this.svc.getAdaptationAtRisk(), []);
  }

  @Get('adaptation/:id')
  async getAdaptationById(@Param('id') id: string) {
    const r = await db.execute(sql`
      SELECT * FROM adaptation_records WHERE id=${parseInt(id, 10)} AND deleted_at IS NULL LIMIT 1
    `);
    const row = ((r as { rows?: unknown[] }).rows ?? [])[0] ?? null;
    if (!row) throw new HttpException('Topilmadi', HttpStatus.NOT_FOUND);
    return { data: row };
  }

  @Get('alumni')
  async getAlumni() {
    const r = await this.svc.getAlumni();
    const items = r.ok ? r.data : [];
    return { items, total: (items as unknown[]).length };
  }

  @Get('alumni/:id')
  async getAlumniById(@Param('id') id: string) {
    const result = await this.svc.getAlumni();
    const items = result.ok && Array.isArray(result.data) ? result.data as Record<string,unknown>[] : [];
    const item = items.find(a => String(a['id']) === id);
    if (!item) throw new HttpException('Topilmadi', HttpStatus.NOT_FOUND);
    return item;
  }

  @Get('daily-reports')
  async getDailyReports(@Query('date') _date?: string) {
    const r = await this.svc.getDailyReportsStats();
    return r.ok && r.data ? r.data : { total: 0, approved: 0, pending: 0, today: 0 };
  }

  @Get('daily-reports/department')
  async getDailyReportsByDept(@Query('departmentId') _departmentId?: string) {
    const r = await this.svc.getDailyReportsStats();
    return r.ok && r.data ? r.data : { total: 0, approved: 0, pending: 0, today: 0 };
  }

  @Get('daily-reports/my')
  async getDailyReportsMy() {
    const r = await this.svc.getDailyReportsStats();
    return r.ok && r.data ? r.data : { total: 0, approved: 0, pending: 0, today: 0 };
  }

  @Post('daily-reports')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(HrDailyReportSchema))
  async createDailyReport(@Body() body: HrDailyReportDto) {
    return unwrapOrInternal(await this.svc.createDailyReport({
      user_id:         body.user_id ?? 0,
      report_date:     body.date ?? new Date().toISOString().split('T')[0],
      tasks_completed: body.summary,
    }));
  }

  // `GET hr/offboarding/cases` is implemented by `HrOffboardingController`
  // (see `apps/api/src/modules/hr/offboarding/hr-offboarding.controller.ts`).
  // The previous stub here returned `{ items: [], total: 0 }` and shadowed the
  // real handler depending on module-registration order. Removed in Phase 4 Task 4.4.

  @Get('offboarding/questions')
  getOffboardingQuestions() {
    throw new HttpException('Hali amalga oshirilmagan', HttpStatus.NOT_IMPLEMENTED);
  }

  // `GET hr/onboarding-checklists` is implemented by
  // `OnboardingChecklistsController` (apps/api/src/modules/hr/onboarding-checklists/).
  // The previous stub here shadowed the real handler. Removed in Phase 4 Task 4.5.

  @Get('fp-cycle')
  async getFpCycle() {
    const r = await db.execute(sql`
      SELECT * FROM fp_cycles ORDER BY created_at DESC LIMIT 20
    `);
    const items = ((r as { rows?: unknown[] }).rows) ?? [];
    return { items, total: items.length };
  }

  @Get('hrc-tests/employee')
  getHrcTestsEmployee() {
    throw new HttpException('Hali amalga oshirilmagan', HttpStatus.NOT_IMPLEMENTED);
  }

  @Get('hrc-tests/public')
  getHrcTestsPublic() {
    throw new HttpException('Hali amalga oshirilmagan', HttpStatus.NOT_IMPLEMENTED);
  }

  @Get('hrc-tests/stats')
  getHrcTestsStats() {
    throw new HttpException('Hali amalga oshirilmagan', HttpStatus.NOT_IMPLEMENTED);
  }

  @Get('360/reviewable')
  get360Reviewable() {
    throw new HttpException('Hali amalga oshirilmagan', HttpStatus.NOT_IMPLEMENTED);
  }

  @Get('birthdays/settings')
  getBirthdaySettings() {
    throw new HttpException('Hali amalga oshirilmagan', HttpStatus.NOT_IMPLEMENTED);
  }

  @Post('birthdays/settings')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(HrBirthdaySettingsSchema))
  saveBirthdaySettings(@Body() _body: HrBirthdaySettingsDto) {
    throw new HttpException('Hali amalga oshirilmagan', HttpStatus.NOT_IMPLEMENTED);
  }

  @Get('birthdays/settings/:id')
  getBirthdaySettingsById(@Param('id') _id: string) {
    throw new HttpException('Hali amalga oshirilmagan', HttpStatus.NOT_IMPLEMENTED);
  }

  @Get('ai-interview/session')
  getAiInterviewSession() {
    throw new HttpException('Hali amalga oshirilmagan', HttpStatus.NOT_IMPLEMENTED);
  }

  @Get('ai-interview/session/:id/review')
  getAiInterviewSessionReview(@Param('id') _id: string) {
    throw new HttpException('Hali amalga oshirilmagan', HttpStatus.NOT_IMPLEMENTED);
  }

  @Get('documents/employee')
  getEmployeeDocuments() {
    return { items: [], total: 0 };
  }

  @Get('documents/my')
  getMyDocuments() {
    return { items: [], total: 0 };
  }

  @Get('documents/pending')
  getPendingDocuments() {
    return { items: [], total: 0 };
  }

  @Get('employee-corp')
  getEmployeeCorp() {
    throw new HttpException('Hali amalga oshirilmagan', HttpStatus.NOT_IMPLEMENTED);
  }

  @Get('employees/operator-stats')
  async getEmployeeOperatorStats() {
    const r = await this.svc.getDailyReportsStats();
    const stats = r.ok && r.data ? r.data : { total: 0, approved: 0, pending: 0, today: 0 };
    return { operatorStats: { submitted: stats.today, total: stats.total, percentage: stats.total > 0 ? Math.round(stats.today / stats.total * 100) : 0 } };
  }

  @Get('enps/surveys/results')
  getEnpsSurveyResults() {
    throw new HttpException('Hali amalga oshirilmagan', HttpStatus.NOT_IMPLEMENTED);
  }

  @Get('abc-analysis/:id/calculate')
  async calculateAbcAnalysis(@Param('id') id: string) {
    const all = unwrapOrDefault(await this.svc.getAbcAnalysis(), []);
    const items = Array.isArray(all) ? all as Record<string,unknown>[] : [];
    const found = items.find(a => String(a['userId'] ?? a['user_id']) === id);
    if (!found) throw new HttpException('Topilmadi', HttpStatus.NOT_FOUND);
    return found;
  }

  // ── New endpoints (HR Dashboard missing) ──────────────────────────────────

  // NOTE: risk-scores, safety/summary, safety/incidents are served by
  // HrDashboardExtraController — duplicate declarations removed (boot collision).

  /** Blocked employees from employee_blocks table */
  @Get('discipline/blocked')
  async getDisciplineBlocked() {
    return unwrapOrDefault(await this.svc.getDisciplineBlocked(), []);
  }

  // NOTE: `GET /api/hr/resignation-stats` is served by HrDashboardExtraController
  // (which also exposes the `resignation-stats/:lang` variant). The duplicate
  // declaration here collided at boot ("Method 'GET' already declared") — removed.

  // NOTE: contracts/expiring served by HrDashboardExtraController (dup removed).

  // NOTE: `GET /api/hr/attendance` is served by HrAttendanceController
  // (@Controller('hr/attendance') root). The duplicate here collided at boot — removed.

  /** Gamification leaderboard (period: monthly | quarterly | total) */
  @Get('gamification/leaderboard')
  async getGamificationLeaderboard(@Query('period') period?: string) {
    return unwrapOrDefault(await this.svc.getGamificationLeaderboard(period ?? 'monthly'), []);
  }

  // NOTE: offboarding/cases/stats served by HrDashboardExtraController (dup removed).
}
