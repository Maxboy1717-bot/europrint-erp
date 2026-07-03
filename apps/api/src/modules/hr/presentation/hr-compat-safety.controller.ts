/**
 * @module hr-compat-safety.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Body, Controller, Delete, Get, Header, Param, ParseIntPipe, Patch, Post, Put, Query, Res, UseGuards, UseInterceptors, UsePipes } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
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
  HrAdaptationProgramCreateSchema, HrAdaptationProgramCreateDto,
  HrAdaptationRecordCreateSchema, HrAdaptationRecordCreateDto,
  HrAdaptationMilestoneUpdateSchema, HrAdaptationMilestoneUpdateDto,
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

  // P1.23.1: GET incidents list (was missing — FE calls GET /api/hr/safety/incidents)
  @Get('safety/incidents')
  async getSafetyIncidents(@Query('status') status?: string) {
    return unwrapOrInternal(await this.svc.getSafetyIncidents(status));
  }

  // NOTE: DELETE /api/hr/safety/incidents/:id is served by HrSafetyController (incidents delete).
  // This compat controller only exposes GET list + PDF export for the safety section.

  // P1.23.1: PDF export — GET /api/hr/safety/export/pdf
  @Get('safety/export/pdf')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="safety-incidents.pdf"')
  async exportSafetyPdf(@Res() res: FastifyReply) {
    const result = await this.svc.generateSafetyIncidentReport();
    if (!result.ok) {
      return res.status(500).send({ message: 'PDF yaratishda xatolik' });
    }
    return res.type('application/pdf').send(result.data);
  }

  @Post('safety/incidents')
  @UsePipes(new ZodValidationPipe(HrSafetyIncidentSchema))
  async createSafetyIncident(@Body() body: HrSafetyIncidentDto) {
    // P1.23.2: accept camelCase aliases from FE
    const incident_type       = body.incident_type      ?? body.incidentType;
    const { severity, description } = body;
    const location_description = body.location_description ?? body.location;
    const { department_id }   = body;
    const incident_date       = body.incident_date      ?? body.incidentDate;
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
    // P1.23.3: trainingId (numeric, from course select) > training_id > trainingName fallback
    const rawTrainingId  = body.training_id ?? body.trainingId;
    const training_id    = rawTrainingId != null ? Number(rawTrainingId) || null : null;
    const employee_id    = body.employee_id   ?? body.userId;
    const completed_date = body.completed_date ?? body.scheduledDate;
    const expiry_date    = body.expiry_date   ?? body.expiryDate;
    const { score, is_passed } = body;
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
    // P1.23.4: accept camelCase aliases from FE
    const zone_name    = body.zone_name    ?? body.zoneName;
    const zone_code    = body.zone_code    ?? body.zoneCode;
    const { department_id } = body;
    const hazard_level = body.hazard_level ?? body.riskLevel;
    const required_ppe = body.required_ppe ?? body.requiredPpe;
    const max_occupancy = body.max_occupancy ?? body.maxOccupancy;
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
    const leaveType  = dto.type ?? dto.leaveType ?? dto.leave_type;
    const userId     = user?.id ?? user?.sub ?? null;
    const data = await this.svc.createLeaveRequest(employeeId, startDate, endDate, reason, leaveType, userId);
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

  // ── 3.14: adaptatsiya (moslashuv) checklist — CRUD + status-flow ─────────

  @Get('adaptation/programs')
  async getAdaptationPrograms() {
    return unwrapOrInternal(await this.svc.getAdaptationPrograms());
  }

  @Post('adaptation/programs')
  @UsePipes(new ZodValidationPipe(HrAdaptationProgramCreateSchema))
  async createAdaptationProgram(@Body() body: HrAdaptationProgramCreateDto, @CurrentUser() user: AuthenticatedUser) {
    const data = await this.svc.createAdaptationProgram({ ...body, created_by: user?.id ?? user?.sub ?? null });
    return { data };
  }

  @Get('adaptation/records')
  async getAdaptationRecords(@Query('employeeId') employeeId?: string, @Query('status') status?: string) {
    return unwrapOrInternal(await this.svc.getAdaptationRecords(employeeId, status));
  }

  // P3.14: create a new adaptation (moslashuv) checklist process for an employee.
  // Auto-generates 4 milestone rows (kun1/hafta1/oy1/oy3) via the service.
  @Post('adaptation/records')
  @UsePipes(new ZodValidationPipe(HrAdaptationRecordCreateSchema))
  async createAdaptationRecord(@Body() body: HrAdaptationRecordCreateDto, @CurrentUser() user: AuthenticatedUser) {
    const createdBy = user?.id ?? user?.sub ?? null;
    const data = await this.svc.createAdaptationRecord(
      body.employee_id,
      body.program_id ?? null,
      body.mentor_id ?? null,
      body.start_date ?? null,
      createdBy,
    );
    return { data };
  }

  @Get('adaptation/records/:id/milestones')
  async getAdaptationRecordMilestones(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.svc.getAdaptationRecordMilestones(id));
  }

  // P3.14: mark a checklist step (kun1/hafta1/oy1/oy3) completed/skipped — status-flow tracking.
  @Patch('adaptation/milestones/:id')
  @UsePipes(new ZodValidationPipe(HrAdaptationMilestoneUpdateSchema))
  async updateAdaptationMilestone(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: HrAdaptationMilestoneUpdateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.svc.updateAdaptationMilestoneStatus(
      id,
      body.status ?? 'completed',
      body.notes ?? null,
      body.verified_by ?? user?.id ?? user?.sub ?? null,
    );
    return { data };
  }
}
