/**
 * @module hr-dashboard-stubs.controller
 * @description Stub/placeholder HR dashboard endpoints split out of hr-dashboard.controller.
 * Routes here all live under the same `hr` prefix.
 *
 * P3-26: Replaced fake empty payloads with HTTP 501 (Not Implemented) per Rule 10
 * of CLAUDE.md. Frontend pages must handle 501 gracefully (empty-state / coming-soon
 * banner). Bodies are still validated so request shape errors return 400 honestly,
 * but write endpoints also return 501 instead of pretending to persist.
 */

import { Body, Controller, Get, HttpCode, HttpException, HttpStatus, Param, Patch, Post, Put, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { z } from 'zod';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';

const PassthroughSchema = z.record(z.unknown());

const notImplemented = (route: string): never => {
  throw new HttpException(
    { message: `Endpoint not yet implemented: ${route}`, code: 'NOT_IMPLEMENTED' },
    HttpStatus.NOT_IMPLEMENTED,
  );
};

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

  @ApiOperation({ summary: 'Invite alumni' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('alumni/:id/invite')
  @HttpCode(HttpStatus.OK)
  inviteAlumni(@Param('id') _id: string, @Body() _body: unknown) {
    return notImplemented('POST /hr/alumni/:id/invite');
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

  @ApiOperation({ summary: 'Post calculate abc analysis' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('abc-analysis/:id/calculate')
  @HttpCode(HttpStatus.OK)
  postCalculateAbcAnalysis(@Param('id') _id: string) {
    return notImplemented('POST /hr/abc-analysis/:id/calculate');
  }

  @ApiOperation({ summary: 'Patch adaptation' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('adaptation/:id')
  patchAdaptation(@Param('id') _id: string, @Body() body: unknown) {
    PassthroughSchema.parse(body ?? {});
    return notImplemented('PATCH /hr/adaptation/:id');
  }

  @ApiOperation({ summary: 'Patch ai interview session review' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('ai-interview/session/:id/review')
  patchAiInterviewSessionReview(@Param('id') _id: string, @Body() body: unknown) {
    PassthroughSchema.parse(body ?? {});
    return notImplemented('PATCH /hr/ai-interview/session/:id/review');
  }

  @ApiOperation({ summary: 'Put birthday settings by id' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Put('birthdays/settings/:id')
  putBirthdaySettingsById(@Param('id') _id: string, @Body() body: unknown) {
    PassthroughSchema.parse(body ?? {});
    return notImplemented('PUT /hr/birthdays/settings/:id');
  }

  @ApiOperation({ summary: 'Create offboarding case' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('offboarding/cases')
  @HttpCode(HttpStatus.CREATED)
  createOffboardingCase(@Body() body: unknown) {
    PassthroughSchema.parse(body ?? {});
    return notImplemented('POST /hr/offboarding/cases');
  }

  @ApiOperation({ summary: 'Create onboarding checklist' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('onboarding-checklists')
  @HttpCode(HttpStatus.CREATED)
  createOnboardingChecklist(@Body() body: unknown) {
    PassthroughSchema.parse(body ?? {});
    return notImplemented('POST /hr/onboarding-checklists');
  }

  @ApiOperation({ summary: 'Patch onboarding checklist' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('onboarding-checklists/:id')
  @HttpCode(HttpStatus.OK)
  patchOnboardingChecklist(@Param('id') _id: string, @Body() body: unknown) {
    PassthroughSchema.parse(body ?? {});
    return notImplemented('PATCH /hr/onboarding-checklists/:id');
  }

  @ApiOperation({ summary: 'Get referral by id' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('referrals/:id')
  getReferralById(@Param('id') _id: string) {
    return notImplemented('GET /hr/referrals/:id');
  }

  @ApiOperation({ summary: 'Patch referral' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('referrals/:id')
  @HttpCode(HttpStatus.OK)
  patchReferral(@Param('id') _id: string, @Body() body: unknown) {
    PassthroughSchema.parse(body ?? {});
    return notImplemented('PATCH /hr/referrals/:id');
  }
}
