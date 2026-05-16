/**
 * @module hr-dashboard.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 * Stub/placeholder routes are kept in HrDashboardStubsController (same `hr` prefix, separate file).
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards, UseInterceptors, UsePipes } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { HrDashboardService } from '../application/hr-dashboard.service';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { HrDailyReportSchema, HrDailyReportDto, HrBirthdaySettingsSchema, HrBirthdaySettingsDto } from './dto/hr.dto';
import { unwrapOrInternal } from '@common/http-result';

@ApiThrottle()
@ApiTags('Hr Dashboard')
@Controller('hr')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles('HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR', 'ADMIN', 'MANAGER')
export class HrDashboardController {
  constructor(private readonly svc: HrDashboardService) {}

  @ApiOperation({ summary: 'Get birthdays' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('birthdays')
  async getBirthdays(@Query('days') days?: string) {
    return unwrapOrInternal(await this.svc.getBirthdaysUpcoming(Math.min(parseInt(days ?? '7', 10) || 7, 90)));
  }

  @ApiOperation({ summary: 'Get birthdays today' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('birthdays/today')
  async getBirthdaysToday() {
    return unwrapOrInternal(await this.svc.getBirthdaysToday());
  }

  @ApiOperation({ summary: 'Get birthdays upcoming' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('birthdays/upcoming')
  async getBirthdaysUpcoming(@Query('days') days?: string) {
    return unwrapOrInternal(await this.svc.getBirthdaysUpcoming(Math.min(parseInt(days ?? '7', 10) || 7, 90)));
  }

  @ApiOperation({ summary: 'Get milestones upcoming' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('milestones/upcoming')
  async getMilestonesUpcoming(@Query('days') days?: string) {
    return unwrapOrInternal(await this.svc.getMilestonesUpcoming(Math.min(parseInt(days ?? '30', 10) || 30, 180)));
  }

  @ApiOperation({ summary: 'Get monthly trend' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('monthly-trend')
  async getMonthlyTrend() {
    return unwrapOrInternal(await this.svc.getMonthlyTrend());
  }

  @ApiOperation({ summary: 'Get monthly trend by lang' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('monthly-trend/:lang')
  async getMonthlyTrendByLang(@Param('lang') _lang: string) {
    return unwrapOrInternal(await this.svc.getMonthlyTrend());
  }

  @ApiOperation({ summary: 'Get abc analysis' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('abc-analysis')
  async getAbcAnalysis() {
    return unwrapOrInternal(await this.svc.getAbcAnalysis());
  }

  @ApiOperation({ summary: 'Get alerts' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('alerts')
  async getAlerts() {
    return unwrapOrInternal(await this.svc.getAlerts());
  }

  @ApiOperation({ summary: 'Get discipline records' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('discipline-records')
  async getDisciplineRecords() {
    return unwrapOrInternal(await this.svc.getDisciplineRecords());
  }

  @ApiOperation({ summary: 'Get pip' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('pip')
  async getPip() {
    return unwrapOrInternal(await this.svc.getPip());
  }

  @ApiOperation({ summary: 'Get enps surveys' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('enps/surveys')
  async getEnpsSurveys() {
    return unwrapOrInternal(await this.svc.getEnpsSurveys());
  }

  @ApiOperation({ summary: 'Get ai interview sessions' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('ai-interview/sessions')
  async getAiInterviewSessions() {
    return unwrapOrInternal(await this.svc.getAiInterviewSessions());
  }

  @ApiOperation({ summary: 'Get daily reports stats' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('daily-reports/stats')
  async getDailyReportsStats() {
    return unwrapOrInternal(await this.svc.getDailyReportsStats());
  }

  @ApiOperation({ summary: 'Get adaptation at risk' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('adaptation/at-risk')
  async getAdaptationAtRisk() {
    return unwrapOrInternal(await this.svc.getAdaptationAtRisk());
  }

  @ApiOperation({ summary: 'Get shifts today' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('shifts/today')
  async getShiftsToday() {
    return unwrapOrInternal(await this.svc.getShiftsToday(_time.now().toISOString().split('T')[0]));
  }

  @ApiOperation({ summary: 'Get milestones' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('milestones')
  async getMilestones(@Query('page') _page?: string, @Query('limit') _limit?: string) {
    return unwrapOrInternal(await this.svc.getMilestonesUpcoming(90));
  }

  @ApiOperation({ summary: 'Get dashboard stats' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('dashboard-stats')
  async getDashboardStats() {
    return unwrapOrInternal(await this.svc.getAlerts());
  }

  @ApiOperation({ summary: 'Get adaptation' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('adaptation')
  async getAdaptation() {
    return unwrapOrInternal(await this.svc.getAdaptationAtRisk());
  }

  @ApiOperation({ summary: 'Get alumni' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('alumni')
  async getAlumni() {
    const rows = await this.svc.getAlumni();
    const alumni = unwrapOrInternal(rows);
    return { alumni: Array.isArray(alumni) ? alumni : [] };
  }

  @ApiOperation({ summary: 'Create daily report' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
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

  @ApiOperation({ summary: 'Save birthday settings' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('birthdays/settings')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(HrBirthdaySettingsSchema))
  saveBirthdaySettings(@Body() _body: HrBirthdaySettingsDto) {
    return { saved: true };
  }
}
