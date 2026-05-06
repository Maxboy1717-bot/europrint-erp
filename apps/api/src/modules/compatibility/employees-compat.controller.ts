import { Controller, Get, Post, Put, Patch, Delete, Param, Query, Body, HttpCode, UseGuards, UseInterceptors, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { EmployeesCompatService } from './employees-compat.service';
import { EmployeesListExtendedService } from './employees-list-extended.service';
import { CompatBodyDto, ImportEmployeesDto, OrgFunctionsDto, ProfileImageDto } from './dto/compat-body.dto';
import { unwrapOrInternal } from '@common/http-result';

const HR_ROLES = ['HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR', 'ADMIN', 'MANAGER'] as const;

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('employees')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...HR_ROLES)
export class EmployeesCompatController {
  constructor(
    private readonly svc: EmployeesCompatService,
    private readonly extendedSvc: EmployeesListExtendedService,
  ) {}

  // GET /api/employees — kengaytirilgan ro'yxat (frontend `Employees.tsx` kutadi: items + total)
  @Get()
  async listEmployees(
    @Query('status') status?: string,
    @Query('departmentId') departmentId?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const itemsRes = await this.extendedSvc.listExtended(status, departmentId, search, limit, offset);
    const totalRes = await this.extendedSvc.countExtended(status, departmentId, search);
    return {
      items: itemsRes.ok && Array.isArray(itemsRes.data) ? itemsRes.data : [],
      total: totalRes.ok && typeof totalRes.data === 'number' ? totalRes.data : 0,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createEmployee(@Body() body: CompatBodyDto) {
    return unwrapOrInternal(await this.svc.createEmployee(body));
  }

  @Post('import')
  @HttpCode(HttpStatus.CREATED)
  async importEmployees(@Body() body: ImportEmployeesDto) {
    return unwrapOrInternal(await this.svc.importEmployees(body.employees ?? []));
  }

  @Get('for-face')
  async getEmployeesForFace() {
    return unwrapOrInternal(await this.svc.getEmployeesForFace());
  }

  @Get(':id')
  async getEmployee(@Param('id') id: string) {
    const r = await this.extendedSvc.getById(id);
    if (r.ok && r.data) return r.data;
    return unwrapOrInternal(await this.svc.getEmployee(id));
  }

  @Put(':id')
  async updateEmployee(@Param('id') id: string, @Body() body: CompatBodyDto) {
    return unwrapOrInternal(await this.svc.updateEmployee(id, body));
  }

  @Delete(':id')
  async deleteEmployee(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.deleteEmployee(id));
  }

  @Patch(':id/profile-image')
  async updateProfileImage(
    @Param('id') id: string,
    @Body() body: ProfileImageDto,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return unwrapOrInternal(await this.svc.updateProfileImage(id, body.url, user.id));
  }

  @Put(':id/profile-image')
  async updateProfileImagePut(
    @Param('id') id: string,
    @Body() body: ProfileImageDto,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return unwrapOrInternal(await this.svc.updateProfileImage(id, body.url, user.id));
  }

  @Patch(':id/org-functions')
  async assignOrgFunctions(
    @Param('id') id: string,
    @Body() body: OrgFunctionsDto,
  ) {
    return unwrapOrInternal(await this.svc.assignOrgFunctions(id, body));
  }

  @Post(':id/assign-org-functions')
  @HttpCode(HttpStatus.OK)
  async assignOrgFunctionsLegacy(
    @Param('id') id: string,
    @Body() body: OrgFunctionsDto,
  ) {
    return unwrapOrInternal(await this.svc.assignOrgFunctions(id, body));
  }

  /**
   * GET /api/employees/:id/org-departments
   * Xodim biriktirilgan barcha org_departments ID ro'yxati.
   * Frontend `EmployeeDialog → OrgStructureSection` edit rejimida ishlatadi —
   * pre-selected funksiyalarni ko'rsatish uchun.
   */
  @Get(':id/org-departments')
  async getOrgDepartments(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.getEmployeeOrgDepartments(id));
  }

  @Get(':id/assets')
  async getAssets(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.getAssets(id));
  }

  @Post(':id/assets')
  @HttpCode(HttpStatus.CREATED)
  async assignAsset(@Param('id') id: string, @Body() body: CompatBodyDto) {
    return unwrapOrInternal(await this.svc.assignAsset(id, body));
  }

  @Delete(':id/assets/:assetId')
  async returnAsset(@Param('id') id: string, @Param('assetId') assetId: string) {
    return unwrapOrInternal(await this.svc.returnAsset(id, assetId));
  }

  @Get(':id/swap-requests')
  async getSwapRequests(@Param('id') id: string, @Query('status') status?: string) {
    return unwrapOrInternal(await this.svc.getSwapRequests(id, status));
  }

  @Get(':id/complaints')
  async getComplaints(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.getComplaints(id));
  }

  @Post(':id/complaints')
  @HttpCode(HttpStatus.CREATED)
  async createComplaint(@Param('id') id: string, @Body() body: CompatBodyDto) {
    return unwrapOrInternal(await this.svc.createComplaint(id, body));
  }

  @Get(':id/assessment-skips')
  async getAssessmentSkips(@Param('id') id: string) {
    return unwrapOrInternal(await this.svc.getAssessmentSkips(id));
  }

  @Get(':id/bank-accounts')
  async getBankAccounts(@Param('id') id: string) {
    const r = await this.svc.getBankAccounts(id);
    const rows = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items: rows, total: rows.length };
  }

  @Get(':id/bonuses')
  async getBonuses(@Param('id') id: string) {
    const r = await this.svc.getBonuses(id);
    const rows = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items: rows, total: rows.length };
  }

  @Get(':id/business-trips')
  async getBusinessTrips(@Param('id') id: string) {
    const r = await this.svc.getBusinessTrips(id);
    const rows = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items: rows, total: rows.length };
  }

  @Get(':id/capital-profile')
  async getCapitalProfile(@Param('id') id: string) {
    const r = await this.svc.getCapitalProfile(id);
    return { profile: r.ok ? r.data : null };
  }

  @Get(':id/career')
  async getCareer(@Param('id') id: string) {
    const r = await this.svc.getCareer(id);
    const history = r.ok && Array.isArray(r.data?.history) ? r.data.history : [];
    const goals   = r.ok && Array.isArray(r.data?.goals)   ? r.data.goals   : [];
    return { history, goals };
  }

  @Get(':id/cash-advances')
  async getCashAdvances(@Param('id') id: string) {
    const r = await this.svc.getCashAdvances(id);
    const rows = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items: rows, total: rows.length };
  }

  @Get(':id/contracts')
  async getContracts(@Param('id') id: string) {
    const r = await this.svc.getContracts(id);
    const rows = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items: rows, total: rows.length };
  }

  @Get(':id/corporate-inventory')
  async getCorporateInventory(@Param('id') id: string) {
    const r = await this.svc.getCorporateInventory(id);
    const rows = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items: rows, total: rows.length };
  }

  @Get(':id/emergency-contacts')
  async getEmergencyContacts(@Param('id') id: string) {
    const r = await this.svc.getEmergencyContacts(id);
    const rows = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items: rows, total: rows.length };
  }

  @Get(':id/files')
  async getFiles(@Param('id') id: string) {
    const r = await this.svc.getFiles(id);
    const rows = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items: rows, total: rows.length };
  }

  @Delete(':id/files/:fileId')
  async deleteFile(@Param('id') id: string, @Param('fileId') fileId: string) {
    return unwrapOrInternal(await this.svc.deleteEmployeeFile(id, fileId));
  }

  @Get(':id/fines')
  async getFines(@Param('id') id: string) {
    const r = await this.svc.getFines(id);
    const rows = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items: rows, total: rows.length };
  }

  @Get(':id/leave-requests')
  async getLeaveRequests(@Param('id') id: string) {
    const r = await this.svc.getLeaveRequests(id);
    const rows = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items: rows, total: rows.length };
  }

  @Get(':id/monthly-report')
  async getMonthlyReport(@Param('id') id: string) {
    const r = await this.svc.getMonthlyReport(id);
    return { report: r.ok ? r.data : null };
  }

  @Get(':id/org-structure')
  async getOrgStructure(@Param('id') id: string) {
    const r = await this.svc.getOrgStructure(id);
    const peers = r.ok && Array.isArray(r.data?.peers) ? r.data.peers : [];
    const subordinates = r.ok && Array.isArray(r.data?.subordinates) ? r.data.subordinates : [];
    return { manager: r.ok ? r.data?.manager ?? null : null, subordinates, peers };
  }

  @Get(':id/overtime')
  async getOvertime(@Param('id') id: string) {
    const r = await this.svc.getOvertime(id);
    const rows = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items: rows, total: rows.length };
  }

  @Get(':id/passport')
  async getPassport(@Param('id') _id: string) {
    return { passport: null };
  }

  @Get(':id/payroll-summary')
  async getPayrollSummary(@Param('id') _id: string) {
    return { summary: null };
  }

  @Get(':id/salary-history')
  async getSalaryHistory(@Param('id') id: string) {
    const r = await this.svc.getSalaryHistory(id);
    const rows = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items: rows, total: rows.length };
  }

  @Post(':id/set-password')
  @HttpCode(HttpStatus.OK)
  async setPassword(@Param('id') id: string, @Body() body: CompatBodyDto) {
    return unwrapOrInternal(await this.svc.setPassword(id, body));
  }

  @Get(':id/sick-leaves')
  async getSickLeaves(@Param('id') id: string) {
    const r = await this.svc.getSickLeaves(id);
    const rows = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items: rows, total: rows.length };
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: CompatBodyDto) {
    return unwrapOrInternal(await this.svc.updateEmployee(id, body));
  }

  @Get(':id/assessments')
  async getAssessments(@Param('id') id: string) {
    const r = await this.svc.getAllAssessments(id);
    const rows = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items: rows, total: rows.length };
  }
}
