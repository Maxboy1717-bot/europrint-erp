/**
 * @module hr-vacancies.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 *
 * Rule 16: Pipeline + analytics endpoints live in hr-vacancies-pipeline.controller.ts.
 * Both controllers must be registered in hr.module.ts; this file only holds the vacancy CRUD endpoints.
 */

import {
  Controller, Get, Post, Patch, Body, Param, ParseIntPipe,
  NotFoundException, UseGuards, UseInterceptors, Logger, UsePipes, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { unwrapOrInternal } from '@common/http-result';
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
  HrVacancyChannelStatusUpdateSchema, HrVacancyChannelStatusUpdateDto,
} from './dto/hr-vacancies.dto';
import { z } from 'zod';

const CreateVacancySchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(10000).optional(),
  department: z.string().max(200).optional(),
  salary: z.union([z.string(), z.number()]).optional(),
  status: z.string().max(50).optional(),
}).passthrough();

const PublishVacancySchema = z.object({
  channels: z.array(z.string()).optional(),
}).passthrough();

const PatchChannelStatusSchema = z.object({
  channel: z.string().max(100).optional(),
  status: z.string().max(50).optional(),
}).passthrough();

const PatchVacancyChannelsSchema = z.object({
  channels: z.array(z.union([z.string(), z.record(z.unknown())])).optional(),
}).passthrough();

const MarketAnalysisPostSchema = z.object({
  region: z.string().max(100).optional(),
}).passthrough();

const PatchPortretSchema = z.object({
  experience: z.string().max(500).optional(),
  skills: z.array(z.string()).optional(),
}).passthrough();

export { HrVacanciesPipelineController } from './hr-vacancies-pipeline.controller';
export { HrVacanciesProbationController } from './hr-vacancies-probation.controller';
export { HrVacanciesAnalyticsController } from './hr-vacancies-analytics.controller';

const HR_ROLES = ['SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER', 'HR_SPECIALIST', 'hr_manager', 'hr_recruiter', 'hr', 'admin'] as const;

@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...HR_ROLES)
@ApiTags('Hr Vacancies')
@ApiBearerAuth()
@Controller('hr/recruitment')
export class HrVacanciesController {
  private readonly logger = new Logger(HrVacanciesController.name);

  constructor(private readonly svc: HrVacanciesService) {}

  @ApiOperation({ summary: 'Get vacancies' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('vacancies')
  async getVacancies() {
    const r = await this.svc.findAll();
    const rows = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items: rows, total: rows.length };
  }

  @ApiOperation({ summary: 'Get vacancy' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('vacancies/:id')
  async getVacancy(@Param('id', ParseIntPipe) id: number) {
    const r = await this.svc.findById(id);
    if (!r.ok || !r.data) throw new NotFoundException(`Vakansiya #${id} topilmadi`);
    return { data: r.data };
  }

  @ApiOperation({ summary: 'Update channel status' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
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

  @ApiOperation({ summary: 'Telegram announce' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
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

  @ApiOperation({ summary: 'Alumni notify' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
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

  @ApiOperation({ summary: 'Get market analysis' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('vacancies/:id/market-analysis')
  async getMarketAnalysis(@Param('id', ParseIntPipe) id: number) {
    const r = await this.svc.findMarketAnalysisByVacancy(id);
    const analysis = r.ok ? (r.data ?? {}) : {};
    return { data: { vacancy_id: id, ...analysis } };
  }

  @ApiOperation({ summary: 'Get portret' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('vacancies/:id/portret')
  async getPortret(@Param('id', ParseIntPipe) id: number) {
    const r = await this.svc.findById(id);
    const row = r.ok ? (r.data ?? {}) : {};
    return { data: { vacancy_id: id, ...row } };
  }

  @ApiOperation({ summary: 'Get vacancy channels' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('vacancies/:id/channels')
  async getVacancyChannels(@Param('id', ParseIntPipe) id: number) {
    const r = await this.svc.findChannelsByVacancy(id);
    const items = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Create vacancy' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('vacancies')
  @HttpCode(HttpStatus.CREATED)
  async createVacancy(@Body() body: unknown) {
    const dto = CreateVacancySchema.parse(body);
    // NOTE: salary / vacancy_type / deadline_working_days are intentionally NOT persisted —
    // no canonical column (vacancy_type, deadline_working_days don't exist) or ambiguous min/max
    // mapping (salary). Recorded as a FE<->BE drift gap for a later stage.
    const row = unwrapOrInternal(await this.svc.create({
      title: dto.title,
      description: dto.description,
      department: dto.department,
      status: dto.status,
    }));
    return { data: row };
  }

  @ApiOperation({ summary: 'Publish vacancy' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('vacancies/:id/publish')
  @HttpCode(HttpStatus.OK)
  async publishVacancy(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const dto = PublishVacancySchema.parse(body ?? {});
    const channels = Array.isArray(dto.channels) && dto.channels.length > 0
      ? dto.channels
      : ['telegram'];
    return unwrapOrInternal(await this.svc.publishVacancy(id, channels, user.id));
  }

  @ApiOperation({ summary: 'Patch channel status' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Patch('vacancies/:id/channel-status')
  async patchChannelStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const dto = PatchChannelStatusSchema.parse(body);
    const channel = String(dto.channel ?? '');
    const status = String(dto.status ?? 'active');
    await this.svc.recordFunnelHistory(String(id), `channel_status:${status}`, String(user.id), `channel=${channel}`);
    return { data: { vacancy_id: id, channel, status } };
  }

  @ApiOperation({ summary: 'Patch vacancy channels' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('vacancies/:id/channels')
  async patchVacancyChannels(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const dto = PatchVacancyChannelsSchema.parse(body);
    // Persist posting channels to hr_vacancy_profiles.channels (new nullable jsonb column).
    await db.execute(sql`
      UPDATE hr_vacancy_profiles
      SET channels = ${JSON.stringify(dto.channels ?? [])}::jsonb,
          updated_at = NOW()
      WHERE vacancy_id = ${id}
    `);
    return { data: { vacancy_id: id, ...dto, updated: true } };
  }

  @ApiOperation({ summary: 'Post market analysis' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('vacancies/:id/market-analysis')
  @HttpCode(HttpStatus.OK)
  async postMarketAnalysis(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    MarketAnalysisPostSchema.parse(body ?? {});
    const r = await this.svc.findMarketAnalysisByVacancy(id);
    const analysis = r.ok ? (r.data ?? {}) : {};
    return { data: { vacancy_id: id, ...analysis } };
  }

  @ApiOperation({ summary: 'Patch portret' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('vacancies/:id/portret')
  async patchPortret(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const dto = PatchPortretSchema.parse(body);
    // Merge portret fields into hr_vacancy_profiles.candidate_portrait JSONB (upsert-safe).
    await db.execute(sql`
      UPDATE hr_vacancy_profiles
      SET candidate_portrait = COALESCE(candidate_portrait, '{}'::jsonb) || ${JSON.stringify(dto)}::jsonb,
          updated_at = NOW()
      WHERE vacancy_id = ${id}
    `);
    return { data: { vacancy_id: id, ...dto, updated: true } };
  }
}
