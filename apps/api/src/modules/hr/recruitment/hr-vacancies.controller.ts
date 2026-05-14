/**
 * @module hr-vacancies.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
Controller, Get, Post, Patch, Put, Body, Param, ParseIntPipe,
  NotFoundException, UseGuards, UseInterceptors, Logger, UsePipes, HttpCode, HttpStatus,
} from '@nestjs/common';
import { unwrapOrInternal } from '@common/http-result';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { HrVacanciesService } from './hr-vacancies.service';
import {
  HrVacancyChannelStatusUpdateSchema, HrVacancyChannelStatusUpdateDto,
  HrUpdatePipelineStageSchema, HrUpdatePipelineStageDto,
  HrProbationReviewSchema, HrProbationReviewDto,
  HrNdaRequestSchema, HrNdaRequestDto,
  HrMakeOfferSchema, HrMakeOfferDto,
  HrAddChecklistSchema, HrAddChecklistDto,
  HrInternalApplySchema, HrInternalApplyDto,
} from './dto/hr-vacancies.dto';

const HR_ROLES = ['SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER', 'HR_SPECIALIST', 'hr_manager', 'hr_recruiter', 'hr', 'admin'] as const;

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...HR_ROLES)
@Controller('hr/recruitment')
export class HrVacanciesController {
  private readonly logger = new Logger(HrVacanciesController.name);

  constructor(private readonly svc: HrVacanciesService) {}

  // ── Vacancies ─────────────────────────────────────────────────────────────

  @Get('vacancies')
  async getVacancies() {
    const r = await this.svc.findAll();
    const rows = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items: rows, total: rows.length };
  }

  @Get('vacancies/:id')
  async getVacancy(@Param('id', ParseIntPipe) id: number) {
    const r = await this.svc.findById(id);
    if (!r.ok || !r.data) throw new NotFoundException(`Vakansiya #${id} topilmadi`);
    return { data: r.data };
  }

  @Post('vacancies/:id/channel-status')
  @UsePipes(new ZodValidationPipe(HrVacancyChannelStatusUpdateSchema))
  async updateChannelStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: HrVacancyChannelStatusUpdateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const channel = body.channel;
    const status = body.status ?? 'active';
    await this.svc.recordFunnelHistory(String(id), `channel_status:${status}`, String(user.id), `channel=${channel}`);
    return { data: { vacancy_id: id, channel, status } };
  }

  @Post('vacancies/:id/telegram-announce')
  async telegramAnnounce(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.svc.recordFunnelHistory(String(id), 'telegram_announced', String(user.id));
    const r = await this.svc.findById(id);
    const row = r.ok ? (r.data ?? {}) : {};
    return { data: { announced: true, vacancy_id: id, title: (row as Record<string, unknown>)['title'], announced_by: user.id } };
  }

  @Post('vacancies/:id/alumni-notify')
  async alumniNotify(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.svc.recordFunnelHistory(String(id), 'alumni_notified', String(user.id));
    const r = await this.svc.findById(id);
    const row = r.ok ? (r.data ?? {}) : {};
    return { data: { notified: true, vacancy_id: id, title: (row as Record<string, unknown>)['title'] } };
  }

  @Get('vacancies/:id/market-analysis')
  async getMarketAnalysis(@Param('id', ParseIntPipe) id: number) {
    const r = await this.svc.findMarketAnalysisByVacancy(id);
    const analysis = r.ok ? (r.data ?? {}) : {};
    return { data: { vacancy_id: id, ...analysis } };
  }

  @Get('vacancies/:id/portret')
  async getPortret(@Param('id', ParseIntPipe) id: number) {
    const r = await this.svc.findById(id);
    const row = r.ok ? (r.data ?? {}) : {};
    return { data: { vacancy_id: id, ...row } };
  }

  @Get('vacancies/:id/channels')
  async getVacancyChannels(@Param('id', ParseIntPipe) id: number) {
    const r = await this.svc.findChannelsByVacancy(id);
    const items = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items, total: items.length };
  }

  // ── Pipeline ──────────────────────────────────────────────────────────────

  @Get('pipeline')
  async getPipeline() {
    const r = await this.svc.findPipeline();
    const rows = r.ok && Array.isArray(r.data) ? r.data : [];
    // Frontend expects { data: [...] } — pipelineData?.data ?? []
    return { data: rows, total: rows.length };
  }

  @Get('pipeline/:id/stage')
  async getPipelineStage(@Param('id', ParseIntPipe) id: number) {
    const r = await this.svc.findPipelineById(id);
    const row = r.ok ? (r.data ?? {}) : {};
    return { data: row };
  }

  @Post('pipeline/:id/stage')
  async updatePipelineStagePost(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const stage = String(body.funnel_stage ?? body.stage ?? '');
    if (!stage) return { data: {}, error: 'stage majburiy' };
    const r = await this.svc.updatePipelineStage(id, stage, user.id);
    const row = r.ok ? (r.data ?? {}) : {};
    return { data: row };
  }

  @Patch('pipeline/:id/stage')
  async updatePipelineStage(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    // Accept both 'stage' (old) and 'funnel_stage' (frontend sends)
    const stage = String(body.funnel_stage ?? body.stage ?? '');
    if (!stage) return { data: {}, error: 'stage majburiy' };
    const r = await this.svc.updatePipelineStage(id, stage, user.id);
    const row = r.ok ? (r.data ?? {}) : {};
    return { data: row };
  }

  @Get('pipeline/:id/roadmap')
  async getPipelineRoadmap(@Param('id', ParseIntPipe) id: number) {
    const r = await this.svc.findRoadmapByPipeline(id);
    const stages = r.ok && Array.isArray(r.data) ? r.data : [];
    return { data: { pipeline_id: id, stages, total: stages.length } };
  }

  @Get('roadmaps')
  async getRoadmaps() {
    const r = await this.svc.findRoadmaps();
    const rows = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items: rows, total: rows.length };
  }

  @Get('pipeline/:id/probation-journal')
  async getProbationJournal(@Param('id', ParseIntPipe) id: number) {
    const r = await this.svc.findProbationJournal(id);
    const entries = r.ok && Array.isArray(r.data) ? r.data : [];
    return { data: { pipeline_id: id, entries, total: entries.length } };
  }

  @Get('pipeline/:id/probation-dates')
  async getProbationDates(@Param('id', ParseIntPipe) id: number) {
    const r = await this.svc.findProbationDates(id);
    const dates = r.ok ? (r.data ?? {}) : {};
    return { data: { pipeline_id: id, start_date: (dates as Record<string, unknown>)['created_at'] ?? null, end_date: (dates as Record<string, unknown>)['hired_at'] ?? null, ...dates } };
  }

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

  @Get('checklist-alerts')
  async getChecklistAlerts() {
    const r = await this.svc.findPipeline();
    const rows = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items: rows.slice(0, 20), total: rows.length };
  }

  @Get('kpi')
  async getKpi() {
    const r = await this.svc.findKpi();
    const rows = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items: rows, total: rows.length };
  }

  @Get('urgent')
  async getUrgent() {
    const r = await this.svc.findUrgent();
    const rows = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items: rows, total: rows.length };
  }

  @Get('worker-type-stats')
  async getWorkerTypeStats() {
    const r = await this.svc.findWorkerTypeStats();
    const rows = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items: rows, total: rows.length };
  }

  @Get('internal-board')
  async getInternalBoard() {
    const r = await this.svc.findInternalBoard();
    const rows = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items: rows, total: rows.length };
  }

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

  @Post('vacancies')
  @HttpCode(HttpStatus.CREATED)
  async createVacancy(@Body() body: Record<string, unknown>) {
    return { data: { id: Date.now(), ...body, created: true } };
  }

  @Post('vacancies/:id/publish')
  @HttpCode(HttpStatus.OK)
  async publishVacancy(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { channels?: string[] },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const channels = Array.isArray(body?.channels) && body.channels.length > 0
      ? body.channels
      : ['telegram'];
    return unwrapOrInternal(await this.svc.publishVacancy(id, channels, user.id));
  }

  @Patch('vacancies/:id/channel-status')
  async patchChannelStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const channel = String(body['channel'] ?? '');
    const status = String(body['status'] ?? 'active');
    await this.svc.recordFunnelHistory(String(id), `channel_status:${status}`, String(user.id), `channel=${channel}`);
    return { data: { vacancy_id: id, channel, status } };
  }

  @Patch('vacancies/:id/channels')
  async patchVacancyChannels(@Param('id', ParseIntPipe) id: number, @Body() body: Record<string, unknown>) {
    return { data: { vacancy_id: id, ...body, updated: true } };
  }

  @Post('vacancies/:id/market-analysis')
  @HttpCode(HttpStatus.OK)
  async postMarketAnalysis(@Param('id', ParseIntPipe) id: number, @Body() _body: Record<string, unknown>) {
    const r = await this.svc.findMarketAnalysisByVacancy(id);
    const analysis = r.ok ? (r.data ?? {}) : {};
    return { data: { vacancy_id: id, ...analysis } };
  }

  @Patch('vacancies/:id/portret')
  async patchPortret(@Param('id', ParseIntPipe) id: number, @Body() body: Record<string, unknown>) {
    return { data: { vacancy_id: id, ...body, updated: true } };
  }

  @Get('pipeline/:id/checklist')
  async getPipelineChecklist(@Param('id', ParseIntPipe) id: number) {
    return { data: { pipeline_id: id, items: [] } };
  }

  @Patch('pipeline/:id/checklist')
  async patchPipelineChecklist(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const items = Array.isArray(body['items']) ? body['items'] : [];
    const notes = `checklist updated: ${JSON.stringify(items).slice(0, 200)}`;
    await this.svc.updateFunnelNotes(id, notes);
    return { data: { pipeline_id: id, updated_by: user.id, items } };
  }

  @Patch('pipeline/:id/probation-dates')
  async patchProbationDates(@Param('id', ParseIntPipe) id: number, @Body() body: Record<string, unknown>) {
    return { data: { pipeline_id: id, ...body, updated: true } };
  }

  @Post('pipeline/:id/probation-journal')
  @HttpCode(HttpStatus.CREATED)
  async createProbationJournalEntry(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.svc.recordFunnelHistory(String(id), 'probation_journal_entry', String(user.id), String(body['note'] ?? ''));
    return { data: { pipeline_id: id, created_by: user.id, ...body } };
  }

  @Get('pipeline/:id/probation-review')
  async getProbationReview(@Param('id', ParseIntPipe) id: number) {
    return { data: { pipeline_id: id, review: null } };
  }

  @Post('pipeline/:id/roadmap')
  @HttpCode(HttpStatus.CREATED)
  async createPipelineRoadmap(@Param('id', ParseIntPipe) id: number, @Body() body: Record<string, unknown>) {
    return { data: { pipeline_id: id, ...body, created: true } };
  }

  // Yollash Kanban: yangi nomzodni pipeline ga qo'shish
  @Post('vacancy/candidates')
  async addCandidateToVacancy(@Body() body: Record<string, unknown>) {
    const candidateId = Number(body.candidate_id);
    const vacancyId   = body.vacancy_id ? Number(body.vacancy_id) : null;
    const source      = String(body.source ?? 'OTHER');
    if (!candidateId) return { ok: false, error: 'candidate_id majburiy' };
    const r = await this.svc.addCandidateToFunnel(vacancyId, candidateId, '', source);
    const row = r.ok ? r.data : {};
    return { data: row };
  }
}
