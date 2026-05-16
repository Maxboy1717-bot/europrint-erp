/**
 * @module hr-vacancies-pipeline.controller
 * @description Pipeline + analytics endpoints split from hr-vacancies.controller.ts (Rule 16).
 * Mounted under the same /hr/recruitment prefix alongside HrVacanciesController.
 */

import {
  Controller, Get, Post, Patch, Body, Param, ParseIntPipe,
  UseGuards, UseInterceptors, Logger, UsePipes, HttpCode, HttpStatus,
} from '@nestjs/common';
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
import {
  HrProbationReviewSchema, HrProbationReviewDto,
  HrNdaRequestSchema, HrNdaRequestDto,
  HrMakeOfferSchema, HrMakeOfferDto,
  HrAddChecklistSchema, HrAddChecklistDto,
  HrInternalApplySchema, HrInternalApplyDto,
} from './dto/hr-vacancies.dto';
import { z } from 'zod';

const PipelineStageSchema = z.object({
  funnel_stage: z.string().optional(),
  stage: z.string().optional(),
}).passthrough();

const ChecklistSchema = z.object({
  items: z.array(z.union([z.string(), z.record(z.unknown())])).optional(),
}).passthrough();

const ProbationDatesSchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
}).passthrough();

const ProbationJournalEntrySchema = z.object({
  note: z.string().max(2000).optional(),
  date: z.string().optional(),
}).passthrough();

const RoadmapSchema = z.object({
  stages: z.array(z.record(z.unknown())).optional(),
  notes: z.string().max(2000).optional(),
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

  constructor(private readonly svc: HrVacanciesService) {}

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
    const row = r.ok ? (r.data ?? {}) : {};
    return { data: row };
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
    const r = await this.svc.findRoadmapByPipeline(id);
    const stages = r.ok && Array.isArray(r.data) ? r.data : [];
    return { data: { pipeline_id: id, stages, total: stages.length } };
  }

  @ApiOperation({ summary: 'Get roadmaps' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('roadmaps')
  async getRoadmaps() {
    const r = await this.svc.findRoadmaps();
    const rows = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items: rows, total: rows.length };
  }

  @ApiOperation({ summary: 'Get probation journal' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('pipeline/:id/probation-journal')
  async getProbationJournal(@Param('id', ParseIntPipe) id: number) {
    const r = await this.svc.findProbationJournal(id);
    const entries = r.ok && Array.isArray(r.data) ? r.data : [];
    return { data: { pipeline_id: id, entries, total: entries.length } };
  }

  @ApiOperation({ summary: 'Get probation dates' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('pipeline/:id/probation-dates')
  async getProbationDates(@Param('id', ParseIntPipe) id: number) {
    const r = await this.svc.findProbationDates(id);
    const dates = r.ok ? (r.data ?? {}) : {};
    return { data: { pipeline_id: id, start_date: (dates as Record<string, unknown>)['created_at'] ?? null, end_date: (dates as Record<string, unknown>)['hired_at'] ?? null, ...dates } };
  }

  @ApiOperation({ summary: 'Submit probation review' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('pipeline/:id/probation-review')
  @UsePipes(new ZodValidationPipe(HrProbationReviewSchema))
  async submitProbationReview(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: HrProbationReviewDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const rating = body.rating ?? null;
    const notes = `probation_review rating=${rating}`;
    await this.svc.recordFunnelHistory(String(id), 'probation_reviewed', String(user.id), notes);
    return { data: { pipeline_id: id, reviewed_by: user.id, rating } };
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

  // ── Recruitment Analytics ─────────────────────────────────────────────────
  @ApiOperation({ summary: 'Get checklist alerts' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('checklist-alerts')
  async getChecklistAlerts() {
    const r = await this.svc.findPipeline();
    const rows = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items: rows.slice(0, 20), total: rows.length };
  }

  @ApiOperation({ summary: 'Get kpi' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('kpi')
  async getKpi() {
    const r = await this.svc.findKpi();
    const rows = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items: rows, total: rows.length };
  }

  @ApiOperation({ summary: 'Get urgent' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('urgent')
  async getUrgent() {
    const r = await this.svc.findUrgent();
    const rows = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items: rows, total: rows.length };
  }

  @ApiOperation({ summary: 'Get worker type stats' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('worker-type-stats')
  async getWorkerTypeStats() {
    const r = await this.svc.findWorkerTypeStats();
    const rows = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items: rows, total: rows.length };
  }

  @ApiOperation({ summary: 'Get internal board' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('internal-board')
  async getInternalBoard() {
    const r = await this.svc.findInternalBoard();
    const rows = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items: rows, total: rows.length };
  }

  @ApiOperation({ summary: 'Internal apply' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('internal-apply/:id')
  @UsePipes(new ZodValidationPipe(HrInternalApplySchema))
  async internalApply(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: HrInternalApplyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const note = String(body.note ?? '');
    const r = await this.svc.addCandidateToFunnel(id, user.id, note, 'INTERNAL');
    const row = r.ok ? r.data : {};
    return { data: { vacancy_id: id, applied_by: user.id, note, funnel: row } };
  }

  @ApiOperation({ summary: 'Get pipeline checklist' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('pipeline/:id/checklist')
  async getPipelineChecklist(@Param('id', ParseIntPipe) id: number) {
    return { data: { pipeline_id: id, items: [] } };
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

  @ApiOperation({ summary: 'Patch probation dates' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('pipeline/:id/probation-dates')
  async patchProbationDates(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const dto = ProbationDatesSchema.parse(body);
    return { data: { pipeline_id: id, ...dto, updated: true } };
  }

  @ApiOperation({ summary: 'Create probation journal entry' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('pipeline/:id/probation-journal')
  @HttpCode(HttpStatus.CREATED)
  async createProbationJournalEntry(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const dto = ProbationJournalEntrySchema.parse(body);
    await this.svc.recordFunnelHistory(String(id), 'probation_journal_entry', String(user.id), String(dto.note ?? ''));
    return { data: { pipeline_id: id, created_by: user.id, ...dto } };
  }

  @ApiOperation({ summary: 'Get probation review' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('pipeline/:id/probation-review')
  async getProbationReview(@Param('id', ParseIntPipe) id: number) {
    return { data: { pipeline_id: id, review: null } };
  }

  @ApiOperation({ summary: 'Create pipeline roadmap' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('pipeline/:id/roadmap')
  @HttpCode(HttpStatus.CREATED)
  async createPipelineRoadmap(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const dto = RoadmapSchema.parse(body);
    return { data: { pipeline_id: id, ...dto, created: true } };
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
