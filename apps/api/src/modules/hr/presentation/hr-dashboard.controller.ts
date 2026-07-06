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
import { HrEmployeesExtService } from '../application/hr-employees-ext.service';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { HrDailyReportSchema, HrDailyReportDto, HrBirthdaySettingsSchema, HrBirthdaySettingsDto, CreatePipSchema, CreatePipDto, UpdatePipSchema, UpdatePipDto } from './dto/hr.dto';
import { I18nService } from 'nestjs-i18n';
import { unwrapOrInternal, unwrapOrDefault } from '@common/http-result';
import { CurrentUser } from '@common/decorators/current-user.decorator';

type Rows = { rows?: unknown[] };

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('hr')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles('HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR', 'ADMIN', 'MANAGER')
export class HrDashboardController {
  constructor(
    private readonly svc: HrDashboardService,
    private readonly empExtSvc: HrEmployeesExtService,
    private readonly i18n: I18nService,
  ) {}

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

  // P3.14: FE (AdaptationTab.tsx) calls GET /api/hr/adaptation/:employeeId — looks up the
  // employee's active adaptation_records row (not adaptation_records.id). Was previously
  // querying by `id`, which meant the employee-profile tab could never find a real record.
  @Get('adaptation/:employeeId')
  async getAdaptationById(@Param('employeeId') employeeId: string) {
    const r = await db.execute(sql`
      SELECT
        ar.id AS "recordId",
        ar.mentor_id AS "mentorId",
        COALESCE(mentor.first_name || ' ' || mentor.last_name, NULL) AS "mentorName",
        mentor.email_work AS "mentorEmail",
        mentor.phone_number AS "mentorPhone",
        ar.professional_master_id AS "professionalMasterId",
        COALESCE(master.first_name || ' ' || master.last_name, NULL) AS "professionalMasterName",
        master.email_work AS "professionalMasterEmail",
        master.phone_number AS "professionalMasterPhone",
        ar.start_date AS "assignedDate",
        ar.current_milestone AS "currentWeek",
        ar.total_milestones AS "totalWeeks",
        ar.progress_percent AS "progressPercent",
        ar.status AS "status",
        ar.hr_notes AS "hrNotes",
        ap.title AS "programName"
      FROM adaptation_records ar
      LEFT JOIN employees mentor ON mentor.id = ar.mentor_id
      LEFT JOIN employees master ON master.id = ar.professional_master_id
      LEFT JOIN adaptation_programs ap ON ap.id = ar.program_id
      WHERE ar.employee_id = ${parseInt(employeeId, 10)} AND ar.deleted_at IS NULL
      ORDER BY ar.created_at DESC
      LIMIT 1
    `);
    const row = ((r as { rows?: Record<string, unknown>[] }).rows ?? [])[0] ?? null;
    if (!row) return { recordId: null, status: 'not_started', weeklyScores: [] };
    return { ...row, weeklyScores: [] };
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
    if (!item) throw new HttpException(await this.i18n.t('errors.notFound'), HttpStatus.NOT_FOUND);
    return item;
  }

  @Get('daily-reports')
  async getDailyReports(
    @Query('date')  date?: string,
    @Query('type')  type?: string,
    @Query('limit') limitStr?: string,
  ) {
    const limit = Math.min(parseInt(limitStr ?? '100', 10) || 100, 500);
    const items = unwrapOrDefault(await this.svc.getReportsByDate(date, type, limit), []);
    return { items, total: (items as unknown[]).length };
  }

  @Get('daily-reports/department')
  async getDailyReportsByDept(
    @Query('departmentId') departmentId?: string,
    @Query('date')         date?: string,
  ) {
    const deptId = departmentId ? parseInt(departmentId, 10) : undefined;
    const r = await this.svc.getReportsByDepartment(deptId, date);
    return r.ok && r.data
      ? r.data
      : { submitted: [], missing: [] };
  }

  @Get('daily-reports/my')
  async getDailyReportsMy(
    @CurrentUser() user: { id: number },
    @Query('limit') limitStr?: string,
  ) {
    const limit = Math.min(parseInt(limitStr ?? '50', 10) || 50, 200);
    const items = unwrapOrDefault(await this.svc.getMyReports(user?.id ?? 0, limit), []);
    return { items, total: (items as unknown[]).length };
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
  async getOffboardingQuestions() {
    const r = await db.execute(sql`
      SELECT DISTINCT item_key, label, order_num
      FROM offboarding_checklist_items
      ORDER BY order_num ASC NULLS LAST
    `);
    const items = ((r as Rows).rows) ?? [];
    return { items, total: items.length };
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
  async getHrcTestsEmployee() {
    const r = await db.execute(sql`
      SELECT * FROM hr_interview_sessions ORDER BY created_at DESC LIMIT 100
    `);
    const items = ((r as Rows).rows) ?? [];
    return { items, total: items.length };
  }

  @Get('hrc-tests/public')
  async getHrcTestsPublic() {
    const r = await db.execute(sql`
      SELECT * FROM hrc_iq_questions ORDER BY id ASC LIMIT 200
    `);
    const items = ((r as Rows).rows) ?? [];
    return { items, total: items.length };
  }

  @Get('hrc-tests/stats')
  async getHrcTestsStats() {
    const r1 = await db.execute(sql`
      SELECT COUNT(*)::int AS session_count,
             SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END)::int AS completed
      FROM hr_interview_sessions
    `);
    const r2 = await db.execute(sql`
      SELECT COUNT(*)::int AS result_count,
             ROUND(AVG(total_score)::numeric, 2) AS avg_score
      FROM hr_tool_test_results
    `);
    const sessions = ((r1 as Rows).rows ?? [])[0] ?? {};
    const results = ((r2 as Rows).rows ?? [])[0] ?? {};
    return { sessions, results };
  }

  @Get('360/reviewable')
  async get360Reviewable() {
    const r = await db.execute(sql`
      SELECT * FROM employee_360_assessments ORDER BY created_at DESC LIMIT 100
    `);
    const items = ((r as Rows).rows) ?? [];
    return { items, total: items.length };
  }

  private readonly BDAY_KEY = 'hr.birthday.settings';
  private readonly BDAY_DEFAULTS = { enabled: true, notifyDaysBefore: 3, message: "Bugun tug'ilgan kuningiz bilan!" };

  @Get('birthdays/settings')
  async getBirthdaySettings() {
    try {
      const r = await db.execute(sql`SELECT value FROM settings WHERE key = ${this.BDAY_KEY} LIMIT 1`);
      const row = ((r as Rows).rows ?? [])[0] as Record<string, unknown> | undefined;
      if (!row?.['value']) return this.BDAY_DEFAULTS;
      return JSON.parse(String(row['value']));
    } catch { return this.BDAY_DEFAULTS; }
  }

  @Post('birthdays/settings')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(HrBirthdaySettingsSchema))
  async saveBirthdaySettings(@Body() body: HrBirthdaySettingsDto) {
    const value = JSON.stringify(body);
    const existing = await db.execute(sql`SELECT id FROM settings WHERE key = ${this.BDAY_KEY} LIMIT 1`);
    const hasRow = ((existing as Rows).rows ?? []).length > 0;
    if (hasRow) {
      await db.execute(sql`UPDATE settings SET value = ${value}, updated_at = NOW() WHERE key = ${this.BDAY_KEY}`);
    } else {
      await db.execute(sql`INSERT INTO settings (id, key, value, updated_at) VALUES (gen_random_uuid(), ${this.BDAY_KEY}, ${value}, NOW())`);
    }
    return { ok: true, data: body };
  }

  @Get('birthdays/settings/:id')
  async getBirthdaySettingsById(@Param('id') _id: string) {
    // Birthday settings are a singleton keyed by 'hr.birthday.settings'.
    // The :id param is reserved for future per-department overrides.
    try {
      const r = await db.execute(sql`SELECT value FROM settings WHERE key = ${this.BDAY_KEY} LIMIT 1`);
      const row = ((r as Rows).rows ?? [])[0] as Record<string, unknown> | undefined;
      const data = row?.['value'] ? JSON.parse(String(row['value'])) : this.BDAY_DEFAULTS;
      return { data };
    } catch { return { data: this.BDAY_DEFAULTS }; }
  }

  @Get('ai-interview/session')
  async getAiInterviewSession() {
    const r = await db.execute(sql`
      SELECT id, candidate_id, vacancy_id, interview_type, language, current_stage, status, created_at
      FROM ai_interview_sessions ORDER BY created_at DESC LIMIT 50
    `);
    const items = ((r as { rows?: unknown[] }).rows) ?? [];
    return { items, total: items.length };
  }

  @Get('ai-interview/session/:id/review')
  async getAiInterviewSessionReview(@Param('id') id: string) {
    const r = await db.execute(sql`
      SELECT * FROM ai_interview_sessions WHERE id=${parseInt(id, 10)} LIMIT 1
    `);
    const row = ((r as { rows?: unknown[] }).rows ?? [])[0] ?? null;
    if (!row) throw new HttpException(await this.i18n.t('errors.notFound'), HttpStatus.NOT_FOUND);
    return { data: row };
  }

  @Get('documents/employee')
  async getEmployeeDocuments(@Query('employeeId') employeeId?: string, @Query('status') status?: string) {
    const r = await db.execute(sql`
      SELECT id, employee_id, document_type, doc_type, title, status, initiated_by,
             total_steps, current_step, created_at, updated_at
      FROM hr_documents
      WHERE (${employeeId ?? null}::int IS NULL OR employee_id = ${parseInt(employeeId ?? '0', 10)})
        AND (${status ?? null}::text IS NULL OR status = ${status ?? null}::text)
      ORDER BY created_at DESC
      LIMIT 200
    `);
    const items = ((r as Rows).rows) ?? [];
    return { items, total: items.length };
  }

  @Get('documents/my')
  async getMyDocuments(@CurrentUser() user: { id: number }) {
    // hr_documents.initiated_by = users.id of the requester
    const r = await db.execute(sql`
      SELECT id, employee_id, document_type, doc_type, title, status, initiated_by,
             total_steps, current_step, created_at, updated_at
      FROM hr_documents
      WHERE initiated_by = ${user?.id ?? 0}
      ORDER BY created_at DESC
      LIMIT 100
    `);
    const items = ((r as Rows).rows) ?? [];
    return { items, total: items.length };
  }

  @Get('documents/pending')
  async getPendingDocuments() {
    const r = await this.empExtSvc.getPendingDocuments();
    const items = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items, total: items.length };
  }

  @Get('employee-corp')
  async getEmployeeCorp() {
    const r = await db.execute(sql`
      SELECT * FROM employee_career_profiles ORDER BY created_at DESC
    `);
    const items = ((r as Rows).rows) ?? [];
    return { items, total: items.length };
  }

  @Get('employees/operator-stats')
  async getEmployeeOperatorStats() {
    const r = await this.svc.getDailyReportsStats();
    const stats = r.ok && r.data ? r.data : { total: 0, approved: 0, pending: 0, today: 0 };
    return { operatorStats: { submitted: stats.today, total: stats.total, percentage: stats.total > 0 ? Math.round(stats.today / stats.total * 100) : 0 } };
  }

  @Get('enps/surveys/results')
  async getEnpsSurveyResults() {
    const r = await db.execute(sql`
      SELECT s.*, COUNT(r.id)::int AS response_count,
             ROUND(AVG(r.score)::numeric, 2) AS avg_score
      FROM enps_surveys s
      LEFT JOIN enps_survey_responses r ON r.survey_id = s.id
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `);
    const items = ((r as Rows).rows) ?? [];
    return { items, total: items.length };
  }

  @Get('abc-analysis/:id/calculate')
  async calculateAbcAnalysis(@Param('id') id: string) {
    const all = unwrapOrDefault(await this.svc.getAbcAnalysis(), []);
    const items = Array.isArray(all) ? all as Record<string,unknown>[] : [];
    const found = items.find(a => String(a['userId'] ?? a['user_id']) === id);
    if (!found) throw new HttpException(await this.i18n.t('errors.notFound'), HttpStatus.NOT_FOUND);
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

  @Get('employee-corp/:id')
  async getEmployeeCorpById(@Param('id') id: string) {
    const r = await db.execute(sql`
      SELECT * FROM employee_career_profiles
      WHERE employee_id = ${parseInt(id, 10)}
      LIMIT 1
    `);
    const row = ((r as Rows).rows ?? [])[0] ?? null;
    if (!row) throw new HttpException(await this.i18n.t('errors.notFound'), HttpStatus.NOT_FOUND);
    return { data: row };
  }

  // P3.14: FE MentorCard (AdaptationTab.tsx) also PATCHes `professional_master_id`
  // (90-day professional master) — was previously silently dropped (no column in COALESCE list).
  @Patch('adaptation/:id')
  async updateAdaptation(@Param('id') id: string, @Body() body: unknown) {
    const dto = (body ?? {}) as Record<string, unknown>;
    const r = await db.execute(sql`
      UPDATE adaptation_records SET
        mentor_id               = COALESCE(${dto['mentor_id']               ?? null}::int, mentor_id),
        professional_master_id  = COALESCE(${dto['professional_master_id']  ?? null}::int, professional_master_id),
        status                  = COALESCE(${dto['status']                  ?? null}::text, status),
        current_phase           = COALESCE(${dto['current_phase']           ?? null}::text, current_phase),
        hr_notes                = COALESCE(${dto['hr_notes']                ?? null}::text, hr_notes),
        notes                   = COALESCE(${dto['notes']                   ?? null}::text, notes),
        updated_at              = NOW()
      WHERE id = ${parseInt(id, 10)} AND deleted_at IS NULL
      RETURNING id
    `);
    const row = ((r as Rows).rows ?? [])[0] ?? null;
    if (!row) throw new HttpException(await this.i18n.t('errors.notFound'), HttpStatus.NOT_FOUND);
    return { id, updated: true };
  }

  @Patch('ai-interview/session/:id/review')
  async reviewAiInterviewSession(@Param('id') id: string, @Body() body: unknown) {
    const dto = (body ?? {}) as Record<string, unknown>;
    await db.execute(sql`
      UPDATE ai_interview_sessions SET
        evaluation = COALESCE(${dto['evaluation'] != null ? JSON.stringify(dto['evaluation']) : null}::jsonb, evaluation),
        status     = COALESCE(${'reviewed'}::text, status)
      WHERE id = ${parseInt(id, 10)}
    `);
    return { id, reviewed: true, recruiter_notes: dto['recruiter_notes'] ?? null, recommendation: dto['recommendation'] ?? null };
  }
}
