import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Controller, Get, Param, Post, Body, HttpCode, HttpException, Query, UseGuards, UseInterceptors, HttpStatus, UsePipes } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { HrDashboardService } from '../application/hr-dashboard.service';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { HrDailyReportSchema, HrDailyReportDto, HrBirthdaySettingsSchema, HrBirthdaySettingsDto } from './dto/hr.dto';
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
    return unwrapOrDefault(await this.svc.getAlerts(), []);
  }

  @Get('adaptation')
  async getAdaptation() {
    return unwrapOrInternal(await this.svc.getAdaptationAtRisk());
  }

  @Get('adaptation/:id')
  getAdaptationById(@Param('id') _id: string) {
    throw new HttpException('Hali amalga oshirilmagan', HttpStatus.NOT_IMPLEMENTED);
  }

  @Get('alumni')
  async getAlumni() {
    const r = await this.svc.getAlumni();
    const items = r.ok ? r.data : [];
    return { items, total: (items as unknown[]).length };
  }

  @Get('alumni/:id')
  getAlumniById(@Param('id') _id: string) {
    throw new HttpException('Hali amalga oshirilmagan', HttpStatus.NOT_IMPLEMENTED);
  }

  @Get('daily-reports')
  getDailyReports(@Query('date') _date?: string) {
    throw new HttpException('Hali amalga oshirilmagan', HttpStatus.NOT_IMPLEMENTED);
  }

  @Get('daily-reports/department')
  getDailyReportsByDept(@Query('departmentId') _departmentId?: string) {
    throw new HttpException('Hali amalga oshirilmagan', HttpStatus.NOT_IMPLEMENTED);
  }

  @Get('daily-reports/my')
  getDailyReportsMy() {
    throw new HttpException('Hali amalga oshirilmagan', HttpStatus.NOT_IMPLEMENTED);
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
  getFpCycle() {
    throw new HttpException('Hali amalga oshirilmagan', HttpStatus.NOT_IMPLEMENTED);
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
    throw new HttpException('Hali amalga oshirilmagan', HttpStatus.NOT_IMPLEMENTED);
  }

  @Get('documents/my')
  getMyDocuments() {
    throw new HttpException('Hali amalga oshirilmagan', HttpStatus.NOT_IMPLEMENTED);
  }

  @Get('documents/pending')
  getPendingDocuments() {
    throw new HttpException('Hali amalga oshirilmagan', HttpStatus.NOT_IMPLEMENTED);
  }

  @Get('employee-corp')
  getEmployeeCorp() {
    throw new HttpException('Hali amalga oshirilmagan', HttpStatus.NOT_IMPLEMENTED);
  }

  @Get('employees/operator-stats')
  getEmployeeOperatorStats() {
    throw new HttpException('Hali amalga oshirilmagan', HttpStatus.NOT_IMPLEMENTED);
  }

  @Get('enps/surveys/results')
  getEnpsSurveyResults() {
    throw new HttpException('Hali amalga oshirilmagan', HttpStatus.NOT_IMPLEMENTED);
  }

  @Get('abc-analysis/:id/calculate')
  calculateAbcAnalysis(@Param('id') _id: string) {
    throw new HttpException('Hali amalga oshirilmagan', HttpStatus.NOT_IMPLEMENTED);
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
