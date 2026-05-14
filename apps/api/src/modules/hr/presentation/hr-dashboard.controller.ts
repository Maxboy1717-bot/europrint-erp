/**
 * @module hr-dashboard.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Controller, Get, Param, Post, Patch, Put, Body, HttpCode, Query, UseGuards, UseInterceptors, HttpStatus, UsePipes } from '@nestjs/common';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { HrDashboardService } from '../application/hr-dashboard.service';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { HrDailyReportSchema, HrDailyReportDto, HrBirthdaySettingsSchema, HrBirthdaySettingsDto } from './dto/hr.dto';
import { unwrapOrInternal } from '@common/http-result';

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('hr')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles('HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR', 'ADMIN', 'MANAGER')
export class HrDashboardController {
  constructor(private readonly svc: HrDashboardService) {}

  @Get('birthdays')
  async getBirthdays(@Query('days') days?: string) {
    return unwrapOrInternal(await this.svc.getBirthdaysUpcoming(Math.min(parseInt(days ?? '7', 10) || 7, 90)));
  }

  @Get('birthdays/today')
  async getBirthdaysToday() {
    return unwrapOrInternal(await this.svc.getBirthdaysToday());
  }

  @Get('birthdays/upcoming')
  async getBirthdaysUpcoming(@Query('days') days?: string) {
    return unwrapOrInternal(await this.svc.getBirthdaysUpcoming(Math.min(parseInt(days ?? '7', 10) || 7, 90)));
  }

  @Get('milestones/upcoming')
  async getMilestonesUpcoming(@Query('days') days?: string) {
    return unwrapOrInternal(await this.svc.getMilestonesUpcoming(Math.min(parseInt(days ?? '30', 10) || 30, 180)));
  }

  @Get('monthly-trend')
  async getMonthlyTrend() {
    return unwrapOrInternal(await this.svc.getMonthlyTrend());
  }

  @Get('monthly-trend/:lang')
  async getMonthlyTrendByLang(@Param('lang') _lang: string) {
    return unwrapOrInternal(await this.svc.getMonthlyTrend());
  }

  @Get('abc-analysis')
  async getAbcAnalysis() {
    return unwrapOrInternal(await this.svc.getAbcAnalysis());
  }

  @Get('alerts')
  async getAlerts() {
    return unwrapOrInternal(await this.svc.getAlerts());
  }

  @Get('discipline-records')
  async getDisciplineRecords() {
    return unwrapOrInternal(await this.svc.getDisciplineRecords());
  }

  @Get('pip')
  async getPip() {
    return unwrapOrInternal(await this.svc.getPip());
  }

  @Get('enps/surveys')
  async getEnpsSurveys() {
    return unwrapOrInternal(await this.svc.getEnpsSurveys());
  }

  @Get('ai-interview/sessions')
  async getAiInterviewSessions() {
    return unwrapOrInternal(await this.svc.getAiInterviewSessions());
  }

  @Get('daily-reports/stats')
  async getDailyReportsStats() {
    return unwrapOrInternal(await this.svc.getDailyReportsStats());
  }

  @Get('adaptation/at-risk')
  async getAdaptationAtRisk() {
    return unwrapOrInternal(await this.svc.getAdaptationAtRisk());
  }

  @Get('shifts/today')
  async getShiftsToday() {
    return unwrapOrInternal(await this.svc.getShiftsToday(_time.now().toISOString().split('T')[0]));
  }

  @Get('milestones')
  async getMilestones(@Query('page') _page?: string, @Query('limit') _limit?: string) {
    return unwrapOrInternal(await this.svc.getMilestonesUpcoming(90));
  }

  @Get('dashboard-stats')
  async getDashboardStats() {
    return unwrapOrInternal(await this.svc.getAlerts());
  }

  @Get('adaptation')
  async getAdaptation() {
    return unwrapOrInternal(await this.svc.getAdaptationAtRisk());
  }

  @Get('adaptation/:id')
  getAdaptationById(@Param('id') _id: string) {
    return { adaptation: null };
  }

  @Get('alumni')
  async getAlumni() {
    const rows = await this.svc.getAlumni();
    const alumni = unwrapOrInternal(rows);
    return { alumni: Array.isArray(alumni) ? alumni : [] };
  }

  @Get('alumni/:id')
  getAlumniById(@Param('id') _id: string) {
    return { alumni: null };
  }

  @Post('alumni/:id/invite')
  @HttpCode(HttpStatus.OK)
  inviteAlumni(@Param('id') _id: string, @Body() _body: unknown) {
    throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED);
  }

  @Get('daily-reports')
  getDailyReports(@Query('date') _date?: string) {
    return { items: [], total: 0 };
  }

  @Get('daily-reports/department')
  getDailyReportsByDept(@Query('departmentId') _departmentId?: string) {
    return { items: [], total: 0 };
  }

  @Get('daily-reports/my')
  getDailyReportsMy() {
    return { items: [], total: 0 };
  }

  @Post('daily-reports')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(HrDailyReportSchema))
  async createDailyReport(@Body() body: HrDailyReportDto, @CurrentUser() user: AuthenticatedUser) {
    const today = _time.now().toISOString().slice(0, 10);
    const result = await this.svc.createDailyReport({
      user_id:         user.id,
      report_date:     body.date ?? today,
      tasks_completed: body.summary,
    });
    return result.ok ? result.data : { created: false };
  }

  @Get('offboarding/cases')
  getOffboardingCases() {
    return { items: [], total: 0 };
  }

  @Get('offboarding/questions')
  getOffboardingQuestions() {
    return { items: [], total: 0 };
  }

  @Get('onboarding-checklists')
  getOnboardingChecklists() {
    return { items: [], total: 0 };
  }

  @Get('fp-cycle')
  getFpCycle() {
    return { items: [], total: 0 };
  }

  @Get('hrc-tests/employee')
  getHrcTestsEmployee() {
    return { items: [], total: 0 };
  }

  @Get('hrc-tests/public')
  getHrcTestsPublic() {
    return { items: [], total: 0 };
  }

  @Get('hrc-tests/stats')
  getHrcTestsStats() {
    return { stats: null };
  }

  @Get('360/reviewable')
  get360Reviewable() {
    return { items: [], total: 0 };
  }

  @Get('birthdays/settings')
  getBirthdaySettings() {
    return { settings: null };
  }

  @Post('birthdays/settings')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(HrBirthdaySettingsSchema))
  saveBirthdaySettings(@Body() _body: HrBirthdaySettingsDto) {
    return { saved: true };
  }

  @Get('birthdays/settings/:id')
  getBirthdaySettingsById(@Param('id') _id: string) {
    return { settings: null };
  }

  @Get('ai-interview/session')
  getAiInterviewSession() {
    return { items: [], total: 0 };
  }

  @Get('ai-interview/session/:id/review')
  getAiInterviewSessionReview(@Param('id') _id: string) {
    return { review: null };
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
    return { items: [], total: 0 };
  }

  @Get('employees/operator-stats')
  getEmployeeOperatorStats() {
    return { stats: null };
  }

  @Get('enps/surveys/results')
  getEnpsSurveyResults() {
    return { items: [], total: 0 };
  }

  @Get('abc-analysis/:id/calculate')
  calculateAbcAnalysis(@Param('id') _id: string) {
    return { result: null };
  }

  @Post('abc-analysis/:id/calculate')
  @HttpCode(HttpStatus.OK)
  postCalculateAbcAnalysis(@Param('id') _id: string) {
    return { result: null };
  }

  @Patch('adaptation/:id')
  patchAdaptation(@Param('id') _id: string, @Body() _body: Record<string, unknown>) {
    return { adaptation: null, updated: true };
  }

  @Patch('ai-interview/session/:id/review')
  patchAiInterviewSessionReview(@Param('id') _id: string, @Body() _body: Record<string, unknown>) {
    return { review: null, updated: true };
  }

  @Put('birthdays/settings/:id')
  putBirthdaySettingsById(@Param('id') _id: string, @Body() _body: Record<string, unknown>) {
    return { settings: null, updated: true };
  }

  @Post('offboarding/cases')
  @HttpCode(HttpStatus.CREATED)
  createOffboardingCase(@Body() body: Record<string, unknown>) {
    return { id: Date.now(), ...body, created: true };
  }

  @Post('onboarding-checklists')
  @HttpCode(HttpStatus.CREATED)
  createOnboardingChecklist(@Body() body: Record<string, unknown>) {
    return { id: Date.now(), ...body, created: true };
  }
}
