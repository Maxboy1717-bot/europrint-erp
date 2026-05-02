import { Controller, Get, Post, Body, Param, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { IntegrationEmployeeService } from './integration-employee.service';

const HR_ROLES = ['admin', 'super_admin', 'hr_manager', 'hr', 'manager', 'director', 'employee'] as const;

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('integration')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...HR_ROLES)
export class IntegrationEmployeeController {
  constructor(private readonly svc: IntegrationEmployeeService) {}

  @Get('employee-complaints/:id')
  async getComplaints(@Param('id') id: string) {
    const r = await this.svc.getEmployeeComplaints(id);
    return r.ok ? r.data : { complaints: [] };
  }

  @Get('employee-assessment-skips/:id')
  async getAssessmentSkips(@Param('id') id: string) {
    const r = await this.svc.getEmployeeAssessmentSkips(id);
    return r.ok ? r.data : { skips: [] };
  }

  @Get('swap-requests')
  async getSwapRequests(
    @Query('requestedBy') requestedBy?: string,
    @Query('status') status?: string,
  ) {
    const r = await this.svc.getSwapRequests(requestedBy, status);
    return r.ok ? r.data : [];
  }

  @Get('skill-gap/:id')
  async getSkillGap(@Param('id') id: string) {
    const r = await this.svc.getSkillGap(id);
    return r.ok ? r.data : { employeeId: id, skills: [] };
  }

  @Get('employee-mentorships/:id')
  async getMentorships(@Param('id') id: string) {
    const r = await this.svc.getEmployeeMentorships(id);
    return r.ok ? r.data : { asMentor: [], asMentee: [] };
  }

  @Get('employee-mes-summary/:id')
  async getMesSummary(
    @Param('id') id: string,
    @Query('months') months?: string,
  ) {
    const r = await this.svc.getEmployeeMesSummary(id, months ? parseInt(months, 10) : 3);
    return r.ok ? r.data : { employeeId: id, months: 3, totalProduced: 0, records: [] };
  }

  @Get('employee-wms-summary/:id')
  async getWmsSummary(@Param('id') id: string) {
    const r = await this.svc.getEmployeeWmsSummary(id);
    return r.ok ? r.data : { employeeId: id, totalOperations: 0, transactions: [] };
  }

  @Get('employee-complaints')
  async getEmployeeComplaintsList() { return { data: [], total: 0 }; }

  @Get('employee-assessment-skips')
  async getEmployeeAssessmentSkipsList() { return { data: [], total: 0 }; }

  @Get('skill-gap')
  async getSkillGapList() { return { data: [], total: 0 }; }

  @Get('employee-mentorships')
  async getEmployeeMentorshipsList() { return { data: [], total: 0 }; }

  @Get('employee-mes-summary')
  async getEmployeeMesSummaryList() { return { data: [], total: 0 }; }

  @Get('employee-wms-summary')
  async getEmployeeWmsSummaryList() { return { data: [], total: 0 }; }

  @Get('expense')
  async getExpenseList() { return { data: [], total: 0 }; }

  @Post('expense')
  async createExpense(@Body() body: Record<string, unknown>) { return { id: 0, ...body }; }

  @Get('invoice')
  async getInvoiceList() { return { data: [], total: 0 }; }

  @Post('invoice')
  async createInvoice(@Body() body: Record<string, unknown>) { return { id: 0, ...body }; }
}
