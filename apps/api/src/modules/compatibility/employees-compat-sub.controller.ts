/**
 * @deprecated 2026-05-27
 * This file is a compatibility shim. Do NOT add new features here.
 * Canonical replacement: `apps/api/src/modules/hr/presentation/hr-employees-ext.controller.ts`
 * Existing consumers continue to work. New code must import from the canonical file.
 * See: docs/modules/hr-employees.md
 */
/**
 * @module employees-compat-sub.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 * @deprecated Legacy compatibility shim. New consumers should target the canonical
 *   employees-compat-sub module endpoints (see docs/B5-compat-endpoints.md). Existing routes
 *   remain functional but receive no new features. Removal target: post-PA3 cutover.
 */
import { Controller, Get, Post, Patch, Delete, Param, Query, Body, HttpCode, UseGuards, UseInterceptors, HttpStatus } from '@nestjs/common';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
type Rows = { rows?: unknown[] };
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { EmployeesCompatService } from './employees-compat.service';
import { EmployeesCompatSubService } from './employees-compat-sub.service';
import { EmployeesCompatProfileService } from './employees-compat-profile.service';
import { EmployeesCompatFinancialsService } from './employees-compat-financials.service';
import { CompatBodyDto } from './dto/compat-body.dto';
import { unwrapOrInternal } from '@common/http-result';
import { Result, AppError } from '@common/result';
import {
  BankAccountAclTranslator,
  type LegacyBankAccountRow,
  type BankAccountDto,
} from './acl/bank-account-acl';

const HR_ROLES = ['HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR', 'ADMIN', 'MANAGER'] as const;

type Row = Record<string, unknown>;
const toList = (r: Result<Row[], AppError>) => { const rows = r.ok && Array.isArray(r.data) ? r.data : []; return { items: rows, total: rows.length }; };

@ApiThrottle()
@Controller('employees')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...HR_ROLES)
export class EmployeesCompatSubController {
  /** PA2-14 ACL demonstrator. Stateless — direct instantiation is fine. */
  private readonly bankAccountAcl = new BankAccountAclTranslator();

  constructor(
    private readonly svc: EmployeesCompatService,
    private readonly subSvc: EmployeesCompatSubService,
    private readonly profile: EmployeesCompatProfileService,
    private readonly financials: EmployeesCompatFinancialsService,
  ) {}

  // --- Assets ---
  @Get(':id/assets')
  async getAssets(@Param('id') id: string) { return unwrapOrInternal(await this.subSvc.getAssets(id)); }

  @Post(':id/assets') @HttpCode(HttpStatus.CREATED)
  async assignAsset(@Param('id') id: string, @Body() body: CompatBodyDto) { return unwrapOrInternal(await this.subSvc.assignAsset(id, body)); }

  @Delete(':id/assets/:assetId')
  async returnAsset(@Param('id') id: string, @Param('assetId') assetId: string) { return unwrapOrInternal(await this.subSvc.returnAsset(id, assetId)); }

  // --- Swap Requests ---
  @Get(':id/swap-requests')
  async getSwapRequests(@Param('id') id: string, @Query('status') status?: string) { return unwrapOrInternal(await this.subSvc.getSwapRequests(id, status)); }

  // --- Complaints ---
  @Get(':id/complaints')
  async getComplaints(@Param('id') id: string) { return unwrapOrInternal(await this.subSvc.getComplaints(id)); }

  @Post(':id/complaints') @HttpCode(HttpStatus.CREATED)
  async createComplaint(@Param('id') id: string, @Body() body: CompatBodyDto) { return unwrapOrInternal(await this.subSvc.createComplaint(id, body)); }

  // --- Assessment Skips ---
  @Get(':id/assessment-skips')
  async getAssessmentSkips(@Param('id') id: string) { return unwrapOrInternal(await this.subSvc.getAssessmentSkips(id)); }

  // --- Bank Accounts ---
  @Get(':id/bank-accounts')
  async getBankAccounts(@Param('id') id: string) { return toList(await this.financials.getBankAccounts(id)); }

  /**
   * PA2-14 ACL-translated variant. New BC-3 (HR / People — Financials)
   * consumers should target this endpoint; the legacy `/:id/bank-accounts`
   * route stays for backwards-compat.
   */
  @Get(':id/bank-accounts/v2')
  async getBankAccountsV2(@Param('id') id: string): Promise<{ items: BankAccountDto[]; total: number }> {
    const r = await this.financials.getBankAccounts(id);
    const rows = r.ok && Array.isArray(r.data) ? r.data : [];
    const items = rows
      .map((row) => this.bankAccountAcl.toDomain(row as unknown as LegacyBankAccountRow))
      .filter((res): res is { ok: true; data: BankAccountDto } => res.ok)
      .map((res) => res.data);
    return { items, total: items.length };
  }

  @Post(':id/bank-accounts') @HttpCode(HttpStatus.CREATED)
  async createBankAccount(@Param('id') id: string, @Body() body: CompatBodyDto) { return unwrapOrInternal(await this.financials.createBankAccount(id, body)); }

  // --- Bonuses ---
  @Get(':id/bonuses')
  async getBonuses(@Param('id') id: string) { return toList(await this.financials.getBonuses(id)); }

  @Post(':id/bonuses') @HttpCode(HttpStatus.CREATED)
  async createBonus(@Param('id') id: string, @Body() body: CompatBodyDto) { return unwrapOrInternal(await this.financials.createBonus(id, body)); }

  // --- Business Trips ---
  @Get(':id/business-trips')
  async getBusinessTrips(@Param('id') id: string) { return toList(await this.financials.getBusinessTrips(id)); }

  @Post(':id/business-trips') @HttpCode(HttpStatus.CREATED)
  async createBusinessTrip(@Param('id') id: string, @Body() body: CompatBodyDto) { return unwrapOrInternal(await this.financials.createBusinessTrip(id, body)); }

  // --- Capital Profile ---
  @Get(':id/capital-profile')
  async getCapitalProfile(@Param('id') id: string) { const r = await this.profile.getCapitalProfile(id); return { profile: r.ok ? r.data : null }; }

  @Post(':id/capital-profile') @HttpCode(HttpStatus.CREATED)
  async createCapitalProfile(@Param('id') id: string, @Body() body: CompatBodyDto) { return unwrapOrInternal(await this.profile.createCapitalProfile(id, body)); }

  // --- Career ---
  @Get(':id/career')
  async getCareer(@Param('id') id: string) {
    const r = await this.profile.getCareer(id);
    return { history: r.ok && Array.isArray(r.data?.history) ? r.data.history : [], goals: r.ok && Array.isArray(r.data?.goals) ? r.data.goals : [] };
  }

  @Post(':id/career') @HttpCode(HttpStatus.CREATED)
  async createCareer(@Param('id') id: string, @Body() body: CompatBodyDto) { return unwrapOrInternal(await this.profile.createCareer(id, body)); }

  // --- Cash Advances ---
  @Get(':id/cash-advances')
  async getCashAdvances(@Param('id') id: string) { return toList(await this.financials.getCashAdvances(id)); }

  @Post(':id/cash-advances') @HttpCode(HttpStatus.CREATED)
  async createCashAdvance(@Param('id') id: string, @Body() body: CompatBodyDto) { return unwrapOrInternal(await this.financials.createCashAdvance(id, body)); }

  // --- Contracts ---
  @Get(':id/contracts')
  async getContracts(@Param('id') id: string) { return toList(await this.profile.getContracts(id)); }

  @Post(':id/contracts') @HttpCode(HttpStatus.CREATED)
  async createContract(@Param('id') id: string, @Body() body: CompatBodyDto) { return unwrapOrInternal(await this.profile.createContract(id, body)); }

  // --- Corporate Inventory ---
  @Get(':id/corporate-inventory')
  async getCorporateInventory(@Param('id') id: string) { return toList(await this.profile.getCorporateInventory(id)); }

  @Post(':id/corporate-inventory') @HttpCode(HttpStatus.CREATED)
  async createCorporateInventory(@Param('id') id: string, @Body() body: CompatBodyDto) { return unwrapOrInternal(await this.profile.createCorporateInventory(id, body)); }

  @Patch(':id/corporate-inventory/:itemId/return')
  async corporateInventoryReturn(@Param('id') id: string, @Param('itemId') itemId: string) { return unwrapOrInternal(await this.profile.patchCorporateInventoryReturn(id, itemId)); }

  @Patch(':id/corporate-inventory/:itemId/sign')
  async corporateInventorySign(@Param('id') id: string, @Param('itemId') itemId: string) { return unwrapOrInternal(await this.profile.patchCorporateInventorySign(id, itemId)); }

  // --- Emergency Contacts ---
  @Get(':id/emergency-contacts')
  async getEmergencyContacts(@Param('id') id: string) { return toList(await this.profile.getEmergencyContacts(id)); }

  @Post(':id/emergency-contacts') @HttpCode(HttpStatus.CREATED)
  async createEmergencyContact(@Param('id') id: string, @Body() body: CompatBodyDto) { return unwrapOrInternal(await this.profile.createEmergencyContact(id, body)); }

  // --- Files ---
  @Get(':id/files')
  async getFiles(@Param('id') id: string) { return toList(await this.profile.getFiles(id)); }

  @Post(':id/files') @HttpCode(HttpStatus.CREATED)
  async createFile(@Param('id') id: string, @Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    const dto = (body ?? {}) as Record<string, unknown>;
    const r = await db.execute(sql`
      INSERT INTO employee_files
        (employee_id, user_id, file_name, file_path, file_url, file_type, file_size, description, category, uploaded_by, created_at)
      VALUES (
        ${parseInt(id, 10)},
        ${parseInt(id, 10)},
        ${String(dto['file_name'] ?? dto['fileName'] ?? dto['name'] ?? 'file')}::text,
        ${String(dto['file_path'] ?? dto['filePath'] ?? dto['url'] ?? '')}::text,
        ${dto['file_url'] ?? dto['fileUrl'] ?? null}::text,
        ${dto['file_type'] ?? dto['fileType'] ?? null}::text,
        ${dto['file_size'] ?? dto['fileSize'] ?? null}::int,
        ${dto['description'] ?? null}::text,
        ${dto['category'] ?? null}::text,
        ${user?.id ?? 0}::int,
        NOW()
      )
      RETURNING id, file_name
    `);
    const row = ((r as Rows).rows ?? [])[0] ?? null;
    return { message: "Fayl yuklandi", data: row };
  }

  @Delete(':id/files/:fileId')
  async deleteFile(@Param('id') id: string, @Param('fileId') fileId: string) { return unwrapOrInternal(await this.financials.deleteEmployeeFile(id, fileId)); }

  // --- Status ---
  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: CompatBodyDto) { return unwrapOrInternal(await this.svc.updateEmployee(id, body)); }

  // --- Assessments ---
  @Get(':id/assessments')
  async getAssessments(@Param('id') id: string) { return toList(await this.financials.getAllAssessments(id)); }

  @Post(':id/assessments') @HttpCode(HttpStatus.CREATED)
  async createAssessment(@Param('id') id: string, @Body() body: CompatBodyDto) { return unwrapOrInternal(await this.financials.createAssessment(id, body)); }

  // --- Fines ---
  @Get(':id/fines')
  async getFines(@Param('id') id: string) { return toList(await this.financials.getFines(id)); }

  @Post(':id/fines') @HttpCode(HttpStatus.CREATED)
  async createFine(@Param('id') id: string, @Body() body: CompatBodyDto) { return unwrapOrInternal(await this.financials.createFine(id, body)); }

  // --- Leave Requests ---
  @Get(':id/leave-requests')
  async getLeaveRequests(@Param('id') id: string) { return toList(await this.profile.getLeaveRequests(id)); }

  @Post(':id/leave-requests') @HttpCode(HttpStatus.CREATED)
  async createLeaveRequest(@Param('id') id: string, @Body() body: CompatBodyDto) { return unwrapOrInternal(await this.profile.createLeaveRequest(id, body)); }

  // --- Overtime ---
  @Get(':id/overtime')
  async getOvertime(@Param('id') id: string) { return toList(await this.financials.getOvertime(id)); }

  @Post(':id/overtime') @HttpCode(HttpStatus.CREATED)
  async createOvertime(@Param('id') id: string, @Body() body: CompatBodyDto) { return unwrapOrInternal(await this.financials.createOvertime(id, body)); }

  // --- Passport ---
  /**
   * GET /api/employees/:id/passport
   * Passport ma'lumotlari `employees` jadvalining ustunlarida saqlanadi
   * (passport_series, passport_number, passport_issue_date, passport_expiry_date, national_id).
   * Agar hech qaysi ustunda qiymat bo'lmasa, frontend uchun 404 emas, null qaytariladi —
   * frontend `EmployeeProfile.tsx` 404/null ni "passport yo'q" sifatida qabul qiladi.
   */
  @Get(':id/passport')
  async getPassport(@Param('id') id: string) {
    const r = await this.profile.getPassport(id);
    return r.ok ? r.data : null;
  }

  @Post(':id/passport') @HttpCode(HttpStatus.OK)
  async createPassport(@Param('id') id: string, @Body() body: CompatBodyDto) { return unwrapOrInternal(await this.profile.createPassport(id, body)); }

  // --- Salary History ---
  @Get(':id/salary-history')
  async getSalaryHistory(@Param('id') id: string) { return toList(await this.profile.getSalaryHistory(id)); }

  @Post(':id/salary-history') @HttpCode(HttpStatus.CREATED)
  async createSalaryHistory(@Param('id') id: string, @Body() body: CompatBodyDto) { return unwrapOrInternal(await this.profile.createSalaryHistory(id, body)); }

  // --- Sick Leaves ---
  @Get(':id/sick-leaves')
  async getSickLeaves(@Param('id') id: string) { return toList(await this.profile.getSickLeaves(id)); }

  @Post(':id/sick-leaves') @HttpCode(HttpStatus.CREATED)
  async createSickLeave(@Param('id') id: string, @Body() body: CompatBodyDto) { return unwrapOrInternal(await this.profile.createSickLeave(id, body)); }

  // --- Monthly Report / Org Structure / Payroll Summary / Set Password ---
  @Get(':id/monthly-report')
  async getMonthlyReport(@Param('id') id: string) { const r = await this.profile.getMonthlyReport(id); return { report: r.ok ? r.data : null }; }

  @Get(':id/org-structure')
  async getOrgStructure(@Param('id') id: string) {
    const r = await this.profile.getOrgStructure(id);
    return { manager: r.ok ? r.data?.manager ?? null : null, subordinates: r.ok && Array.isArray(r.data?.subordinates) ? r.data.subordinates : [], peers: r.ok && Array.isArray(r.data?.peers) ? r.data.peers : [] };
  }

  /**
   * GET /api/employees/:id/payroll-summary
   * So'nggi 12 oy payroll_period_record agregati. Frontend `EmployeeProfile.tsx`
   * `payrollSummary` queryda ishlatadi va `!res.ok ? null` orqali defensiv ko'rinish.
   */
  @Get(':id/payroll-summary')
  async getPayrollSummary(@Param('id') id: string) {
    const r = await this.profile.getPayrollSummary(id);
    return { summary: r.ok ? r.data : null };
  }

  @Post(':id/set-password') @HttpCode(HttpStatus.OK)
  async setPassword(@Param('id') id: string, @Body() body: CompatBodyDto) { return unwrapOrInternal(await this.financials.setPassword(id, body)); }
}
