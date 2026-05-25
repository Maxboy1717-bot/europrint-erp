/**
 * @module integration-employee.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, Post, Body, Param, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { notImplemented } from '@common/exceptions/not-implemented';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { z } from 'zod';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { IntegrationEmployeeService } from './integration-employee.service';

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
    return notImplemented('GET /integration/employee-complaints');
  }

  @ApiOperation({ summary: 'Get employee assessment skips list' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Get('employee-assessment-skips')
  async getEmployeeAssessmentSkipsList() {
    return notImplemented('GET /integration/employee-assessment-skips');
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
    return notImplemented('GET /integration/employee-mentorships');
  }

  @ApiOperation({ summary: 'Get employee mes summary list' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Get('employee-mes-summary')
  async getEmployeeMesSummaryList() {
    return notImplemented('GET /integration/employee-mes-summary');
  }

  @ApiOperation({ summary: 'Get employee wms summary list' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Get('employee-wms-summary')
  async getEmployeeWmsSummaryList() {
    return notImplemented('GET /integration/employee-wms-summary');
  }

  @ApiOperation({ summary: 'Get expense list' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Get('expense')
  async getExpenseList() {
    return notImplemented('GET /integration/expense');
  }

  @ApiOperation({ summary: 'Create expense' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Post('expense')
  async createExpense(@Body() body: unknown) {
    ExpenseSchema.parse(body);
    return notImplemented('POST /integration/expense');
  }

  @ApiOperation({ summary: 'Get invoice list' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Get('invoice')
  async getInvoiceList() {
    return notImplemented('GET /integration/invoice');
  }

  @ApiOperation({ summary: 'Create invoice' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 501, description: 'Not implemented' })
  @Post('invoice')
  async createInvoice(@Body() body: unknown) {
    InvoiceSchema.parse(body);
    return notImplemented('POST /integration/invoice');
  }
}
