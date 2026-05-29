/**
 * @module marketing-analytics-stubs.controller
 * @description Marketing endpoints that have no real service implementation yet.
 *
 * P3-26: Per CLAUDE.md Rule 10, unimplemented endpoints now return HTTP 501 instead
 * of fake empty payloads. The previous behavior (returning `{ items: [], total: 0 }`)
 * silently masked missing functionality and made it impossible to tell whether the
 * page was truly empty or just unwired. The frontend (`/marketing/*` pages) should
 * branch on a 501 response to show a "Coming soon" empty state.
 *
 * When a real service lands for any of these routes, replace the stub
 * call with the actual handler.
 */

import {
  Controller, Get, Post, Delete, Patch, Param, Body, Query,
  UseGuards, Logger, HttpCode, HttpStatus, HttpException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { z } from 'zod';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { unwrapOrThrow } from '@common/http-result';
import { MarketingExtService } from '../application/marketing-ext.service';

/** Throws HTTP 501 for routes not yet implemented. */
function stub(route: string): never {
  throw new HttpException(
    { message: `Endpoint not yet implemented: ${route}`, code: 'NOT_IMPLEMENTED' },
    HttpStatus.NOT_IMPLEMENTED,
  );
}

const StubBodySchema = z.record(z.unknown());

@ApiTags('§17 Marketing Analytics (placeholders)')
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

  // -- NPS & Churn -----------------------------------------------------------
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

  // -- AI / Leads ------------------------------------------------------------
  @Get('ai/hot-leads')
  @Roles('super_admin', 'marketing_manager', 'director', 'sales_manager')
  async getAiHotLeads() {
    return unwrapOrThrow(await this.svc.getHotLeads());
  }

  @Get('ai-assistant') @Roles('super_admin', 'marketing_manager', 'director')
  async getAiAssistant() { return stub('GET /marketing/ai-assistant'); }

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

  // leads/:id/contacts (GET/POST) and leads/:id (DELETE) → marketing-group2.controller.ts

  @Post('leads/:id/convert-to-crm') @Roles('super_admin', 'marketing_manager', 'director', 'sales_manager')
  async convertLeadToCrm(@Param('id') _id: string) { return stub('POST /marketing/leads/:id/convert-to-crm'); }

  // -- Inbox (social conversations + messages) -------------------------------
  @Get('inbox/stats')
  @Roles('super_admin', 'marketing_manager', 'director')
  async getInboxStats() {
    return unwrapOrThrow(await this.svc.getInboxStats());
  }

  @Get('inbox/conversations') @Roles('super_admin', 'marketing_manager', 'director')
  async getInboxConversations() { return stub('GET /marketing/inbox/conversations'); }

  @Get('inbox/conversations/:id/messages') @Roles('super_admin', 'marketing_manager', 'director')
  async getConversationMessages(@Param('id') _id: string) { return stub('GET /marketing/inbox/conversations/:id/messages'); }

  @Post('inbox/conversations/:id/reply') @Roles('super_admin', 'marketing_manager', 'director')
  async replyToConversation(@Param('id') _id: string, @Body() _body: unknown) { return stub('POST /marketing/inbox/conversations/:id/reply'); }

  @Post('inbox/ai-reply/:id') @Roles('super_admin', 'marketing_manager', 'director')
  async aiReplyToConversation(@Param('id') _id: string) { return stub('POST /marketing/inbox/ai-reply/:id'); }

  @Patch('inbox/conversations/:id/status') @Roles('super_admin', 'marketing_manager', 'director')
  async updateConversationStatus(@Param('id') _id: string, @Body() _body: unknown) { return stub('PATCH /marketing/inbox/conversations/:id/status'); }

  // -- A/B tests -----------------------------------------------
  @Get('ab-tests') @Roles('super_admin', 'marketing_manager', 'director')
  async getAbTests() { return stub('GET /marketing/ab-tests'); }

  // competitors, budget, calendar → marketing-group2.controller.ts

  // -- Exhibitions -----------------------------------------------------------
  @Get('exhibitions')           @Roles('super_admin', 'marketing_manager', 'director')
  async getExhibitions() { return stub('GET /marketing/exhibitions'); }

  @Get('exhibitions/:id')       @Roles('super_admin', 'marketing_manager', 'director')
  async getExhibitionById(@Param('id') _id: string) { return stub('GET /marketing/exhibitions/:id'); }

  @Get('exhibitions/:id/leads') @Roles('super_admin', 'marketing_manager', 'director')
  async getExhibitionLeads(@Param('id') _id: string) { return stub('GET /marketing/exhibitions/:id/leads'); }

  @Get('exhibitions/:id/qr')    @Roles('super_admin', 'marketing_manager', 'director')
  async getExhibitionQr(@Param('id') _id: string) { return stub('GET /marketing/exhibitions/:id/qr'); }

  @Post('exhibitions')           @Roles('super_admin', 'marketing_manager') @HttpCode(HttpStatus.CREATED)
  async createExhibition(@Body() _body: unknown) { return stub('POST /marketing/exhibitions'); }

  @Post('exhibitions/:id/leads') @Roles('super_admin', 'marketing_manager', 'director') @HttpCode(HttpStatus.CREATED)
  async createExhibitionLead(@Param('id') _id: string, @Body() _body: unknown) { return stub('POST /marketing/exhibitions/:id/leads'); }

  @Post('exhibitions/:id/qr') @Roles('super_admin', 'marketing_manager') @HttpCode(HttpStatus.OK)
  async generateExhibitionQr(@Param('id') _id: string) { return stub('POST /marketing/exhibitions/:id/qr'); }

  // -- PR --------------------------------------------------------------------
  @Get('pr')     @Roles('super_admin', 'marketing_manager', 'director')
  async getPr() { return stub('GET /marketing/pr'); }

  @Get('pr/:id') @Roles('super_admin', 'marketing_manager', 'director')
  async getPrById(@Param('id') _id: string) { return stub('GET /marketing/pr/:id'); }

  @Post('pr')    @Roles('super_admin', 'marketing_manager') @HttpCode(HttpStatus.CREATED)
  async createPr(@Body() _body: unknown) { return stub('POST /marketing/pr'); }

  // -- Settings --------------------------------------------------------------
  @Get('settings')            @Roles('super_admin', 'marketing_manager')
  async getSettings() { return stub('GET /marketing/settings'); }

  @Get('settings/social-api') @Roles('super_admin', 'marketing_manager')
  async getSocialApiSettings() { return stub('GET /marketing/settings/social-api'); }

  @Post('settings')           @Roles('super_admin', 'marketing_manager') @HttpCode(HttpStatus.OK)
  async saveSettings(@Body() _body: unknown) { return stub('POST /marketing/settings'); }

  @Post('settings/social-api') @Roles('super_admin', 'marketing_manager')
  async createSocialApiSetting(@Body() _body: unknown) { return stub('POST /marketing/settings/social-api'); }

  @Delete('settings/social-api/:id') @Roles('super_admin', 'marketing_manager')
  async deleteSocialApiSetting(@Param('id') _id: string) { return stub('DELETE /marketing/settings/social-api/:id'); }

  @Patch('settings/social-api/:id')  @Roles('super_admin', 'marketing_manager')
  async patchSocialApiSetting(@Param('id') _id: string, @Body() _body: unknown) { return stub('PATCH /marketing/settings/social-api/:id'); }

  @Post('settings/setup-telegram-webhook') @Roles('super_admin', 'marketing_manager')
  async setupTelegramWebhook(@Body() _body: unknown) { return stub('POST /marketing/settings/setup-telegram-webhook'); }

  // -- Website / Blog --------------------------------------------------------
  // website/blog (GET/POST/PATCH/DELETE/publish) → marketing-group2.controller.ts
  @Patch('website/blog/:id/publish')  @Roles('super_admin', 'marketing_manager')
  async patchPublishBlogPost(@Param('id') _id: string) { return stub('PATCH /marketing/website/blog/:id/publish'); }

  @Post('website/blog/ai-generate')   @Roles('super_admin', 'marketing_manager')
  async aiGenerateBlogPost(@Body() _body: unknown) { return stub('POST /marketing/website/blog/ai-generate'); }

  // -- Overview (root) -------------------------------------------------------
  @Get() @Roles('super_admin', 'marketing_manager', 'director', 'manager')
  async getMarketingOverview() { return stub('GET /marketing'); }

  // -- Lead score recalculation ----------------------------------------------
  @Post('leads/recalculate-scores') @Roles('super_admin', 'marketing_manager', 'director')
  @HttpCode(HttpStatus.OK)
  async recalculateLeadScores(@Body() _body: unknown) {
    return stub('POST /marketing/leads/recalculate-scores');
  }

  // -- Settings - singular PATCH by id ---------------------------------------
  @Patch('settings/:id') @Roles('super_admin', 'marketing_manager')
  async patchSettingById(@Param('id') _id: string, @Body() body: unknown) {
    StubBodySchema.parse(body ?? {});
    return stub('PATCH /marketing/settings/:id');
  }
}
