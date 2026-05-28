/**
 * @module hr-compat-safety.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query, UseGuards, UseInterceptors, UsePipes } from '@nestjs/common';
import { throwFromError, assertOk, unwrapOrInternal } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { HrCompatSafetyService } from '../application/hr-compat-safety.service';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { z } from 'zod';
import {
  HrBrandSettingsSchema, HrBrandSettingsDto,
  HrSafetyIncidentSchema, HrSafetyIncidentDto,
  HrSafetyTrainingSchema, HrSafetyTrainingDto,
  HrHazardZoneSchema, HrHazardZoneDto,
  HrPpeComplianceSchema, HrPpeComplianceDto,
  HrHealthLeaveSchema, HrHealthLeaveDto,
} from './dto/hr.dto';

interface AuthenticatedUser { id: number; sub?: number; }

const GenerateMilestonesSchema = z.object({
  employeeId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

// P1.12.2: EMPLOYEE added so leave-requests endpoints are accessible to regular employees
const HR_ROLES = ['HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR', 'ADMIN', 'MANAGER', 'EMPLOYEE'] as const;

@ApiThrottle()
@Controller('hr')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...HR_ROLES)
export class HrCompatSafetyController {
  constructor(private readonly svc: HrCompatSafetyService) {}

  @Get('brand-settings')
  // P1.27.1: FE expects { brand_data: {...} } — wrap the stored brand_data in envelope
  async getBrandSettings() {
    const _rRow = await this.svc.getBrandSettings();
    assertOk(_rRow);
    const row = _rRow.data as Record<string, unknown>;
    const defaultBrand = { primaryColor: '#1A56DB', companyName: 'EuroPrint' };
    let brandData: unknown = row ? (row['brand_data'] ?? defaultBrand) : defaultBrand;
    // brand_data may be stored as JSON string — parse it
    if (typeof brandData === 'string') {
      try { brandData = JSON.parse(brandData); } catch { brandData = defaultBrand; }
    }
    return { brand_data: brandData };
  }

  @Patch('brand-settings')
  // P1.27.1/3: Accept { brand_data: {...} } from FE; avoid double-encoding by extracting inner object
  async updateBrandSettings(@Body() body: unknown) {
    const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
    // FE sends { brand_data: {...} }; service expects the brand_data object directly
    const brandData = b['brand_data'] ?? b;
    await this.svc.updateBrandSettings(brandData as Record<string, unknown>);
    return { data: { updated: true } };
  }

  @Get('documents')
  async getDocuments(@Query('type') docType?: string, @Query('status') status?: string) {
    return unwrapOrInternal(await this.svc.getDocuments(docType, status));
  }

  @Get('documents/admin/workflow-routes')
  async getDocumentWorkflowRoutes() {
    return unwrapOrInternal(await this.svc.getDocumentWorkflowRoutes());
  }

  @Delete('documents/:id')
  async deleteDocument(@Param('id', ParseIntPipe) id: number) {
    await this.svc.archiveDocument(id);
    return { data: { deleted: true } };
  }

  @Post('safety/incidents')
  @UsePipes(new ZodValidationPipe(HrSafetyIncidentSchema))
  async createSafetyIncident(@Body() body: HrSafetyIncidentDto) {
    const { incident_type, severity, description, location_description, department_id, incident_date } = body;
    const data = await this.svc.createSafetyIncident(incident_type, severity, description, location_description, department_id, incident_date);
    return { data };
  }

  @Get('safety/trainings')
  async getSafetyTrainings(@Query('employeeId') employeeId?: string) {
    return unwrapOrInternal(await this.svc.getSafetyTrainings(employeeId));
  }

  @Post('safety/trainings')
  @UsePipes(new ZodValidationPipe(HrSafetyTrainingSchema))
  async createSafetyTraining(@Body() body: HrSafetyTrainingDto) {
    const { training_id, employee_id, completed_date, expiry_date, score, is_passed } = body;
    const data = await this.svc.createSafetyTraining(training_id, employee_id, completed_date, expiry_date, score, is_passed);
    return { data };
  }

  @Get('safety/hazard-zones')
  async getHazardZones(@Query('departmentId') departmentId?: string) {
    return unwrapOrInternal(await this.svc.getHazardZones(departmentId));
  }

  @Post('safety/hazard-zones')
  @UsePipes(new ZodValidationPipe(HrHazardZoneSchema))
  async createHazardZone(@Body() body: HrHazardZoneDto) {
    const { zone_name, zone_code, department_id, hazard_level, required_ppe, max_occupancy } = body;
    const data = await this.svc.createHazardZone(zone_name, zone_code, department_id, hazard_level, required_ppe, max_occupancy);
    return { data };
  }

  @Get('safety/ppe-compliance')
  async getPpeCompliance(@Query('employeeId') employeeId?: string) {
    return unwrapOrInternal(await this.svc.getPpeCompliance(employeeId));
  }

  @Post('safety/ppe-compliance')
  @UsePipes(new ZodValidationPipe(HrPpeComplianceSchema))
  async createPpeCompliance(@Body() body: HrPpeComplianceDto) {
    const { employee_id, ppe_type, issue_date, expiry_date, is_compliant } = body;
    const data = await this.svc.createPpeCompliance(employee_id, ppe_type, issue_date, expiry_date, is_compliant);
    return { data };
  }

  @Get('leave-requests')
  async getLeaveRequests(@Query('employeeId') employeeId?: string, @Query('status') status?: string) {
    const r = await this.svc.getLeaveRequests(employeeId, status);
    return r.ok && Array.isArray(r.data) ? r.data : [];
  }

  @Post('leave-requests')
  // P1.12.1: Accept both camelCase (FE) and snake_case inputs. employeeId falls back to JWT user.
  async createLeaveRequest(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    const LeaveFlexSchema = z.object({
      employee_id: z.number().int().positive().optional(),
      employeeId:  z.union([z.string(), z.number()]).optional(),
      type:        z.string().optional(),
      leaveType:   z.string().optional(),
      leave_type:  z.string().optional(),
      start_date:  z.string().min(1).optional(),
      startDate:   z.string().min(1).optional(),
      end_date:    z.string().min(1).optional(),
      endDate:     z.string().min(1).optional(),
      reason:      z.string().min(1).max(2000).optional(),
    }).passthrough();
    const dto = LeaveFlexSchema.parse(body ?? {});
    const employeeId = dto.employee_id ?? (dto.employeeId ? Number(dto.employeeId) : null) ?? (user?.id ?? null);
    const startDate  = dto.start_date ?? dto.startDate;
    const endDate    = dto.end_date   ?? dto.endDate;
    const reason     = dto.reason     ?? '';
    const data = await this.svc.createLeaveRequest(employeeId, startDate, endDate, reason);
    return { data };
  }

  @Get('gamification/leaderboard/monthly')
  async getGamLeaderboardMonthly() {
    const entries = await this.svc.getGamLeaderboardMonthly();
    return { data: { period: 'monthly', entries } };
  }

  @Get('milestones/generate')
  async generateMilestones(@Query('employeeId') employeeId?: string) {
    const data = await this.svc.getAdaptationMilestones(employeeId);
    return { data };
  }

  @Post('milestones/generate')
  async postGenerateMilestones(@Body() body: unknown) {
    const dto = GenerateMilestonesSchema.parse(body ?? {});
    const data = await this.svc.getAdaptationMilestones(dto.employeeId ? String(dto.employeeId) : undefined);
    return { data };
  }

  @Put('brand-settings')
  @UsePipes(new ZodValidationPipe(HrBrandSettingsSchema))
  async putBrandSettings(@Body() body: HrBrandSettingsDto) {
    await this.svc.updateBrandSettings(body);
    return { data: { updated: true } };
  }
}
