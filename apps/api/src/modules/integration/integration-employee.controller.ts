/**
 * @module integration-employee.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, Post, Body, Param, Query, UseGuards, UseInterceptors, HttpCode, HttpStatus } from '@nestjs/common';
import { notImplemented } from '@common/exceptions/not-implemented';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { z } from 'zod';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { IntegrationEmployeeService } from './integration-employee.service';

type Rows = { rows?: unknown[] };

const ExpenseSchema = z.object({
  employeeId: z.union([z.string(), z.number()]).optional(),
  amount: z.union([z.string(), z.number()]).optional(),
  category: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
  date: z.string().optional(),
}).passthrough();

const InvoiceSchema = z.object({
  customerId: z.union([z.string(), z.number()]).optional(),
  amount: z.union([z.string(), z.number()]).optional(),
  dueDate: z.string().optional(),
  description: z.string().max(2000).optional(),
}).passthrough();

const HR_ROLES = ['admin', 'super_admin', 'hr_manager', 'hr', 'manager', 'director', 'employee'] as const;

@ApiThrottle()
@ApiTags('Integration Employee')
@ApiBearerAuth()
@Controller('integration')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...HR_ROLES)
export class IntegrationEmployeeController {
  constructor(private readonly svc: IntegrationEmployeeService) {}

  @ApiOperation({ summary: 'Get complaints' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('employee-complaints/:id')
  async getComplaints(@Param('id') id: string) {
    const r = await this.svc.getEmployeeComplaints(id);
    return r.ok ? r.data : { complaints: [] };
  }

  @ApiOperation({ summary: 'Get assessment skips' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('employee-assessment-skips/:id')
  async getAssessmentSkips(@Param('id') id: string) {
    const r = await this.svc.getEmployeeAssessmentSkips(id);
    return r.ok ? r.data : { skips: [] };
  }

  @ApiOperation({ summary: 'Get swap requests' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('swap-requests')
  async getSwapRequests(
    @Query('requestedBy') requestedBy?: string,
    @Query('status') status?: string,
  ) {
    const r = await this.svc.getSwapRequests(requestedBy, status);
    return r.ok ? r.data : [];
  }

  @ApiOperation({ summary: 'Get skill gap' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('skill-gap/:id')
  async getSkillGap(@Param('id') id: string) {
    const r = await this.svc.getSkillGap(id);
    return r.ok ? r.data : { employeeId: id, skills: [] };
  }

  @ApiOperation({ summary: 'Get mentorships' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('employee-mentorships/:id')
  async getMentorships(@Param('id') id: string) {
    const r = await this.svc.getEmployeeMentorships(id);
    return r.ok ? r.data : { asMentor: [], asMentee: [] };
  }

  @ApiOperation({ summary: 'Get mes summary' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('employee-mes-summary/:id')
  async getMesSummary(
    @Param('id') id: string,
    @Query('months') months?: string,
  ) {
    const r = await this.svc.getEmployeeMesSummary(id, months ? parseInt(months, 10) : 3);
    return r.ok ? r.data : { employeeId: id, months: 3, totalProduced: 0, records: [] };
  }

  @ApiOperation({ summary: 'Get wms summary' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('employee-wms-summary/:id')
  async getWmsSummary(@Param('id') id: string) {
    const r = await this.svc.getEmployeeWmsSummary(id);
    return r.ok ? r.data : { employeeId: id, totalOperations: 0, transactions: [] };
  }

  @ApiOperation({ summary: 'Get employee complaints list' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Get('employee-complaints')
  async getEmployeeComplaintsList() {
    const r = await this.svc.getAllComplaints();
    return r.ok ? r.data : { complaints: [] };
  }

  @ApiOperation({ summary: 'Get employee assessment skips list' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Get('employee-assessment-skips')
  async getEmployeeAssessmentSkipsList() {
    const r = await this.svc.getAllAssessmentSkips();
    return r.ok ? r.data : { skips: [] };
  }

  @ApiOperation({ summary: 'Get skill gap list' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Get('skill-gap')
  async getSkillGapList() {
    return notImplemented('GET /integration/skill-gap');
  }

  @ApiOperation({ summary: 'Get employee mentorships list' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Get('employee-mentorships')
  async getEmployeeMentorshipsList() {
    const r = await this.svc.getAllMentorships();
    return r.ok ? r.data : [];
  }

  @ApiOperation({ summary: 'Get employee mes summary list' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Get('employee-mes-summary')
  async getEmployeeMesSummaryList() {
    const r = await this.svc.getAllMesSummary();
    return r.ok ? r.data : { totalProduced: 0, records: [] };
  }

  @ApiOperation({ summary: 'Get employee wms summary list' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Get('employee-wms-summary')
  async getEmployeeWmsSummaryList() {
    const r = await this.svc.getAllWmsSummary();
    return r.ok ? r.data : { totalOperations: 0, transactions: [] };
  }

  @ApiOperation({ summary: 'Get expense list' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('expense')
  async getExpenseList(@Query('limit') limit?: string) {
    const lim = Math.min(parseInt(limit ?? '100', 10) || 100, 500);
    const r = await db.execute(sql`
      SELECT * FROM expense_reports ORDER BY created_at DESC LIMIT ${lim}
    `);
    const items = ((r as Rows).rows) ?? [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Create expense' })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('expense')
  @HttpCode(HttpStatus.CREATED)
  async createExpense(@Body() body: unknown) {
    const dto = ExpenseSchema.parse(body);
    const reportNumber = `EXP-${Date.now()}`;
    const amount = dto.amount ? Number(dto.amount) : 0;
    const submittedBy = dto.employeeId ? Number(dto.employeeId) : 0;
    const r = await db.execute(sql`
      INSERT INTO expense_reports
        (expense_request_id, report_number, total_spent, total_receipts, status, submitted_by,
         employee_id, notes, currency, created_at)
      VALUES
        (0, ${reportNumber}, ${amount}, 0, 'pending', ${submittedBy},
         ${submittedBy}, ${dto.description ?? null}, 'UZS', NOW())
      RETURNING *
    `);
    const row = ((r as Rows).rows ?? [])[0] ?? {};
    return { data: row };
  }

  @ApiOperation({ summary: 'Get invoice list' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('invoice')
  async getInvoiceList(@Query('limit') limit?: string) {
    const lim = Math.min(parseInt(limit ?? '100', 10) || 100, 500);
    const r = await db.execute(sql`
      SELECT * FROM invoices ORDER BY id DESC LIMIT ${lim}
    `);
    const items = ((r as Rows).rows) ?? [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Create invoice' })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('invoice')
  @HttpCode(HttpStatus.CREATED)
  async createInvoice(@Body() body: unknown) {
    const dto = InvoiceSchema.parse(body);
    const invoiceNumber = `INV-${Date.now()}`;
    const total = dto.amount ? Number(dto.amount) : 0;
    const customerId = dto.customerId ? Number(dto.customerId) : null;
    const r = await db.execute(sql`
      INSERT INTO invoices
        (id, invoice_number, customer_name, customer_id, items,
         subtotal, tax_amount, total_amount, status, due_date,
         created_by)
      VALUES
        (gen_random_uuid(), ${invoiceNumber}, ${dto.description ?? 'Unknown'}, ${customerId},
         '[]'::jsonb, ${total}, 0, ${total}, 'draft', ${dto.dueDate ?? null},
         '00000000-0000-0000-0000-000000000000'::uuid)
      RETURNING *
    `);
    const row = ((r as Rows).rows ?? [])[0] ?? {};
    return { data: row };
  }
}
