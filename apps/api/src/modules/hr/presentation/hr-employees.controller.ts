/**
 * @module hr-employees.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { assertFound } from '@common/assertions';
import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, NotFoundException,
  Param, ParseIntPipe, Patch, Post, Put,
  Query, UseGuards, UseInterceptors, InternalServerErrorException, UsePipes,
} from '@nestjs/common';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
type Rows = { rows?: unknown[] };
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { assertOk, throwFromError, unwrapOrThrow, unwrapOrDefault } from '@common/http-result';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { HR_REPO, IHrRepo } from '../domain/repositories/i-hr.repo';
import { GetEmployeesQuery } from '../application/queries/get-employees.query';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {
  HrCreateEmployeeSchema, HrCreateEmployeeDto,
  HrUpdateEmployeeSchema, HrUpdateEmployeeDto,
  HrUpdateEmployeeStatusSchema, HrUpdateEmployeeStatusDto,
  HrReviewSalarySchema, HrReviewSalaryDto,
} from './dto/hr.dto';
import { HrRatingReader } from '../infrastructure/repositories/hr-rating.reader';
import { HrRatingService } from '../domain/services/hr-rating.service';
import { AppErr } from '@common/result';

interface AuthenticatedUser { id: number; role: string; }

@ApiThrottle()
@ApiTags('Hr Employees')
@Controller('hr/employees')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles('HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR')
export class HrEmployeesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    @Inject(HR_REPO) private readonly hrRepo: IHrRepo,
    private readonly hrRatingReader: HrRatingReader,
    private readonly hrRatingService: HrRatingService,
  ) {}

  @ApiOperation({ summary: 'Get employees' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  @Roles('HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR')
  async getEmployees(@Query() query: { status?: string; department?: string; departmentId?: string; search?: string; page?: string; limit?: string }) {
    const res = await this.queryBus.execute(
      new GetEmployeesQuery({
        // P1.6.4: pass all filter params to enable BE-side filtering
        department:   query.department ?? query.departmentId,
        departmentId: query.departmentId,
        status:       query.status,
        search:       query.search,
        page:         parseInt(query.page  ?? '1',  10),
        limit:        parseInt(query.limit ?? '20', 10),
      }),
    );
    return unwrapOrDefault(res, { items: [], total: 0 });
  }

  @ApiOperation({ summary: 'Get employee' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id')
  @Roles('HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR')
  async getEmployee(@Param('id') id: string) {
    const result = await this.hrRepo.findEmployeeById(id);
    assertOk(result);
    assertFound(result.data, `Xodim #${id} topilmadi`);
    return result.data;
  }

  /**
   * GET /hr/employees/:id/rating
   *
   * Computes the 7-factor composite rating for an employee from REAL DB data.
   * Missing factor data → neutral default (documented in HrRatingReader).
   *
   * @returns { score, label, breakdown, appliedWeights, meta }
   *   score          — 0-100 composite (drives pay-queue ordering)
   *   label          — 'excellent'|'good'|'average'|'poor'
   *   breakdown      — per-factor weighted contribution
   *   appliedWeights — weight map used (default HR_RATING_WEIGHTS)
   *   meta           — per-factor source + isDefault flag for UI transparency
   */
  @ApiOperation({ summary: 'Compute 7-factor employee rating from real DB data' })
  @ApiResponse({ status: 200, description: 'OK — composite rating score + breakdown' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  @ApiResponse({ status: 500, description: 'Internal error reading factors' })
  @Get(':id/rating')
  @Roles('HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  async getEmployeeRating(@Param('id', ParseIntPipe) id: number) {
    // 1. Verify employee exists (404 guard)
    const empResult = await this.hrRepo.findEmployeeById(String(id));
    assertOk(empResult);
    assertFound(empResult.data, `Xodim #${id} topilmadi`);

    // 2. Read all 7 factors from existing DB tables
    const readerResult = await this.hrRatingReader.readFactors(id);
    if (!readerResult.ok) {
      throwFromError(AppErr('INTERNAL', `Rating factor read failed: ${readerResult.error.message}`));
    }
    const { factors, meta } = readerResult.data!;

    // 3. Compute composite score (pure domain service — no DB access)
    const ratingResult = this.hrRatingService.computeRating(factors);
    if (!ratingResult.ok) {
      throwFromError(AppErr('VALIDATION', `Rating computation failed: ${ratingResult.error.message}`));
    }

    const { score, label, breakdown, appliedWeights } = ratingResult.data!;

    return { score, label, breakdown, appliedWeights, meta };
  }

  @ApiOperation({ summary: 'Get employee kpi' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':employeeId/kpi')
  @Roles('HR_SPECIALIST', 'HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR')
  async getEmployeeKpi(@Param('employeeId') employeeId: string) {
    const period = _time.now().toISOString().slice(0, 7);
    const [attendanceResult, leaveBalance] = await Promise.all([
      this.hrRepo.getAttendanceStats(employeeId, period),
      this.hrRepo.getLeaveBalance(employeeId),
    ]);
    return {
      employeeId,
      period,
      attendance:   attendanceResult?.ok ? (attendanceResult).data : {},
      leaveBalance: leaveBalance.ok ? leaveBalance.data : null,
    };
  }

  @ApiOperation({ summary: 'Create employee' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  @Roles('HR_MANAGER', 'SUPER_ADMIN')
  @UsePipes(new ZodValidationPipe(HrCreateEmployeeSchema))
  async createEmployee(@Body() body: HrCreateEmployeeDto, @CurrentUser() _user: AuthenticatedUser) {
    const result = await this.hrRepo.saveEmployee({
      ...body,
      employeeCode: body.employeeCode ?? `EMP-${Date.now()}`,
      createdAt:    _time.now(),
      updatedAt:    _time.now(),
    });
    assertOk(result);
    return result.data;
  }

  @ApiOperation({ summary: 'Update employee' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Put(':id')
  @Patch(':id')
  @Roles('HR_MANAGER', 'SUPER_ADMIN')
  @UsePipes(new ZodValidationPipe(HrUpdateEmployeeSchema))
  async updateEmployee(@Param('id') id: string, @Body() body: HrUpdateEmployeeDto) {
    return unwrapOrThrow(await this.hrRepo.updateEmployee(id, body));
  }

  @ApiOperation({ summary: 'Update employee status' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Patch(':id/status')
  @Roles('HR_MANAGER', 'DIRECTOR', 'SUPER_ADMIN')
  @UsePipes(new ZodValidationPipe(HrUpdateEmployeeStatusSchema))
  async updateEmployeeStatus(
    @Param('id') id: string,
    @Body() body: HrUpdateEmployeeStatusDto,
  ) {
    const result = await this.hrRepo.updateEmployee(id, { status: body.status, employmentStatus: body.status });
    assertOk(result);
    return { message: `Xodim holati ${body.status} ga o'zgartirildi`, data: result.data };
  }

  @ApiOperation({ summary: 'Soft-delete employee (sets status=terminated, deleted_at=now)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('HR_MANAGER', 'SUPER_ADMIN')
  async deleteEmployee(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const existing = await this.hrRepo.findEmployeeById(String(id));
    assertOk(existing);
    if (!existing.data) throw new NotFoundException(`Xodim #${id} topilmadi`);
    const result = await this.hrRepo.updateEmployee(String(id), {
      status:           'terminated',
      employment_status: 'terminated',
      deleted_at:       _time.now().toISOString(),
    });
    assertOk(result);
    return { success: true, message: "Xodim o'chirildi", deletedBy: user?.id ?? null };
  }

  @ApiOperation({ summary: 'Get employee documents' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get(':employeeId/documents')
  @Roles('HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR')
  async getEmployeeDocuments(@Param('employeeId') employeeId: string) {
    const r = await db.execute(sql`
      SELECT * FROM hr_documents WHERE employee_id = ${parseInt(employeeId, 10)} ORDER BY id DESC
    `);
    const items = ((r as Rows).rows) ?? [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Create employee document' })
  @ApiResponse({ status: 201, description: 'OK' })
  @Post(':employeeId/documents')
  @HttpCode(HttpStatus.CREATED)
  @Roles('HR_MANAGER', 'SUPER_ADMIN')
  async createEmployeeDocument(@Param('employeeId') employeeId: string, @Body() body: unknown) {
    const dto = (body ?? {}) as Record<string, unknown>;
    const r = await db.execute(sql`
      INSERT INTO hr_documents (employee_id, document_type, doc_type, title, doc_number, status, content, pdf_url)
      VALUES (
        ${parseInt(employeeId, 10)},
        ${dto['document_type'] ?? dto['documentType'] ?? dto['doc_type'] ?? null}::text,
        ${dto['doc_type'] ?? dto['docType'] ?? null}::text,
        ${dto['title'] ?? null}::text,
        ${dto['doc_number'] ?? dto['docNumber'] ?? null}::text,
        ${dto['status'] ?? 'pending'}::text,
        ${dto['content'] ?? null}::text,
        ${dto['pdf_url'] ?? dto['pdfUrl'] ?? null}::text
      )
      RETURNING id, title
    `);
    const row = ((r as Rows).rows ?? [])[0] ?? null;
    return { message: "Hujjat yaratildi", data: row };
  }

  @ApiOperation({ summary: 'Delete employee document' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Delete(':employeeId/documents/:docId')
  @HttpCode(HttpStatus.OK)
  @Roles('HR_MANAGER', 'SUPER_ADMIN')
  async deleteEmployeeDocument(@Param('employeeId') _id: string, @Param('docId') docId: string) {
    await db.execute(sql`DELETE FROM hr_documents WHERE id = ${parseInt(docId, 10)}`);
    return { deleted: true, id: docId };
  }

  @ApiOperation({ summary: 'Review salary' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post(':employeeId/salary-review')
  @Roles('DIRECTOR', 'SUPER_ADMIN')
  @UsePipes(new ZodValidationPipe(HrReviewSalarySchema))
  async reviewSalary(
    @Param('employeeId') employeeId: string,
    @Body() body: HrReviewSalaryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    // 1. Read current employee to get existing base_salary
    const empResult = await this.hrRepo.findEmployeeById(employeeId);
    assertOk(empResult);
    const emp = empResult.data;

    const currentSalary = emp ? Number(emp['base_salary'] ?? 0) : 0;
    const newSalary      = currentSalary + body.proposedIncrease;
    const today          = _time.now().toISOString().split('T')[0];

    // P1.6.3: wrap UPDATE employees + INSERT salary_change_log in a single transaction
    const txResult = await this.hrRepo.reviewSalaryTransactional(parseInt(employeeId, 10), newSalary, today);
    assertOk(txResult);

    return {
      message:          "Maosh muvaffaqiyatli yangilandi",
      employeeId,
      previousSalary:   currentSalary,
      newSalary,
      proposedIncrease: body.proposedIncrease,
      reason:           body.reason ?? null,
      reviewedBy:       user?.id ?? null,
      reviewedAt:       _time.now().toISOString(),
    };
  }
}
