/**
 * @module hr-vacancies-pipeline.controller
 * @description Pipeline core endpoints split from hr-vacancies.controller.ts (Rule 16).
 * Probation-period endpoints live in hr-vacancies-probation.controller.ts.
 * Analytics / internal-board endpoints live in hr-vacancies-analytics.controller.ts.
 * All three are mounted under the same /hr/recruitment prefix.
 */

import {
  Controller, Get, Post, Patch, Body, Param, ParseIntPipe,
  UseGuards, UseInterceptors, Logger, UsePipes, HttpCode, HttpStatus, HttpException,
} from '@nestjs/common';
import { unwrapOrInternal } from '@common/http-result';
import { I18nService } from 'nestjs-i18n';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { HrVacanciesService } from './hr-vacancies.service';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import {
  HrNdaRequestSchema, HrNdaRequestDto,
  HrMakeOfferSchema, HrMakeOfferDto,
  HrAddChecklistSchema, HrAddChecklistDto,
} from './dto/hr-vacancies.dto';
import { z } from 'zod';

const PipelineStageSchema = z.object({
  funnel_stage: z.string().optional(),
  stage: z.string().optional(),
}).passthrough();

const ChecklistSchema = z.object({
  items: z.array(z.union([z.string(), z.record(z.unknown())])).optional(),
}).passthrough();

// P1.17.2: also accept roadmap_data JSON from FE OnboardingRoadmapDialog
const RoadmapSchema = z.object({
  stages:       z.array(z.record(z.unknown())).optional(),
  notes:        z.string().max(2000).optional(),
  roadmap_data: z.record(z.unknown()).optional(),
}).passthrough();

const AddCandidateSchema = z.object({
  candidate_id: z.union([z.string(), z.number()]),
  vacancy_id: z.union([z.string(), z.number()]).optional(),
  source: z.string().max(50).optional(),
}).passthrough();

const HR_ROLES = ['SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER', 'HR_SPECIALIST', 'hr_manager', 'hr_recruiter', 'hr', 'admin'] as const;

@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...HR_ROLES)
@ApiTags('Hr Vacancies Pipeline')
@ApiBearerAuth()
@Controller('hr/recruitment')
export class HrVacanciesPipelineController {
  private readonly logger = new Logger(HrVacanciesPipelineController.name);

  constructor(
    private readonly svc: HrVacanciesService,
    private readonly i18n: I18nService,
  ) {}

  @ApiOperation({ summary: 'Get pipeline' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('pipeline')
  async getPipeline() {
    const r = await this.svc.findPipeline();
    const rows = r.ok && Array.isArray(r.data) ? r.data : [];
    return { data: rows, total: rows.length };
  }

  @ApiOperation({ summary: 'Get pipeline stage' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('pipeline/:id/stage')
  async getPipelineStage(@Param('id', ParseIntPipe) id: number) {
    const r = await this.svc.findPipelineById(id);
    // Rule C: GET /:id → unwrapOrInternal (throws 500 on DB error, not silent {})
    return { data: unwrapOrInternal(r) };
  }

  @ApiOperation({ summary: 'Update pipeline stage post' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('pipeline/:id/stage')
  async updatePipelineStagePost(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const dto = PipelineStageSchema.parse(body);
    const stage = String(dto.funnel_stage ?? dto.stage ?? '');
    if (!stage) return { data: {}, error: 'stage majburiy' };
    const r = await this.svc.updatePipelineStage(id, stage, user.id);
    const row = r.ok ? (r.data ?? {}) : {};
    return { data: row };
  }

  @ApiOperation({ summary: 'Update pipeline stage' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Patch('pipeline/:id/stage')
  async updatePipelineStage(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const dto = PipelineStageSchema.parse(body);
    const stage = String(dto.funnel_stage ?? dto.stage ?? '');
    if (!stage) return { data: {}, error: 'stage majburiy' };
    const r = await this.svc.updatePipelineStage(id, stage, user.id);
    const row = r.ok ? (r.data ?? {}) : {};
    return { data: row };
  }

  @ApiOperation({ summary: 'Get pipeline roadmap' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('pipeline/:id/roadmap')
  async getPipelineRoadmap(@Param('id', ParseIntPipe) id: number) {
    // P1.17.2: include saved roadmap_data alongside stage history
    const [stagesR, savedR] = await Promise.all([
      this.svc.findRoadmapByPipeline(id),
      this.svc.findLatestRoadmapData(id),
    ]);
    const stages = stagesR.ok && Array.isArray(stagesR.data) ? stagesR.data : [];
    const saved = savedR.ok ? savedR.data : null;
    return {
      data: {
        pipeline_id:  id,
        stages,
        total:        stages.length,
        roadmap_data: (saved as Record<string, unknown> | null)?.roadmap_data ?? null,
      },
    };
  }

  @ApiOperation({ summary: 'Get roadmaps' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('roadmaps')
  async getRoadmaps() {
    const r = await this.svc.findRoadmaps();
    const rows = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items: rows, total: rows.length };
  }

  @ApiOperation({ summary: 'Get pipeline report' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('pipeline/:id/report')
  async getPipelineReport(@Param('id', ParseIntPipe) id: number) {
    const [rPipeline, rHistory] = await Promise.all([
      this.svc.findPipelineById(id),
      this.svc.findRoadmapByPipeline(id),
    ]);
    const pipeline = rPipeline.ok ? (rPipeline.data ?? {}) : {};
    const history = rHistory.ok && Array.isArray(rHistory.data) ? rHistory.data : [];
    return { data: { pipeline_id: id, pipeline, history, total_stage_changes: history.length } };
  }

  @ApiOperation({ summary: 'Submit nda request' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('pipeline/:id/nda-request')
  @UsePipes(new ZodValidationPipe(HrNdaRequestSchema))
  async submitNdaRequest(
    @Param('id', ParseIntPipe) id: number,
    @Body() _body: HrNdaRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.svc.recordFunnelHistory(String(id), 'nda_requested', String(user.id), 'NDA request sent');
    return { data: { pipeline_id: id, requested_by: user.id, nda_sent: true } };
  }

  @ApiOperation({ summary: 'Send offer' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('pipeline/:id/offer')
  @UsePipes(new ZodValidationPipe(HrMakeOfferSchema))
  async sendOffer(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: HrMakeOfferDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const salary = body.salary ?? null;
    await this.svc.recordFunnelHistory(String(id), 'offer_sent', String(user.id), `salary=${salary}`);
    return { data: { pipeline_id: id, offer_sent_by: user.id, salary } };
  }

  @ApiOperation({ summary: 'Submit checklist' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('pipeline/:id/checklist')
  @UsePipes(new ZodValidationPipe(HrAddChecklistSchema))
  async submitChecklist(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: HrAddChecklistDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const items = body.items ?? [];
    const notes = `checklist submitted: ${JSON.stringify(items).slice(0, 200)}`;
    await this.svc.updateFunnelNotes(id, notes);
    return { data: { pipeline_id: id, submitted_by: user.id, items } };
  }

  @ApiOperation({ summary: 'Get pipeline checklist (hr_candidate_funnels.checklist_data)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('pipeline/:id/checklist')
  async getPipelineChecklist(@Param('id', ParseIntPipe) id: number) {
    const r = await db.execute(sql`
      SELECT id, candidate_id, vacancy_id, stage, checklist_data, updated_at
      FROM hr_candidate_funnels
      WHERE id = ${id}
    `);
    const row = ((r as { rows?: unknown[] }).rows ?? [])[0] ?? null;
    if (!row) throw new HttpException(await this.i18n.t('errors.notFound'), HttpStatus.NOT_FOUND);
    return { data: row };
  }

  @ApiOperation({ summary: 'Patch pipeline checklist' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Patch('pipeline/:id/checklist')
  async patchPipelineChecklist(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const dto = ChecklistSchema.parse(body);
    const items = Array.isArray(dto.items) ? dto.items : [];
    const notes = `checklist updated: ${JSON.stringify(items).slice(0, 200)}`;
    await this.svc.updateFunnelNotes(id, notes);
    return { data: { pipeline_id: id, updated_by: user.id, items } };
  }

  @ApiOperation({ summary: 'Create pipeline roadmap' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('pipeline/:id/roadmap')
  @HttpCode(HttpStatus.CREATED)
  // P1.17.2: persist roadmap_data to DB instead of returning stub
  async createPipelineRoadmap(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const dto = RoadmapSchema.parse(body);
    const roadmapData = dto.roadmap_data ?? dto;
    const r = await this.svc.createRoadmap(id, roadmapData, String(user?.id ?? 'system'));
    return { data: { pipeline_id: id, saved: r.ok, roadmap_data: roadmapData } };
  }

  // Yollash Kanban: yangi nomzodni pipeline ga qo'shish
  @ApiOperation({ summary: 'Add candidate to vacancy' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('vacancy/candidates')
  async addCandidateToVacancy(@Body() body: unknown) {
    const dto = AddCandidateSchema.parse(body);
    const candidateId = Number(dto.candidate_id);
    const vacancyId   = dto.vacancy_id ? Number(dto.vacancy_id) : null;
    const source      = String(dto.source ?? 'OTHER');
    if (!candidateId) return { ok: false, error: 'candidate_id majburiy' };
    const r = await this.svc.addCandidateToFunnel(vacancyId, candidateId, '', source);
    const row = r.ok ? r.data : {};
    return { data: row };
  }
}
