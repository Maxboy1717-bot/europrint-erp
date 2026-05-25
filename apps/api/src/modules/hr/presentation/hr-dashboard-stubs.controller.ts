/**
 * @module hr-dashboard-stubs.controller
 * @description Read-side (GET) stub HR dashboard endpoints. The write-side handlers
 * (POST/PATCH/PUT) live in `hr-dashboard-stubs-write.controller.ts` (Rule 16: ≤ 300 lines).
 * Both controllers share the `/hr` route prefix so consumers see no change.
 *
 * P3-26: Replaced fake empty payloads with HTTP 501 (Not Implemented) per Rule 10
 * of CLAUDE.md. Frontend pages must handle 501 gracefully (empty-state / coming-soon
 * banner).
 */

import { Controller, Get, Param, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { notImplemented } from './hr-dashboard-stubs-common';

export { HrDashboardStubsWriteController } from './hr-dashboard-stubs-write.controller';

@ApiThrottle()
@ApiTags('Hr Dashboard Stubs')
@Controller('hr')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles('HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR', 'ADMIN', 'MANAGER')
export class HrDashboardStubsController {

  @ApiOperation({ summary: 'Get adaptation by id' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('adaptation/:id')
  getAdaptationById(@Param('id') _id: string) {
    return notImplemented('GET /hr/adaptation/:id');
  }

  @ApiOperation({ summary: 'Get alumni by id' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('alumni/:id')
  getAlumniById(@Param('id') _id: string) {
    return notImplemented('GET /hr/alumni/:id');
  }

  @ApiOperation({ summary: 'Get daily reports' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('daily-reports')
  getDailyReports(@Query('date') _date?: string) {
    return notImplemented('GET /hr/daily-reports');
  }

  @ApiOperation({ summary: 'Get daily reports by dept' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('daily-reports/department')
  getDailyReportsByDept(@Query('departmentId') _departmentId?: string) {
    return notImplemented('GET /hr/daily-reports/department');
  }

  @ApiOperation({ summary: 'Get daily reports my' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('daily-reports/my')
  getDailyReportsMy() {
    return notImplemented('GET /hr/daily-reports/my');
  }

  @ApiOperation({ summary: 'Get offboarding cases' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('offboarding/cases')
  getOffboardingCases() {
    return notImplemented('GET /hr/offboarding/cases');
  }

  @ApiOperation({ summary: 'Get offboarding questions' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('offboarding/questions')
  getOffboardingQuestions() {
    return notImplemented('GET /hr/offboarding/questions');
  }

  @ApiOperation({ summary: 'Get onboarding checklists' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('onboarding-checklists')
  getOnboardingChecklists() {
    return notImplemented('GET /hr/onboarding-checklists');
  }

  @ApiOperation({ summary: 'Get fp cycle' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('fp-cycle')
  getFpCycle() {
    return notImplemented('GET /hr/fp-cycle');
  }

  @ApiOperation({ summary: 'Get hrc tests employee' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('hrc-tests/employee')
  getHrcTestsEmployee() {
    return notImplemented('GET /hr/hrc-tests/employee');
  }

  @ApiOperation({ summary: 'Get hrc tests public' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('hrc-tests/public')
  getHrcTestsPublic() {
    return notImplemented('GET /hr/hrc-tests/public');
  }

  @ApiOperation({ summary: 'Get hrc tests stats' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('hrc-tests/stats')
  getHrcTestsStats() {
    return notImplemented('GET /hr/hrc-tests/stats');
  }

  @ApiOperation({ summary: 'Get360 reviewable' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('360/reviewable')
  get360Reviewable() {
    return notImplemented('GET /hr/360/reviewable');
  }

  @ApiOperation({ summary: 'Get birthday settings' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('birthdays/settings')
  getBirthdaySettings() {
    return notImplemented('GET /hr/birthdays/settings');
  }

  @ApiOperation({ summary: 'Get birthday settings by id' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('birthdays/settings/:id')
  getBirthdaySettingsById(@Param('id') _id: string) {
    return notImplemented('GET /hr/birthdays/settings/:id');
  }

  @ApiOperation({ summary: 'Get ai interview session' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('ai-interview/session')
  getAiInterviewSession() {
    return notImplemented('GET /hr/ai-interview/session');
  }

  @ApiOperation({ summary: 'Get ai interview session review' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('ai-interview/session/:id/review')
  getAiInterviewSessionReview(@Param('id') _id: string) {
    return notImplemented('GET /hr/ai-interview/session/:id/review');
  }

  @ApiOperation({ summary: 'Get employee documents' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('documents/employee')
  getEmployeeDocuments() {
    return notImplemented('GET /hr/documents/employee');
  }

  @ApiOperation({ summary: 'Get my documents' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('documents/my')
  getMyDocuments() {
    return notImplemented('GET /hr/documents/my');
  }

  @ApiOperation({ summary: 'Get pending documents' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('documents/pending')
  getPendingDocuments() {
    return notImplemented('GET /hr/documents/pending');
  }

  @ApiOperation({ summary: 'Get employee corp' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('employee-corp')
  getEmployeeCorp() {
    return notImplemented('GET /hr/employee-corp');
  }

  @ApiOperation({ summary: 'Get employee corp by id' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('employee-corp/:id')
  getEmployeeCorpById(@Param('id') _id: string) {
    return notImplemented('GET /hr/employee-corp/:id');
  }

  @ApiOperation({ summary: 'Get employee operator stats' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('employees/operator-stats')
  getEmployeeOperatorStats() {
    return notImplemented('GET /hr/employees/operator-stats');
  }

  @ApiOperation({ summary: 'Get enps survey results' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('enps/surveys/results')
  getEnpsSurveyResults() {
    return notImplemented('GET /hr/enps/surveys/results');
  }

  @ApiOperation({ summary: 'Calculate abc analysis' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('abc-analysis/:id/calculate')
  calculateAbcAnalysis(@Param('id') _id: string) {
    return notImplemented('GET /hr/abc-analysis/:id/calculate');
  }

  @ApiOperation({ summary: 'Get referral by id' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('referrals/:id')
  getReferralById(@Param('id') _id: string) {
    return notImplemented('GET /hr/referrals/:id');
  }
}
