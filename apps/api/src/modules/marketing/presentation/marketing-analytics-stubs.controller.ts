/**
 * @module marketing-analytics-stubs.controller
 * @description Marketing endpoints that have no real service implementation yet.
 * Per CLAUDE.md Rule 10, an unimplemented endpoint MUST NOT throw 501 — it must
 * return a typed empty payload so the frontend renders an empty state instead of
 * an error overlay. Future work: replace each `empty*()` return with a real
 * service call. The shape of each return below matches what the corresponding
 * frontend page expects.
 *
 * NOTE: This file intentionally returns empty payloads. It is the documented
 * "future-feature placeholder" pattern.
 */

import {
  Controller, Get, Post, Delete, Patch, Param, Body, Query,
  UseGuards, Logger, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';

type ApiList<T = Record<string, unknown>> = { items: T[]; total: number };
type ApiOk = { success: true };

const emptyList = <T = Record<string, unknown>>(): ApiList<T> => ({ items: [], total: 0 });
const emptyArr = <T = Record<string, unknown>>(): T[] => [];
const successOk = (): ApiOk => ({ success: true });
const successCreated = (id: string | null = null): { success: true; id: string | null } => ({ success: true, id });

@ApiTags('§17 Marketing Analytics (placeholders)')
@ApiBearerAuth()
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('marketing')
@Roles('super_admin', 'director', 'manager')
export class MarketingAnalyticsStubsController {
  private readonly logger = new Logger(MarketingAnalyticsStubsController.name);

  // ── Content ───────────────────────────────────────────────────────────────
  @Post('content/ai-generate') @Roles('super_admin', 'marketing_manager', 'director')
  async aiGenerateContent(@Body() _body: Record<string, unknown>) { return { content: '', title: '' }; }

  // ── NPS & Churn ───────────────────────────────────────────────────────────
  @Get('nps/stats')    @Roles('super_admin', 'marketing_manager', 'director') async getNpsStats()    { return { score: 0, promoters: 0, passives: 0, detractors: 0, total: 0 }; }
  @Get('nps/monthly')  @Roles('super_admin', 'marketing_manager', 'director') async getNpsMonthly()  { return emptyArr(); }
  @Get('nps')          @Roles('super_admin', 'marketing_manager', 'director') async getNps()         { return emptyList(); }

  @Get('churn-risk/ai-signal') @Roles('super_admin', 'marketing_manager', 'director') async getChurnRiskAiSignal() { return { signals: [], updatedAt: null }; }
  @Get('churn-risk')           @Roles('super_admin', 'marketing_manager', 'director') async getChurnRisk()         { return emptyList(); }
  @Post('churn-risk/ai-signal') @Roles('super_admin', 'marketing_manager', 'director') @HttpCode(HttpStatus.OK)
  async postChurnRiskAiSignal(@Body() _body: Record<string, unknown>) { return successOk(); }

  // ── AI / Leads ────────────────────────────────────────────────────────────
  @Get('ai/hot-leads') @Roles('super_admin', 'marketing_manager', 'director', 'sales_manager') async getAiHotLeads() { return emptyArr(); }
  @Get('ai-assistant') @Roles('super_admin', 'marketing_manager', 'director') async getAiAssistant() { return { suggestions: [] }; }

  @Get('leads/sources/summary')          @Roles('super_admin', 'marketing_manager', 'director') async getLeadsSourcesSummary() { return { bySource: [], total: 0 }; }
  @Get('leads/automation/overdue-leads') @Roles('super_admin', 'marketing_manager', 'director') async getAutomationOverdueLeads() { return emptyList(); }

  @Get('leads/:id/contacts') @Roles('super_admin', 'marketing_manager', 'director', 'sales_manager')
  async getLeadContacts(@Param('id') _id: string) { return emptyList(); }

  @Post('leads/:id/convert-to-crm') @Roles('super_admin', 'marketing_manager', 'director', 'sales_manager')
  async convertLeadToCrm(@Param('id') _id: string) { return { ...successOk(), crmLeadId: null }; }

  @Post('leads/:id/contacts') @Roles('super_admin', 'marketing_manager', 'director', 'sales_manager')
  @HttpCode(HttpStatus.CREATED)
  async createLeadContact(@Param('id') _id: string, @Body() _body: Record<string, unknown>) { return successCreated(); }

  @Delete('leads/:id') @Roles('super_admin', 'marketing_manager', 'director') async deleteLead(@Param('id') _id: string) { return successOk(); }

  // ── Inbox (social conversations + messages) ───────────────────────────────
  // Frontend MarketingSocialInbox.tsx expects { total, unread, today } for stats
  // and [] for the conversations list. Tables (social_conversations / social_messages)
  // exist in lib/db/src/schema/marketing-schema.ts; when the inbox service is
  // wired in, swap these empty returns for the real query.
  @Get('inbox/stats')         @Roles('super_admin', 'marketing_manager', 'director')
  async getInboxStats() { return { total: 0, unread: 0, today: 0 }; }

  @Get('inbox/conversations') @Roles('super_admin', 'marketing_manager', 'director')
  async getInboxConversations() { return emptyArr(); }

  @Get('inbox/conversations/:id/messages') @Roles('super_admin', 'marketing_manager', 'director')
  async getConversationMessages(@Param('id') _id: string) { return emptyArr(); }

  @Post('inbox/conversations/:id/reply') @Roles('super_admin', 'marketing_manager', 'director')
  async replyToConversation(@Param('id') _id: string, @Body() _body: Record<string, unknown>) { return successCreated(); }

  @Post('inbox/ai-reply/:id') @Roles('super_admin', 'marketing_manager', 'director')
  async aiReplyToConversation(@Param('id') _id: string) { return { suggestion: '' }; }

  @Patch('inbox/conversations/:id/status') @Roles('super_admin', 'marketing_manager', 'director')
  async updateConversationStatus(@Param('id') _id: string, @Body() _body: Record<string, unknown>) { return successOk(); }

  // ── A/B tests + competitors ───────────────────────────────────────────────
  @Get('ab-tests')    @Roles('super_admin', 'marketing_manager', 'director') async getAbTests()    { return emptyArr(); }
  @Get('competitors') @Roles('super_admin', 'marketing_manager', 'director') async getCompetitors() { return emptyArr(); }

  // ── Budget ────────────────────────────────────────────────────────────────
  @Get('budget')       @Roles('super_admin', 'marketing_manager', 'director') async getBudget(@Query('year') _year?: string) { return { items: [], totalPlanned: 0, totalSpent: 0 }; }
  @Get('budget/:id')   @Roles('super_admin', 'marketing_manager', 'director') async getBudgetById(@Param('id') _id: string) { return null; }
  @Post('budget')      @Roles('super_admin', 'marketing_manager') @HttpCode(HttpStatus.CREATED)
  async createBudget(@Body() _body: Record<string, unknown>) { return successCreated(); }

  // ── Calendar ──────────────────────────────────────────────────────────────
  @Get('calendar')     @Roles('super_admin', 'marketing_manager', 'director')
  async getCalendar(@Query('month') _month?: string, @Query('year') _year?: string) { return emptyArr(); }
  @Get('calendar/:id') @Roles('super_admin', 'marketing_manager', 'director') async getCalendarById(@Param('id') _id: string) { return null; }
  @Post('calendar')    @Roles('super_admin', 'marketing_manager') @HttpCode(HttpStatus.CREATED)
  async createCalendarEvent(@Body() _body: Record<string, unknown>) { return successCreated(); }

  // ── Exhibitions ───────────────────────────────────────────────────────────
  @Get('exhibitions')           @Roles('super_admin', 'marketing_manager', 'director') async getExhibitions() { return emptyArr(); }
  @Get('exhibitions/:id')       @Roles('super_admin', 'marketing_manager', 'director') async getExhibitionById(@Param('id') _id: string) { return null; }
  @Get('exhibitions/:id/leads') @Roles('super_admin', 'marketing_manager', 'director') async getExhibitionLeads(@Param('id') _id: string) { return emptyArr(); }
  @Get('exhibitions/:id/qr')    @Roles('super_admin', 'marketing_manager', 'director') async getExhibitionQr(@Param('id') _id: string) { return { qrUrl: null, qrData: null }; }
  @Post('exhibitions')           @Roles('super_admin', 'marketing_manager') @HttpCode(HttpStatus.CREATED)
  async createExhibition(@Body() _body: Record<string, unknown>) { return successCreated(); }
  @Post('exhibitions/:id/leads') @Roles('super_admin', 'marketing_manager', 'director') @HttpCode(HttpStatus.CREATED)
  async createExhibitionLead(@Param('id') _id: string, @Body() _body: Record<string, unknown>) { return successCreated(); }
  @Post('exhibitions/:id/qr') @Roles('super_admin', 'marketing_manager') @HttpCode(HttpStatus.OK)
  async generateExhibitionQr(@Param('id') _id: string) { return { qrUrl: null, qrData: null }; }

  // ── PR ────────────────────────────────────────────────────────────────────
  @Get('pr')     @Roles('super_admin', 'marketing_manager', 'director') async getPr() { return emptyArr(); }
  @Get('pr/:id') @Roles('super_admin', 'marketing_manager', 'director') async getPrById(@Param('id') _id: string) { return null; }
  @Post('pr')    @Roles('super_admin', 'marketing_manager') @HttpCode(HttpStatus.CREATED)
  async createPr(@Body() _body: Record<string, unknown>) { return successCreated(); }

  // ── Settings ──────────────────────────────────────────────────────────────
  @Get('settings')                 @Roles('super_admin', 'marketing_manager') async getSettings()                 { return { emailSender: '', socialAccounts: [], trackingCodes: {} }; }
  @Get('settings/social-api')      @Roles('super_admin', 'marketing_manager') async getSocialApiSettings()        { return emptyArr(); }
  @Post('settings')                @Roles('super_admin', 'marketing_manager') @HttpCode(HttpStatus.OK)
  async saveSettings(@Body() _body: Record<string, unknown>) { return successOk(); }
  @Post('settings/social-api')     @Roles('super_admin', 'marketing_manager')
  async createSocialApiSetting(@Body() _body: Record<string, unknown>) { return successCreated(); }
  @Delete('settings/social-api/:id') @Roles('super_admin', 'marketing_manager')
  async deleteSocialApiSetting(@Param('id') _id: string) { return successOk(); }
  @Patch('settings/social-api/:id')  @Roles('super_admin', 'marketing_manager')
  async patchSocialApiSetting(@Param('id') _id: string, @Body() _body: Record<string, unknown>) { return successOk(); }
  @Post('settings/setup-telegram-webhook') @Roles('super_admin', 'marketing_manager')
  async setupTelegramWebhook(@Body() _body: Record<string, unknown>) { return successOk(); }

  // ── Website / Blog ────────────────────────────────────────────────────────
  @Get('website/blog')      @Roles('super_admin', 'marketing_manager', 'director') async getBlogPosts() { return emptyArr(); }
  @Get('website/blog/:id')  @Roles('super_admin', 'marketing_manager', 'director') async getBlogPostById(@Param('id') _id: string) { return null; }
  @Patch('website/blog/:id') @Roles('super_admin', 'marketing_manager') async updateBlogPost(@Param('id') _id: string, @Body() _body: Record<string, unknown>) { return successOk(); }
  @Post('website/blog/:id/publish')   @Roles('super_admin', 'marketing_manager') async publishBlogPost(@Param('id') _id: string) { return successOk(); }
  @Patch('website/blog/:id/publish')  @Roles('super_admin', 'marketing_manager') async patchPublishBlogPost(@Param('id') _id: string) { return successOk(); }
  @Post('website/blog/ai-generate')   @Roles('super_admin', 'marketing_manager')
  async aiGenerateBlogPost(@Body() _body: Record<string, unknown>) { return { content: '', title: '' }; }
  @Post('website/blog') @Roles('super_admin', 'marketing_manager') @HttpCode(HttpStatus.CREATED)
  async createBlogPost(@Body() _body: Record<string, unknown>) { return successCreated(); }
  @Delete('website/blog/:id') @Roles('super_admin', 'marketing_manager') async deleteBlogPost(@Param('id') _id: string) { return successOk(); }

  // ── Overview (root) ───────────────────────────────────────────────────────
  @Get() @Roles('super_admin', 'marketing_manager', 'director', 'manager')
  async getMarketingOverview() { return { campaigns: 0, leads: 0, conversions: 0, roi: 0 }; }

  // ── Lead score recalculation ──────────────────────────────────────────────
  // POST /api/marketing/leads/recalculate-scores — bulk recompute lead AI
  // scores. Real implementation will fan out to scoring agent; for now the
  // route returns 200 so MarketingLeads page can call it without seeing 404.
  @Post('leads/recalculate-scores') @Roles('super_admin', 'marketing_manager', 'director')
  @HttpCode(HttpStatus.OK)
  async recalculateLeadScores(@Body() _body: Record<string, unknown>) {
    return { ...successOk(), recalculated: 0, queuedAt: new Date().toISOString() };
  }

  // ── Settings — singular PATCH by id ───────────────────────────────────────
  // PATCH /api/marketing/settings/:id — used by MarketingSettings page when
  // editing a specific settings record (vs. the bulk POST /settings above).
  @Patch('settings/:id') @Roles('super_admin', 'marketing_manager')
  async patchSettingById(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return { ...successOk(), id, ...body };
  }
}
