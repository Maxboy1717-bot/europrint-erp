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
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';

// P3-26: HRC test/employee-skill mutation endpoints aren't yet wired.
const notImplemented = (route: string): never => {
  throw new HttpException(
    { message: `Endpoint not yet implemented: ${route}`, code: 'NOT_IMPLEMENTED' },
    HttpStatus.NOT_IMPLEMENTED,
  );
};
import { throwFromError, unwrapOrThrow, assertOk, unwrapOrInternal } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { HrCompatAService } from '../application/hr-compat-a.service';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { z } from 'zod';
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
  constructor(private readonly svc: HrCompatAService) {}

  @Get('360/review')
  async get360Reviews(@Query('employeeId') employeeId?: string) {
    return unwrapOrInternal(await this.svc.get360Reviews(employeeId));
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
    return unwrapOrInternal(await this.svc.get360DeptSummary(departmentId));
  }

  @Get('conflict-reports')
  async getConflictReports(@Query('status') status?: string) {
    return unwrapOrInternal(await this.svc.getConflictReports(status));
  }

  @Post('conflict-reports')
  @UsePipes(new ZodValidationPipe(HrConflictReportSchema))
  async createConflictReport(@Body() body: HrConflictReportDto) {
    const { party1, party2, description, severity } = body;
    return unwrapOrThrow(await this.svc.createConflictReport(party1, party2, description, severity));
  }

  @Get('employee-skills')
  async getEmployeeSkills(@Query('employeeId') employeeId?: string) {
    return unwrapOrInternal(await this.svc.getEmployeeSkills(employeeId));
  }

  @Post('employee-skills')
  @UsePipes(new ZodValidationPipe(HrEmployeeSkillSchema))
  async createEmployeeSkill(@Body() body: HrEmployeeSkillDto) {
    const { employee_id, skill_name, proficiency_level, proficiency_score, certified_date } = body;
    return unwrapOrThrow(await this.svc.createEmployeeSkill(employee_id, skill_name, proficiency_level, proficiency_score, certified_date));
  }

  @Get('employee-skills/:employeeId')
  async getEmployeeSkillsById(@Param('employeeId') employeeId: string) {
    return unwrapOrInternal(await this.svc.getEmployeeSkillsById(safeInt(employeeId, 0)));
  }

  @Get('health-checkups')
  async getHealthCheckups(@Query('departmentId') departmentId?: string) {
    return unwrapOrInternal(await this.svc.getHealthCheckups(departmentId));
  }

  @Post('health-checkups')
  @UsePipes(new ZodValidationPipe(HrHealthCheckupSchema))
  async createHealthCheckup(@Body() body: HrHealthCheckupDto) {
    const { department_id, department_name, total_employees, examined_count, last_checkup_date, next_checkup_date } = body;
    return unwrapOrThrow(await this.svc.createHealthCheckup(department_id, department_name, total_employees, examined_count, last_checkup_date, next_checkup_date));
  }

  @Get('hrc-tests/sessions')
  async getHrcTestSessions() {
    return unwrapOrInternal(await this.svc.getHrcTestSessions());
  }

  @Get('hrc-tests/tool-test/questions')
  async getHrcTestQuestions(@Query('category') category?: string) {
    return unwrapOrInternal(await this.svc.getHrcTestQuestions(category));
  }

  @Get('recruitment/vacancy/candidates')
  async getRecruitmentVacancyCandidates(@Query('vacancyId') vacancyId?: string) {
    return unwrapOrInternal(await this.svc.getVacancyCandidates(vacancyId));
  }

  @Get('discipline')
  async getDiscipline(@Query('employeeId') employeeId?: string) {
    return unwrapOrInternal(await this.svc.getDiscipline(employeeId));
  }

  @Post('discipline-records')
  @UsePipes(new ZodValidationPipe(HrDisciplineRecordSchema))
  async createDisciplineRecord(@Body() body: HrDisciplineRecordDto) {
    const { employee_id, violation_type, discipline_type, severity, violation_date, description, fine_amount } = body;
    return unwrapOrThrow(await this.svc.createDisciplineRecord(employee_id, violation_type, discipline_type, severity, violation_date, description, fine_amount));
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
  async updateTestQuestion(@Param('id') _id: string, @Body() body: unknown) {
    TestQuestionUpdateSchema.parse(body);
    return notImplemented('PATCH /hr/hrc-tests/tool-test/questions/:id');
  }

  @Delete('hrc-tests/tool-test/questions/:id')
  async deleteTestQuestion(@Param('id') _id: string) {
    return notImplemented('DELETE /hr/hrc-tests/tool-test/questions/:id');
  }

  @Get('hrc-tests/employee/:employeeId/results')
  async getEmployeeTestResults(@Param('employeeId') _employeeId: string) {
    return notImplemented('GET /hr/hrc-tests/employee/:employeeId/results');
  }

  @Delete('employee-skills/:id')
  async deleteEmployeeSkill(@Param('id') _id: string) {
    return notImplemented('DELETE /hr/employee-skills/:id');
  }

  @Post('hrc-tests/sessions')
  async createHrcTestSession(@Body() body: unknown) {
    HrcSessionSchema.parse(body);
    return notImplemented('POST /hr/hrc-tests/sessions');
  }

  @Post('hrc-tests/tool-test/questions')
  async createHrcTestQuestion(@Body() body: unknown) {
    HrcQuestionSchema.parse(body);
    return notImplemented('POST /hr/hrc-tests/tool-test/questions');
  }
}
