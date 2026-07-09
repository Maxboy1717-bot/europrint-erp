/**
 * @module crm-settings.controller
 * @description Manager-owned CRM vocabulary settings (Batch 5 Item 6):
 *   loss-reason taxonomy (crm_loss_reasons) + funnel stage names (crm_stages).
 *   The CRM/sales manager defines these via UI (owner does not seed them). Transport-only:
 *   validate with Zod, delegate to the service, unwrap Result.
 *
 *   GET/POST/PATCH  /api/crm/settings/loss-reasons[/:id]
 *   GET/POST/PATCH  /api/crm/settings/stages[/:id]
 */

import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { z } from 'zod';
import { throwFromError, unwrapOrThrow } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/constants/roles.constants';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CrmSettingsService } from './crm-settings.service';

const READ = [Role.SUPER_ADMIN, Role.DIRECTOR, Role.SALES_MANAGER];
const WRITE = [Role.SUPER_ADMIN, Role.DIRECTOR, Role.SALES_MANAGER];
const SEMANTICS = ['process', 'success', 'fail'] as const;

const LossCreateSchema = z.object({
  code: z.string().min(1).max(50),
  labelUz: z.string().max(500).optional(),
  labelRu: z.string().max(500).optional(),
  sortOrder: z.number().int().optional(),
});
const LossUpdateSchema = z.object({
  labelUz: z.string().max(500).optional(),
  labelRu: z.string().max(500).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
}).refine(v => Object.keys(v).length > 0, { message: 'Kamida bitta maydon kerak' });

const StageCreateSchema = z.object({
  name: z.string().min(1).max(200),
  nameRu: z.string().max(200).optional(),
  sort: z.number().int().optional(),
  color: z.string().max(20).optional(),
  semantics: z.enum(SEMANTICS),
  probability: z.number().int().min(0).max(100).optional(),
  categoryId: z.number().int().positive().optional(),
  entityId: z.string().max(50).optional(),
});
const StageUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  nameRu: z.string().max(200).optional(),
  sort: z.number().int().optional(),
  color: z.string().max(20).optional(),
  semantics: z.enum(SEMANTICS).optional(),
  probability: z.number().int().min(0).max(100).optional(),
}).refine(v => Object.keys(v).length > 0, { message: 'Kamida bitta maydon kerak' });

@ApiThrottle()
@ApiTags('CRM Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Controller('crm/settings')
export class CrmSettingsController {
  constructor(private readonly svc: CrmSettingsService) {}

  // ── Loss reasons ─────────────────────────────────────────────────────
  @Get('loss-reasons')
  @Roles(...READ)
  @ApiOperation({ summary: 'List CRM loss reasons' })
  @ApiResponse({ status: 200, description: 'OK' })
  async listLoss(@Query('includeInactive') includeInactive?: string) {
    const all = includeInactive === '1' || includeInactive === 'true';
    const items = unwrapOrThrow(await this.svc.listLossReasons(all));
    return { items, total: Array.isArray(items) ? items.length : 0 };
  }

  @Post('loss-reasons')
  @Roles(...WRITE)
  @ApiOperation({ summary: 'Create a CRM loss reason' })
  @ApiResponse({ status: 201, description: 'Created' })
  async createLoss(@Body() body: unknown) {
    const dto = LossCreateSchema.parse(body);
    const r = await this.svc.createLossReason(dto);
    if (!r.ok) throwFromError(r.error);
    return r.data;
  }

  @Patch('loss-reasons/:id')
  @Roles(...WRITE)
  @ApiOperation({ summary: 'Update a CRM loss reason' })
  @ApiResponse({ status: 200, description: 'OK' })
  async updateLoss(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const dto = LossUpdateSchema.parse(body);
    const r = await this.svc.updateLossReason(id, dto);
    if (!r.ok) throwFromError(r.error);
    return r.data;
  }

  // ── Funnel stages ────────────────────────────────────────────────────
  @Get('stages')
  @Roles(...READ)
  @ApiOperation({ summary: 'List CRM funnel stages' })
  @ApiResponse({ status: 200, description: 'OK' })
  async listStages(@Query('pipelineId') pipelineId?: string) {
    const pid = pipelineId !== undefined && pipelineId !== '' ? Number(pipelineId) : undefined;
    const items = unwrapOrThrow(await this.svc.listStages(Number.isFinite(pid) ? pid : undefined));
    return { items, total: Array.isArray(items) ? items.length : 0 };
  }

  @Post('stages')
  @Roles(...WRITE)
  @ApiOperation({ summary: 'Create a CRM funnel stage' })
  @ApiResponse({ status: 201, description: 'Created' })
  async createStage(@Body() body: unknown) {
    const dto = StageCreateSchema.parse(body);
    const r = await this.svc.createStage(dto);
    if (!r.ok) throwFromError(r.error);
    return r.data;
  }

  @Patch('stages/:id')
  @Roles(...WRITE)
  @ApiOperation({ summary: 'Update a CRM funnel stage' })
  @ApiResponse({ status: 200, description: 'OK' })
  async updateStage(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const dto = StageUpdateSchema.parse(body);
    const r = await this.svc.updateStage(id, dto);
    if (!r.ok) throwFromError(r.error);
    return r.data;
  }
}
