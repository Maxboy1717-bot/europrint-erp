/**
 * @module marketing-analytics-stubs.controller
 * @description Marketing endpoints wired to real tables (Phase 1 DDL-free sweep 2026-06-06).
 * All stubs replaced with real SQL against: exhibitions, exhibition_leads, marketing_ab_tests,
 * marketing_settings, social_api_configs, blog_posts.
 * DDL-NEEDED (no table): PR releases, inbox conversations, AI routes → see running doc.
 */

import {
  Controller, Get, Post, Delete, Patch, Param, Body, Query,
  UseGuards, Logger, HttpCode, HttpStatus, HttpException, NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { z } from 'zod';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { unwrapOrThrow } from '@common/http-result';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { MarketingExtService } from '../application/marketing-ext.service';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';

function stub(route: string): never {
  throw new HttpException(
    { message: `Endpoint not yet implemented: ${route}`, code: 'NOT_IMPLEMENTED' },
    HttpStatus.NOT_IMPLEMENTED,
  );
}

type Row = Record<string, unknown>;
const rows = (r: unknown): Row[] => ((r as { rows?: Row[] }).rows) ?? [];
const first = (r: unknown): Row | null => rows(r)[0] ?? null;

const ExhibitionSchema = z.object({
  name: z.string().max(500).optional(),
  location: z.string().max(500).optional(),
  country: z.string().max(100).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  budget: z.number().optional(),
  description: z.string().optional(),
  status: z.string().max(50).optional(),
}).passthrough();

const ExhibitionLeadSchema = z.object({
  name: z.string().max(500).optional(),
  full_name: z.string().max(500).optional(),
  company: z.string().max(500).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().max(200).optional(),
  interest: z.string().optional(),
  estimated_volume: z.string().max(200).optional(),
  notes: z.string().optional(),
}).passthrough();

const SocialApiSchema = z.object({
  platform: z.string().max(100).optional(),
  bot_token: z.string().max(500).optional(),
  webhook_secret: z.string().max(500).optional(),
  is_active: z.boolean().optional(),
  settings: z.record(z.unknown()).optional(),
}).passthrough();

const SettingsPatchSchema = z.object({
  value: z.string().optional(),
}).passthrough();

const TelegramWebhookSchema = z.object({
  bot_token: z.string().max(500).optional(),
  webhook_url: z.string().max(500).optional(),
}).passthrough();

const StubBodySchema = z.record(z.unknown());

const PrActivitySchema = z.object({
  type:         z.string().max(100).optional(),
  title:        z.string().max(500).optional(),
  media:        z.string().max(200).optional(),
  media_name:   z.string().max(200).optional(),
  date:         z.string().optional(),
  publish_date: z.string().optional(),
  url:          z.string().max(1000).optional(),
  reach:        z.number().int().optional(),
  sentiment:    z.string().max(50).optional(),
  status:       z.string().max(50).optional(),
  description:  z.string().optional(),
  notes:        z.string().optional(),
}).passthrough();

const InboxReplySchema = z.object({
  message: z.string().max(5000).optional(),
  content: z.string().max(5000).optional(),
}).passthrough();

const InboxStatusSchema = z.object({
  status: z.string().max(50).optional(),
}).passthrough();

@ApiTags('§17 Marketing Analytics')
@ApiBearerAuth()
@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('marketing')
@Roles('super_admin', 'director', 'manager')
export class MarketingAnalyticsStubsController {
  private readonly logger = new Logger(MarketingAnalyticsStubsController.name);

  constructor(private readonly svc: MarketingExtService) {}

  // -- Content ---------------------------------------------------------------
  @Post('content/ai-generate') @Roles('super_admin', 'marketing_manager', 'director')
  async aiGenerateContent(@Body() _body: unknown) { return stub('POST /marketing/content/ai-generate'); }

  // -- NPS & Churn (already real via MarketingExtService) --------------------
  @Get('nps/stats')
  @Roles('super_admin', 'marketing_manager', 'director')
  async getNpsStats() {
    return unwrapOrThrow(await this.svc.getNpsStats());
  }

  @Get('nps/monthly')
  @Roles('super_admin', 'marketing_manager', 'director')
  async getNpsMonthly() {
    const r = await this.svc.getNpsStats();
    if (!r.ok) return { monthlyTrend: [] };
    return { monthlyTrend: r.data.monthlyTrend };
  }

  @Get('nps')
  @Roles('super_admin', 'marketing_manager', 'director')
  async getNps() {
    return unwrapOrThrow(await this.svc.getNps());
  }

  @Post('nps')
  @Roles('super_admin', 'marketing_manager', 'director', 'manager')
  @HttpCode(HttpStatus.CREATED)
  async createNpsResponse(@Body() body: unknown) {
    const dto = (body ?? {}) as Record<string, unknown>;
    const score = Number(dto['score'] ?? dto['npsScore'] ?? 0);
    const r = await db.execute(sql`
      INSERT INTO nps_responses (id, papka_order_id, customer_id, score, comment, created_at)
      VALUES (
        gen_random_uuid()::text,
        ${dto['papka_order_id'] ?? dto['orderId'] ?? null}::int,
        ${dto['customer_id'] ?? dto['customerId'] ?? null}::int,
        ${score}::int,
        ${dto['comment'] ?? dto['feedback'] ?? null}::text,
        NOW()
      )
      RETURNING id, score
    `);
    const row = rows(r)[0] ?? null;
    return { message: 'NPS javobi saqlandi', data: row };
  }

  @Get('churn-risk/ai-signal')
  @Roles('super_admin', 'marketing_manager', 'director')
  async getChurnRiskAiSignal() {
    return unwrapOrThrow(await this.svc.getChurnRisk());
  }

  @Get('churn-risk')
  @Roles('super_admin', 'marketing_manager', 'director')
  async getChurnRisk() {
    return unwrapOrThrow(await this.svc.getChurnRisk());
  }

  @Post('churn-risk/ai-signal') @Roles('super_admin', 'marketing_manager', 'director') @HttpCode(HttpStatus.OK)
  async postChurnRiskAiSignal(@Body() _body: unknown) { return stub('POST /marketing/churn-risk/ai-signal'); }

  // -- AI / Leads (already real or AI-gated) --------------------------------
  @Get('ai/hot-leads')
  @Roles('super_admin', 'marketing_manager', 'director', 'sales_manager')
  async getAiHotLeads() {
    return unwrapOrThrow(await this.svc.getHotLeads());
  }

  @Get('ai-assistant') @Roles('super_admin', 'marketing_manager', 'director')
  async getAiAssistant() { return stub('GET /marketing/ai-assistant'); }

  @Post('ai-assistant') @Roles('super_admin', 'marketing_manager', 'director')
  @HttpCode(HttpStatus.OK)
  async postAiAssistant(@Body() body: unknown) { return stub('POST /marketing/ai-assistant'); }

  @Get('leads/sources/summary')
  @Roles('super_admin', 'marketing_manager', 'director')
  async getLeadsSourcesSummary() {
    return unwrapOrThrow(await this.svc.getLeadsSourcesSummary());
  }

  @Get('leads/automation/overdue-leads')
  @Roles('super_admin', 'marketing_manager', 'director')
  async getAutomationOverdueLeads() {
    return unwrapOrThrow(await this.svc.getOverdueLeads());
  }

  @Post('leads/recalculate-scores') @Roles('super_admin', 'marketing_manager', 'director')
  @HttpCode(HttpStatus.OK)
  async recalculateLeadScores(@Body() _body: unknown) {
    return stub('POST /marketing/leads/recalculate-scores');
  }

  @Post('leads/:id/convert-to-crm') @Roles('super_admin', 'marketing_manager', 'director', 'sales_manager')
  async convertLeadToCrm(@Param('id') _id: string) { return stub('POST /marketing/leads/:id/convert-to-crm'); }

  // -- Inbox (no table — DDL-NEEDED) ----------------------------------------
  @Get('inbox/stats')
  @Roles('super_admin', 'marketing_manager', 'director')
  async getInboxStats() {
    return unwrapOrThrow(await this.svc.getInboxStats());
  }

  @Get('inbox/conversations') @Roles('super_admin', 'marketing_manager', 'director')
  async getInboxConversations(@Query('platform') platform?: string, @Query('status') status?: string) {
    const data = rows(await db.execute(sql`
      SELECT * FROM social_conversations
      WHERE (${platform ?? null} IS NULL OR platform=${platform ?? null})
        AND (${status ?? null} IS NULL OR status=${status ?? null})
      ORDER BY last_message_at DESC NULLS LAST
      LIMIT 50
    `));
    return { items: data, total: data.length };
  }

  @Get('inbox/conversations/:id/messages') @Roles('super_admin', 'marketing_manager', 'director')
  async getConversationMessages(@Param('id') id: string) {
    const convId = parseInt(id, 10);
    const data = rows(await db.execute(sql`
      SELECT * FROM social_messages
      WHERE conversation_id=${isNaN(convId) ? 0 : convId}
      ORDER BY sent_at ASC
      LIMIT 200
    `));
    return { items: data, total: data.length };
  }

  @Post('inbox/conversations/:id/reply') @Roles('super_admin', 'marketing_manager', 'director')
  @HttpCode(HttpStatus.CREATED)
  async replyToConversation(@Param('id') id: string, @Body() body: unknown) {
    const dto = InboxReplySchema.parse(body ?? {});
    const convId = parseInt(id, 10);
    const msgId = `MSG-${Date.now()}`;
    const row = first(await db.execute(sql`
      INSERT INTO social_messages (id, conversation_id, direction, text, is_read, is_ai, sent_at)
      VALUES (${msgId}, ${isNaN(convId) ? 0 : convId}, 'outbound',
              ${String(dto.message ?? dto.content ?? '')}, true, false, NOW())
      RETURNING *
    `));
    await db.execute(sql`
      UPDATE social_conversations SET last_message=${String(dto.message ?? dto.content ?? '')},
        last_message_at=NOW(), updated_at=NOW() WHERE id=${id}
    `);
    return { data: row };
  }

  @Post('inbox/ai-reply/:id') @Roles('super_admin', 'marketing_manager', 'director')
  async aiReplyToConversation(@Param('id') _id: string) { return stub('POST /marketing/inbox/ai-reply/:id'); }

  @Patch('inbox/conversations/:id/status') @Roles('super_admin', 'marketing_manager', 'director')
  async updateConversationStatus(@Param('id') id: string, @Body() body: unknown) {
    const dto = InboxStatusSchema.parse(body ?? {});
    await db.execute(sql`
      UPDATE social_conversations SET status=${dto.status ?? 'open'}, updated_at=NOW() WHERE id=${id}
    `);
    return { id, updated: true };
  }

  // -- A/B tests (marketing_ab_tests EXISTS) ---------------------------------
  @Get('ab-tests') @Roles('super_admin', 'marketing_manager', 'director')
  async getAbTests() {
    return { items: rows(await db.execute(sql`SELECT * FROM marketing_ab_tests ORDER BY created_at DESC`)) };
  }

  // -- Exhibitions (exhibitions + exhibition_leads EXIST) --------------------
  @Get('exhibitions') @Roles('super_admin', 'marketing_manager', 'director')
  async getExhibitions() {
    const data = rows(await db.execute(sql`
      SELECT * FROM exhibitions WHERE deleted_at IS NULL ORDER BY created_at DESC
    `));
    return { items: data, total: data.length };
  }

  @Get('exhibitions/:id') @Roles('super_admin', 'marketing_manager', 'director')
  async getExhibitionById(@Param('id') id: string) {
    const row = first(await db.execute(sql`
      SELECT * FROM exhibitions WHERE id=${id} AND deleted_at IS NULL LIMIT 1
    `));
    if (!row) throw new NotFoundException(`Exposition #${id} not found`);
    return { data: row };
  }

  @Get('exhibitions/:id/leads') @Roles('super_admin', 'marketing_manager', 'director')
  async getExhibitionLeads(@Param('id') id: string) {
    const data = rows(await db.execute(sql`
      SELECT * FROM exhibition_leads WHERE exhibition_id::text=${id} ORDER BY created_at DESC
    `));
    return { items: data, total: data.length };
  }

  @Get('exhibitions/:id/qr') @Roles('super_admin', 'marketing_manager', 'director')
  async getExhibitionQr(@Param('id') id: string) {
    const row = first(await db.execute(sql`
      SELECT id, name, qr_code FROM exhibitions WHERE id=${id} AND deleted_at IS NULL LIMIT 1
    `));
    if (!row) throw new NotFoundException(`Exposition #${id} not found`);
    return { data: row };
  }

  @Post('exhibitions') @Roles('super_admin', 'marketing_manager') @HttpCode(HttpStatus.CREATED)
  async createExhibition(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    const dto = ExhibitionSchema.parse(body ?? {});
    const r = await db.execute(sql`
      INSERT INTO exhibitions (id, name, location, country, start_date, end_date, budget, description, status, created_at, updated_at)
      VALUES (
        gen_random_uuid()::text,
        ${dto.name ?? 'Unnamed'},
        ${dto.location ?? null},
        ${dto.country ?? null},
        ${dto.start_date ? `${dto.start_date}` : null}::timestamp,
        ${dto.end_date ? `${dto.end_date}` : null}::timestamp,
        ${dto.budget ?? null},
        ${dto.description ?? null},
        ${dto.status ?? 'planned'},
        NOW(), NOW()
      ) RETURNING *
    `);
    return { data: first(r) };
  }

  @Post('exhibitions/:id/leads') @Roles('super_admin', 'marketing_manager', 'director') @HttpCode(HttpStatus.CREATED)
  async createExhibitionLead(@Param('id') id: string, @Body() body: unknown) {
    const dto = ExhibitionLeadSchema.parse(body ?? {});
    const r = await db.execute(sql`
      INSERT INTO exhibition_leads (id, exhibition_id, name, full_name, company, phone, email, interest, estimated_volume, notes, scanned_at, created_at)
      VALUES (
        gen_random_uuid()::text,
        ${parseInt(id, 10)},
        ${dto.name ?? dto.full_name ?? ''},
        ${dto.full_name ?? dto.name ?? null},
        ${dto.company ?? null},
        ${dto.phone ?? null},
        ${dto.email ?? null},
        ${dto.interest ?? null},
        ${dto.estimated_volume ?? null},
        ${dto.notes ?? null},
        NOW(), NOW()
      ) RETURNING *
    `);
    return { data: first(r) };
  }

  @Post('exhibitions/:id/qr') @Roles('super_admin', 'marketing_manager') @HttpCode(HttpStatus.OK)
  async generateExhibitionQr(@Param('id') id: string) {
    const code = `EXH-${id}-${Date.now()}`;
    await db.execute(sql`
      UPDATE exhibitions SET qr_code=${code}, updated_at=NOW() WHERE id=${id} AND deleted_at IS NULL
    `);
    return { data: { exhibition_id: id, qr_code: code } };
  }

  @Patch('exhibitions/:id') @Roles('super_admin', 'marketing_manager')
  async updateExhibition(@Param('id') id: string, @Body() body: unknown) {
    const dto = z.object({
      name:        z.string().max(500).optional(),
      location:    z.string().max(500).optional(),
      country:     z.string().max(100).optional(),
      start_date:  z.string().optional(),
      end_date:    z.string().optional(),
      budget:      z.number().optional(),
      description: z.string().max(2000).optional(),
      status:      z.string().max(50).optional(),
    }).passthrough().parse(body);
    const r = await db.execute(sql`
      UPDATE exhibitions SET
        name        = COALESCE(${dto.name        ?? null}, name),
        location    = COALESCE(${dto.location    ?? null}, location),
        country     = COALESCE(${dto.country     ?? null}, country),
        start_date  = COALESCE(${dto.start_date  ?? null}::date, start_date),
        end_date    = COALESCE(${dto.end_date    ?? null}::date, end_date),
        budget      = COALESCE(${dto.budget      ?? null}, budget),
        description = COALESCE(${dto.description ?? null}, description),
        status      = COALESCE(${dto.status      ?? null}, status),
        updated_at  = NOW()
      WHERE id = ${id} AND deleted_at IS NULL
      RETURNING *
    `);
    const row = rows(r)[0] ?? null;
    if (!row) throw new NotFoundException('Ko\'rgazma topilmadi');
    return { data: row };
  }

  @Delete('exhibitions/:id') @Roles('super_admin', 'marketing_manager') @HttpCode(HttpStatus.OK)
  async deleteExhibition(@Param('id') id: string) {
    await db.execute(sql`
      UPDATE exhibitions SET deleted_at = NOW() WHERE id = ${id} AND deleted_at IS NULL
    `);
    return { id, deleted: true };
  }

  // -- PR (pr_activities table) ---------------------------------------------
  @Get('pr') @Roles('super_admin', 'marketing_manager', 'director')
  async getPr(@Query('limit') limit?: string) {
    const lim = Math.min(parseInt(limit ?? '100', 10) || 100, 500);
    const data = rows(await db.execute(sql`
      SELECT * FROM pr_activities WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT ${lim}
    `));
    return { items: data, total: data.length };
  }

  @Get('pr/:id') @Roles('super_admin', 'marketing_manager', 'director')
  async getPrById(@Param('id') id: string) {
    const row = first(await db.execute(sql`
      SELECT * FROM pr_activities WHERE id=${id} AND deleted_at IS NULL LIMIT 1
    `));
    if (!row) throw new NotFoundException(`PR activity #${id} not found`);
    return { data: row };
  }

  @Post('pr') @Roles('super_admin', 'marketing_manager') @HttpCode(HttpStatus.CREATED)
  async createPr(@Body() body: unknown) {
    const dto = PrActivitySchema.parse(body ?? {});
    const id = `PR-${Date.now()}`;
    const row = first(await db.execute(sql`
      INSERT INTO pr_activities (id, type, title, media, media_name, date, publish_date, url, reach, sentiment, status, description, notes, created_at, updated_at)
      VALUES (${id}, ${dto.type ?? 'press_release'}, ${dto.title ?? 'Untitled'}, ${dto.media ?? null}, ${dto.media_name ?? null},
              ${dto.date ?? null}::timestamp, ${dto.publish_date ?? null}::timestamp,
              ${dto.url ?? null}, ${dto.reach ?? 0}, ${dto.sentiment ?? null},
              ${dto.status ?? 'planned'}, ${dto.description ?? null}, ${dto.notes ?? null},
              NOW(), NOW())
      RETURNING *
    `));
    return { data: row };
  }

  @Patch('pr/:id') @Roles('super_admin', 'marketing_manager')
  async updatePr(@Param('id') id: string, @Body() body: unknown) {
    const dto = PrActivitySchema.parse(body ?? {});
    await db.execute(sql`
      UPDATE pr_activities SET
        type        = COALESCE(${dto.type        ?? null}, type),
        title       = COALESCE(${dto.title       ?? null}, title),
        media       = COALESCE(${dto.media       ?? null}, media),
        media_name  = COALESCE(${dto.media_name  ?? null}, media_name),
        status      = COALESCE(${dto.status      ?? null}, status),
        description = COALESCE(${dto.description ?? null}, description),
        notes       = COALESCE(${dto.notes       ?? null}, notes),
        reach       = COALESCE(${dto.reach !== undefined ? dto.reach : null}, reach),
        sentiment   = COALESCE(${dto.sentiment   ?? null}, sentiment),
        updated_at  = NOW()
      WHERE id=${id} AND deleted_at IS NULL
    `);
    return { id, updated: true };
  }

  @Delete('pr/:id') @Roles('super_admin', 'marketing_manager')
  async deletePr(@Param('id') id: string) {
    await db.execute(sql`
      UPDATE pr_activities SET deleted_at=NOW() WHERE id=${id} AND deleted_at IS NULL
    `);
    return { id, deleted: true };
  }

  // -- Settings (marketing_settings + social_api_configs EXIST) -------------
  @Get('settings') @Roles('super_admin', 'marketing_manager')
  async getSettings() {
    return { items: rows(await db.execute(sql`SELECT id, key, value, category, description, updated_at FROM marketing_settings ORDER BY category, key`)) };
  }

  @Get('settings/social-api') @Roles('super_admin', 'marketing_manager')
  async getSocialApiSettings() {
    // exclude access_token, bot_token, webhook_secret for security
    return { items: rows(await db.execute(sql`SELECT id, platform, page_id, account_id, is_active, last_sync_at, settings, updated_at FROM social_api_configs ORDER BY platform`)) };
  }

  @Post('settings') @Roles('super_admin', 'marketing_manager') @HttpCode(HttpStatus.OK)
  async saveSettings(@Body() body: unknown) {
    const dto = (z.record(z.string())).parse(body ?? {});
    for (const [key, value] of Object.entries(dto)) {
      await db.execute(sql`
        INSERT INTO marketing_settings (id, key, value, updated_at)
        VALUES (gen_random_uuid()::text, ${key}, ${value}, NOW())
        ON CONFLICT (key) DO UPDATE SET value=${value}, updated_at=NOW()
      `);
    }
    return { updated: Object.keys(dto).length };
  }

  @Post('settings/social-api') @Roles('super_admin', 'marketing_manager')
  async createSocialApiSetting(@Body() body: unknown) {
    const dto = SocialApiSchema.parse(body ?? {});
    const r = await db.execute(sql`
      INSERT INTO social_api_configs (id, platform, bot_token, webhook_secret, is_active, settings, updated_at)
      VALUES (
        gen_random_uuid()::text,
        ${dto.platform ?? 'unknown'},
        ${dto.bot_token ?? null},
        ${dto.webhook_secret ?? null},
        ${dto.is_active ?? true},
        ${JSON.stringify(dto.settings ?? {})}::jsonb,
        NOW()
      ) RETURNING id, platform, is_active, updated_at
    `);
    return { data: first(r) };
  }

  @Delete('settings/social-api/:id') @Roles('super_admin', 'marketing_manager')
  async deleteSocialApiSetting(@Param('id') id: string) {
    await db.execute(sql`DELETE FROM social_api_configs WHERE id=${id}`);
    return { id, deleted: true };
  }

  @Patch('settings/social-api/:id') @Roles('super_admin', 'marketing_manager')
  async patchSocialApiSetting(@Param('id') id: string, @Body() body: unknown) {
    const dto = SocialApiSchema.partial().parse(body ?? {});
    await db.execute(sql`
      UPDATE social_api_configs SET
        platform  = COALESCE(${dto.platform   ?? null}, platform),
        is_active = COALESCE(${dto.is_active  ?? null}, is_active),
        settings  = COALESCE(${dto.settings ? JSON.stringify(dto.settings) : null}::jsonb, settings),
        updated_at = NOW()
      WHERE id=${id}
    `);
    return { id, updated: true };
  }

  @Post('settings/setup-telegram-webhook') @Roles('super_admin', 'marketing_manager')
  async setupTelegramWebhook(@Body() body: unknown) {
    const dto = TelegramWebhookSchema.parse(body ?? {});
    await db.execute(sql`
      UPDATE social_api_configs
      SET bot_token=${dto.bot_token ?? null},
          webhook_secret=${dto.webhook_url ?? null},
          updated_at=NOW()
      WHERE platform='telegram'
    `);
    return { configured: true, platform: 'telegram' };
  }

  @Patch('settings/:id') @Roles('super_admin', 'marketing_manager')
  async patchSettingById(@Param('id') id: string, @Body() body: unknown) {
    const dto = SettingsPatchSchema.parse(body ?? {});
    await db.execute(sql`
      UPDATE marketing_settings SET value=${dto.value ?? null}, updated_at=NOW() WHERE id=${id}
    `);
    return { id, updated: true };
  }

  // -- Website / Blog (blog_posts EXISTS) ------------------------------------
  @Patch('website/blog/:id/publish') @Roles('super_admin', 'marketing_manager')
  async patchPublishBlogPost(@Param('id') id: string) {
    await db.execute(sql`
      UPDATE blog_posts SET is_published=true, published_at=COALESCE(published_at, NOW()), updated_at=NOW() WHERE id=${id}
    `);
    return { id, published: true };
  }

  @Post('website/blog/ai-generate') @Roles('super_admin', 'marketing_manager')
  async aiGenerateBlogPost(@Body() _body: unknown) { return stub('POST /marketing/website/blog/ai-generate'); }

  // -- Overview (root) — aggregate from live tables --------------------------
  @Get() @Roles('super_admin', 'marketing_manager', 'director', 'manager')
  async getMarketingOverview() {
    const r = await db.execute(sql`
      SELECT
        (SELECT COUNT(*)::int FROM marketing_leads)      AS total_leads,
        (SELECT COUNT(*)::int FROM marketing_campaigns)  AS total_campaigns,
        (SELECT COUNT(*)::int FROM exhibitions WHERE deleted_at IS NULL) AS total_exhibitions,
        (SELECT COUNT(*)::int FROM marketing_ab_tests)   AS total_ab_tests,
        (SELECT COUNT(*)::int FROM blog_posts WHERE is_published=true) AS published_posts
    `);
    return { data: first(r) };
  }
}
