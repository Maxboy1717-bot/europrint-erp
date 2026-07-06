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
import { I18nService } from 'nestjs-i18n';
import { EventEmitter2 } from '@nestjs/event-emitter';
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
  // Phase 7 (D4): card link + priority + counts + closing_date — now persisted (were dropped).
  orgFunctionId: z.number().int().positive().optional(),
  priority: z.string().max(50).optional(),
  openPositions: z.number().int().nonnegative().optional(),
  numberOfPositions: z.number().int().nonnegative().optional(),
  closingDate: z.string().optional(),
}).passthrough();

const BulkVacancySchema = z.object({
  items: z.array(z.object({
    title: z.string().min(1).max(500),
    description: z.string().max(10000).optional(),
    department: z.string().max(200).optional(),
    status: z.string().max(50).optional(),
    orgFunctionId: z.number().int().positive().optional(),
    priority: z.string().max(50).optional(),
    openPositions: z.number().int().nonnegative().optional(),
    numberOfPositions: z.number().int().nonnegative().optional(),
    closingDate: z.string().optional(),
  })).min(1).max(500),
});

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

  constructor(
    private readonly svc: HrVacanciesService,
    private readonly events: EventEmitter2,
    private readonly i18n: I18nService,
  ) {}

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
    if (!r.ok || !r.data) throw new NotFoundException(await this.i18n.t('errors.vacancyNotFoundWithId', { args: { id } }));
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
    const r = await this.svc.findById(id);
    const row = (r.ok ? (r.data ?? {}) : {}) as Record<string, unknown>;
    const title = String(row['title'] ?? `Vakansiya #${id}`);
    // R5 fix: this endpoint now emits its OWN event, 'vacancy.telegram-announce-requested',
    // consumed by TelegramBotsCronRecruitmentService.onTelegramAnnounceRequested
    // (hr/telegram-bots/telegram-bots-cron-recruitment.service.ts). That listener targets the
    // ACTIVE (non-archived) candidate pool — the audience this endpoint's response claims to
    // reach — via the same keyword/embedding matching used for boomerang, then dispatches
    // Telegram (telegram_chat_id) + SMS (phone) fallback.
    // Previously this endpoint emitted the SAME 'vacancy.published' event as alumni-notify,
    // which only the boomerang/alumni listener consumed — "matched candidates" was never
    // actually reached (no-op beyond the funnel-history write).
    this.events.emit('vacancy.telegram-announce-requested', {
      vacancyId: id,
      title,
      department: row['department'] ? String(row['department']) : undefined,
    });
    await this.svc.recordFunnelHistory(String(id), 'telegram_announced', String(user.id));
    return {
      data: {
        dispatched: true,
        vacancy_id: id,
        title,
        announced_by: user.id,
        note: 'Telegram/SMS yuborish fon jarayonida amalga oshiriladi (vacancy.telegram-announce-requested hodisasi orqali, faol nomzodlar bazasiga); natija darhol qaytmaydi. Eslatma: nomzodlarning aksariyatida hozircha telegram_chat_id yo\'q — SMS integratsiyasi ham sozlanmagan (SMS_API_URL/SMS_API_KEY) bo\'lsa, yetkazish faqat mos ma\'lumot mavjud bo\'lgan nomzodlarga amalga oshadi.',
      },
    };
  }

  @ApiOperation({ summary: 'Alumni notify' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('vacancies/:id/alumni-notify')
  async alumniNotify(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const r = await this.svc.findById(id);
    const row = (r.ok ? (r.data ?? {}) : {}) as Record<string, unknown>;
    const title = String(row['title'] ?? `Vakansiya #${id}`);
    // Q11 fix: real dispatch to alumni/boomerang candidates — 'vacancy.published' event;
    // TelegramBotsCronRecruitmentService.onVacancyPublished queries ex-employees who left 2+
    // years ago (getBoomerangCandidates), ranks them, and sends real Telegram/SMS. Previously
    // this endpoint only wrote a history row and echoed { notified: true } with no dispatch.
    // R5 note: this event/listener pair is DISTINCT from telegramAnnounce()'s
    // 'vacancy.telegram-announce-requested' below — different audience (boomerang alumni vs.
    // the active candidate pool), on purpose. Do not merge them back into one event.
    this.events.emit('vacancy.published', {
      vacancyId: id,
      title,
      department: row['department'] ? String(row['department']) : undefined,
    });
    await this.svc.recordFunnelHistory(String(id), 'alumni_notified', String(user.id));
    return {
      data: {
        dispatched: true,
        vacancy_id: id,
        title,
        note: 'Alumni (2+ yil oldin ketgan xodimlar) ga Telegram/SMS fon jarayonida yuboriladi (vacancy.published hodisasi orqali); natija darhol qaytmaydi.',
      },
    };
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
    // NOTE: salary / vacancy_type / deadline_working_days still NOT persisted — no canonical single
    // column. Phase 7 (D4) NOW persists the card link + priority + counts + closing_date (were dropped).
    const row = unwrapOrInternal(await this.svc.create({
      title: dto.title,
      description: dto.description,
      department: dto.department,
      status: dto.status,
      orgFunctionId: dto.orgFunctionId ?? null,
      priority: dto.priority ?? null,
      openPositions: dto.openPositions ?? null,
      numberOfPositions: dto.numberOfPositions ?? null,
      closingDate: dto.closingDate ?? null,
    }));
    return { data: row };
  }

  @ApiOperation({ summary: 'Bulk-import vacancies (EP-ORG-075/076)' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('vacancies/bulk')
  @HttpCode(HttpStatus.CREATED)
  async bulkVacancies(@Body() body: unknown) {
    const dto = BulkVacancySchema.parse(body);
    return unwrapOrInternal(await this.svc.bulkCreate(dto.items.map((i) => ({
      title: i.title, description: i.description, department: i.department, status: i.status,
      orgFunctionId: i.orgFunctionId ?? null, priority: i.priority ?? null,
      openPositions: i.openPositions ?? null, numberOfPositions: i.numberOfPositions ?? null,
      closingDate: i.closingDate ?? null,
    }))));
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
    const dto = MarketAnalysisPostSchema.parse(body ?? {});
    // Q12 fix: actually persist the submitted analysis (hr_vacancy_profiles.market_analysis)
    // — previously this discarded `dto` entirely and just echoed back a read.
    const saved = unwrapOrInternal(await this.svc.saveMarketAnalysis(id, dto));
    return { data: { vacancy_id: id, ...saved } };
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
