/**
 * @module hr-compat-a.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import {
  safeInt } from '../common/db-rows';import {  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';

import { I18nService } from 'nestjs-i18n';
import { throwFromError, unwrapOrThrow, assertOk, unwrapOrInternal, unwrapOrDefault } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { HrCompatAService } from '../application/hr-compat-a.service';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { z } from 'zod';
import { notImplemented } from '@common/exceptions/not-implemented';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
type Rows = { rows?: unknown[] };
interface AuthenticatedUser { id: number; sub?: number; }
import {
  Hr360ReviewSchema, Hr360ReviewDto,
  HrConflictReportSchema, HrConflictReportDto,
  HrEmployeeSkillSchema, HrEmployeeSkillDto,
  HrHealthCheckupSchema, HrHealthCheckupDto,
  HrDisciplineRecordSchema, HrDisciplineRecordDto,
} from './dto/hr.dto';

const TestQuestionUpdateSchema = z.object({
  question: z.string().max(2000).optional(),
  category: z.string().max(100).optional(),
  weight: z.number().optional(),
  answers: z.array(z.record(z.unknown())).optional(),
}).passthrough();

const HrcSessionSchema = z.object({
  employeeId: z.union([z.string(), z.number()]).optional(),
  testType: z.string().max(100).optional(),
  startedAt: z.string().optional(),
}).passthrough();

const HrcQuestionSchema = z.object({
  question: z.string().max(2000).optional(),
  category: z.string().max(100).optional(),
  weight: z.number().optional(),
  answers: z.array(z.record(z.unknown())).optional(),
}).passthrough();

const HR_ROLES = ['HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR', 'ADMIN', 'MANAGER'] as const;

@ApiThrottle()
@Controller('hr')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...HR_ROLES)
export class HrCompatAController {
  constructor(
    private readonly svc: HrCompatAService,
    private readonly i18n: I18nService,
  ) {}

  @Get('360/review')
  async get360Reviews(@Query('employeeId') employeeId?: string) {
    return unwrapOrDefault(await this.svc.get360Reviews(employeeId), []);
  }

  @Post('360/review')
  @UsePipes(new ZodValidationPipe(Hr360ReviewSchema))
  async create360Review(@Body() body: Hr360ReviewDto) {
    const { employee_id, assessment_period, assessment_year, self_rating, manager_rating, peer_rating } = body;
    const avg = (safeInt(self_rating, 0) + safeInt(manager_rating, 0) + safeInt(peer_rating, 0)) / 3;
    const _rCreate360Review = await this.svc.create360Review(
      employee_id, assessment_period,
      safeInt(assessment_year, _time.now().getFullYear()),
      self_rating, manager_rating, peer_rating, avg,
    );
    assertOk(_rCreate360Review);
    return _rCreate360Review.data;
  }

  @Get('360/dept-summary')
  async get360DeptSummary(@Query('departmentId') departmentId?: string) {
    const r = await this.svc.get360DeptSummary(departmentId);
    return r.ok && r.data ? r.data : {};
  }

  @Get('conflict-reports')
  async getConflictReports(@Query('status') status?: string) {
    return unwrapOrDefault(await this.svc.getConflictReports(status), []);
  }

  @Post('conflict-reports')
  @UsePipes(new ZodValidationPipe(HrConflictReportSchema))
  async createConflictReport(@Body() body: HrConflictReportDto) {
    const { party1, party2, description, severity } = body;
    return unwrapOrThrow(await this.svc.createConflictReport(party1, party2, description, severity));
  }

  @Get('employee-skills')
  async getEmployeeSkills(@Query('employeeId') employeeId?: string) {
    return unwrapOrDefault(await this.svc.getEmployeeSkills(employeeId), []);
  }

  @Post('employee-skills')
  @UsePipes(new ZodValidationPipe(HrEmployeeSkillSchema))
  async createEmployeeSkill(@Body() body: HrEmployeeSkillDto) {
    const { employee_id, skill_name, proficiency_level, proficiency_score, certified_date } = body;
    return unwrapOrThrow(await this.svc.createEmployeeSkill(employee_id, skill_name, proficiency_level, proficiency_score, certified_date));
  }

  @Get('employee-skills/:employeeId')
  async getEmployeeSkillsById(@Param('employeeId') employeeId: string) {
    const r = await this.svc.getEmployeeSkillsById(safeInt(employeeId, 0));
    return r.ok && r.data ? r.data : [];
  }

  @Get('health-checkups')
  async getHealthCheckups(@Query('departmentId') departmentId?: string) {
    return unwrapOrDefault(await this.svc.getHealthCheckups(departmentId), []);
  }

  @Post('health-checkups')
  // P1.21.1/P1.21.2: accept camelCase from FE; all FE fields mapped; department_id optional
  async createHealthCheckup(@Body() body: unknown) {
    const HealthCheckupFlexSchema = z.object({
      department_id:      z.number().int().positive().optional(),
      departmentId:       z.union([z.string(), z.number()]).optional(),
      department_name:    z.string().min(1).max(200).optional(),
      departmentName:     z.string().min(1).max(200).optional(),
      total_employees:    z.number().int().min(0).optional(),
      totalEmployees:     z.union([z.string(), z.number()]).optional(),
      examined_count:     z.number().int().min(0).optional(),
      examinedCount:      z.union([z.string(), z.number()]).optional(),
      last_checkup_date:  z.string().optional(),
      checkupDate:        z.string().optional(),
      next_checkup_date:  z.string().optional(),
      nextCheckupDate:    z.string().optional(),
      // FE fields from HRHealthMonitoring dialog
      checkupType:        z.string().optional(),
      checkType:          z.string().optional(),
      notes:              z.string().optional(),
      status:             z.string().optional(),
    }).passthrough();
    const dto = HealthCheckupFlexSchema.parse(body ?? {});
    const deptId       = dto.department_id ?? (dto.departmentId ? Number(dto.departmentId) : null);
    const deptName     = dto.department_name ?? dto.departmentName ?? null;
    const totalEmp     = dto.total_employees ?? (dto.totalEmployees != null ? Number(dto.totalEmployees) : 0);
    const examined     = dto.examined_count  ?? (dto.examinedCount  != null ? Number(dto.examinedCount)  : 0);
    const lastDate     = dto.last_checkup_date ?? dto.checkupDate ?? null;
    const nextDate     = dto.next_checkup_date ?? dto.nextCheckupDate ?? null;
    // P1.21.2: pass FE dialog fields through
    const checkupType  = dto.checkupType ?? dto.checkType ?? null;
    const notes        = dto.notes ?? null;
    const status       = dto.status ?? null;
    return unwrapOrThrow(await this.svc.createHealthCheckup(
      deptId, deptName, totalEmp, examined, lastDate, nextDate, checkupType, notes, status,
    ));
  }

  @Get('hrc-tests/sessions')
  async getHrcTestSessions() {
    return unwrapOrDefault(await this.svc.getHrcTestSessions(), []);
  }

  @Get('hrc-tests/tool-test/questions')
  async getHrcTestQuestions(@Query('category') category?: string) {
    return unwrapOrDefault(await this.svc.getHrcTestQuestions(category), []);
  }

  @Get('recruitment/vacancy/candidates')
  async getRecruitmentVacancyCandidates(@Query('vacancyId') vacancyId?: string) {
    return unwrapOrDefault(await this.svc.getVacancyCandidates(vacancyId), []);
  }

  @Get('discipline')
  // P1.19.1: DB returns employee_name; FE expects full_name + department
  async getDiscipline(@Query('employeeId') employeeId?: string) {
    const r = await this.svc.getDiscipline(employeeId);
    const rows = (r.ok && Array.isArray(r.data) ? r.data : []) as Record<string, unknown>[];
    return rows.map((row) => ({
      ...row,
      full_name:  row['full_name']  ?? row['employee_name'] ?? '',
      department: row['department'] ?? row['department_name'] ?? '',
    }));
  }

  @Post('discipline-records')
  @UsePipes(new ZodValidationPipe(HrDisciplineRecordSchema))
  // HR Nazorat fix (2026-07-13, verified live: POST /api/hr/discipline-records — the
  // real "Intizom" page create flow, Discipline.tsx — ALWAYS 500'd): discipline_records
  // .reason and .given_by are NOT NULL at the live DB with no default (see
  // fix-discipline-schema.sql), but this Drizzle insert never wrote either column —
  // confirmed via direct psql insert reproducing the exact NOT NULL violation. Wires
  // the authenticated HR user as given_by/issued_by and the description as reason
  // (mirrors the pattern already used in discipline-records-compat.service.ts).
  async createDisciplineRecord(@Body() body: HrDisciplineRecordDto, @CurrentUser() user: AuthenticatedUser) {
    const { employee_id, violation_type, discipline_type, severity, violation_date, description, fine_amount } = body;
    const issuedBy = user?.id ?? user?.sub ?? null;
    return unwrapOrThrow(await this.svc.createDisciplineRecord(employee_id, violation_type, discipline_type, severity, violation_date, description, fine_amount, issuedBy));
  }

  @Get('vacancies')
  async getVacancies(@Query('status') status?: string, @Query('isActive') isActiveRaw?: string) {
    const isActive = isActiveRaw === 'true' ? true : isActiveRaw === 'false' ? false : undefined;
    const result = await this.svc.getVacancies(status, isActive);
    const data = result.ok ? (result.data ?? []) : [];
    return { data, total: data.length };
  }

  @Get('departments')
  async getDepartments(@Query('isActive') isActiveRaw?: string) {
    const isActive = isActiveRaw === 'true' ? true : isActiveRaw === 'false' ? false : undefined;
    const result = await this.svc.getDepartments(isActive);
    const data = result.ok ? (result.data ?? []) : [];
    return { data, total: data.length };
  }

  @Get('positions')
  async getPositions(@Query('departmentId') deptIdRaw?: string, @Query('isActive') isActiveRaw?: string) {
    const departmentId = deptIdRaw ? parseInt(deptIdRaw, 10) || undefined : undefined;
    const isActive = isActiveRaw === 'true' ? true : isActiveRaw === 'false' ? false : undefined;
    const result = await this.svc.getPositions(departmentId, isActive);
    const data = result.ok ? (result.data ?? []) : [];
    return { data, total: data.length };
  }

  @Get('payroll-runs')
  async getPayrollRuns(@Query('period') period?: string) {
    return unwrapOrThrow(await this.svc.getPayrollRuns(period));
  }

  @Get('payroll-periods')
  async getPayrollPeriods() {
    return unwrapOrThrow(await this.svc.getPayrollPeriods());
  }

  @Patch('hrc-tests/tool-test/questions/:id')
  async updateTestQuestion(@Param('id') id: string, @Body() body: unknown) {
    const dto = TestQuestionUpdateSchema.parse(body);
    await db.execute(sql`
      UPDATE test_questions SET
        question_text = COALESCE(${dto.question ?? null}, question_text),
        question_type = COALESCE(${dto.category ?? null}, question_type),
        weight        = COALESCE(${dto.weight  ?? null}, weight)
      WHERE id=${parseInt(id, 10)}
    `);
    return { id, updated: true };
  }

  @Delete('hrc-tests/tool-test/questions/:id')
  @HttpCode(HttpStatus.OK)
  async deleteTestQuestion(@Param('id') id: string) {
    await db.execute(sql`DELETE FROM test_questions WHERE id=${parseInt(id, 10)}`);
    return { id, deleted: true };
  }

  @Get('hrc-tests/employee/:employeeId/results')
  async getEmployeeTestResults(@Param('employeeId') employeeId: string) {
    const r = await db.execute(sql`
      SELECT * FROM hr_tool_test_results
      WHERE candidate_id = ${safeInt(employeeId, 0)}
      ORDER BY test_date DESC
    `);
    const items = ((r as Rows).rows) ?? [];
    return { items, total: items.length };
  }

  @Delete('employee-skills/:id')
  @HttpCode(HttpStatus.OK)
  async deleteEmployeeSkill(@Param('id', ParseIntPipe) id: number) {
    const r = await this.svc.deleteEmployeeSkill(id);
    if (!r.ok) throw new NotFoundException(await this.i18n.t('errors.skillNotFoundWithId', { args: { id } }));
    return r.data;
  }

  // ─── Skills Catalog: GET/POST/PATCH/DELETE /hr/skills ────────────────────────

  @Get('skills')
  async getSkillsCatalog() {
    return unwrapOrDefault(await this.svc.getSkillsCatalog(), { items: [], total: 0 });
  }

  @Post('skills')
  async createSkill(@Body() body: unknown) {
    const CreateSkillSchema = z.object({
      code:        z.string().min(1).max(50),
      name:        z.string().min(1).max(200),
      nameRu:      z.string().optional(),
      category:    z.string().optional(),
      description: z.string().optional(),
    });
    const dto = CreateSkillSchema.parse(body);
    return unwrapOrInternal(await this.svc.createSkillCatalog(dto));
  }

  @Patch('skills/:id')
  async updateSkill(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const UpdateSkillSchema = z.object({
      name:        z.string().min(1).max(200).optional(),
      nameRu:      z.string().optional(),
      category:    z.string().optional(),
      description: z.string().optional(),
    });
    const dto = UpdateSkillSchema.parse(body);
    return unwrapOrInternal(await this.svc.updateSkillCatalog(id, dto));
  }

  @Delete('skills/:id')
  @HttpCode(HttpStatus.OK)
  async deleteSkill(@Param('id', ParseIntPipe) id: number) {
    const r = await this.svc.deleteSkillCatalog(id);
    if (!r.ok) throw new NotFoundException(await this.i18n.t('errors.skillNotFoundWithId', { args: { id } }));
    return r.data;
  }

  @Post('hrc-tests/sessions')
  async createHrcTestSession(@Body() body: unknown) {
    const dto = HrcSessionSchema.parse(body);
    const candidateId = dto.employeeId ? safeInt(String(dto.employeeId), 0) : null;
    const r = await db.execute(sql`
      INSERT INTO hr_interview_sessions (candidate_id, candidate_name, session_type, status, created_at)
      VALUES (
        ${candidateId},
        ${dto.testType ?? null},
        ${dto.testType ?? 'hrc'},
        'pending',
        NOW()
      ) RETURNING *
    `);
    const row = ((r as Rows).rows ?? [])[0] ?? {};
    return { data: row };
  }

  @Post('hrc-tests/tool-test/questions')
  @HttpCode(HttpStatus.CREATED)
  async createHrcTestQuestion(@Body() body: unknown) {
    const dto = HrcQuestionSchema.parse(body);
    const r = await db.execute(sql`
      INSERT INTO test_questions
        (test_id, question_text, question_type, options, weight, sort_order, created_at)
      VALUES
        (0, ${dto.question ?? ''}, ${dto.category ?? 'text'},
         ${dto.answers ? JSON.stringify(dto.answers) : '[]'}::jsonb,
         ${dto.weight ?? 1}, 0, NOW())
      RETURNING *
    `);
    const row = ((r as Rows).rows ?? [])[0] ?? {};
    return { data: row };
  }
}
