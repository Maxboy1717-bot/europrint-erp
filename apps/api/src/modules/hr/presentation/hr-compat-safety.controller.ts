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

const GenerateMilestonesSchema = z.object({
  employeeId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

const HR_ROLES = ['HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR', 'ADMIN', 'MANAGER'] as const;

@ApiThrottle()
@Controller('hr')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...HR_ROLES)
export class HrCompatSafetyController {
  constructor(private readonly svc: HrCompatSafetyService) {}

  @Get('brand-settings')
  async getBrandSettings() {
    const _rRow = await this.svc.getBrandSettings();
    assertOk(_rRow);
    const row = _rRow.data as Record<string, unknown>;
    return row ? (row['brand_data'] ?? {}) : { primaryColor: '#1A56DB', companyName: 'EuroPrint' };
  }

  @Patch('brand-settings')
  @UsePipes(new ZodValidationPipe(HrBrandSettingsSchema))
  async updateBrandSettings(@Body() body: HrBrandSettingsDto) {
    await this.svc.updateBrandSettings(body);
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
    return unwrapOrInternal(await this.svc.getLeaveRequests(employeeId, status));
  }

  @Post('leave-requests')
  @UsePipes(new ZodValidationPipe(HrHealthLeaveSchema))
  async createLeaveRequest(@Body() body: HrHealthLeaveDto) {
    const { employee_id, start_date, end_date, reason } = body;
    const data = await this.svc.createLeaveRequest(employee_id, start_date, end_date, reason);
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
