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
 * When a real service lands for any of these routes, replace the `notImplemented`
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
import { notImplemented } from '@common/exceptions/not-implemented';

const StubBodySchema = z.record(z.unknown());

@ApiTags('§17 Marketing Analytics (placeholders)')
@ApiBearerAuth()
@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('marketing')
@Roles('super_admin', 'director', 'manager')
export class MarketingAnalyticsStubsController {
  private readonly logger = new Logger(MarketingAnalyticsStubsController.name);

  // -- Content ---------------------------------------------------------------
  @Post('content/ai-generate') @Roles('super_admin', 'marketing_manager', 'director')
  async aiGenerateContent(@Body() _body: unknown) { return notImplemented('POST /marketing/content/ai-generate'); }

  // -- NPS & Churn -----------------------------------------------------------
  @Get('nps/stats')    @Roles('super_admin', 'marketing_manager', 'director') async getNpsStats()    { return notImplemented('GET /marketing/nps/stats'); }
  @Get('nps/monthly')  @Roles('super_admin', 'marketing_manager', 'director') async getNpsMonthly()  { return notImplemented('GET /marketing/nps/monthly'); }
  @Get('nps')          @Roles('super_admin', 'marketing_manager', 'director') async getNps()         { return notImplemented('GET /marketing/nps'); }

  @Get('churn-risk/ai-signal') @Roles('super_admin', 'marketing_manager', 'director') async getChurnRiskAiSignal() { return notImplemented('GET /marketing/churn-risk/ai-signal'); }
  @Get('churn-risk')           @Roles('super_admin', 'marketing_manager', 'director') async getChurnRisk()         { return notImplemented('GET /marketing/churn-risk'); }
  @Post('churn-risk/ai-signal') @Roles('super_admin', 'marketing_manager', 'director') @HttpCode(HttpStatus.OK)
  async postChurnRiskAiSignal(@Body() _body: unknown) { return notImplemented('POST /marketing/churn-risk/ai-signal'); }

  // -- AI / Leads ------------------------------------------------------------
  @Get('ai/hot-leads') @Roles('super_admin', 'marketing_manager', 'director', 'sales_manager') async getAiHotLeads() { return notImplemented('GET /marketing/ai/hot-leads'); }
  @Get('ai-assistant') @Roles('super_admin', 'marketing_manager', 'director') async getAiAssistant() { return notImplemented('GET /marketing/ai-assistant'); }

  @Get('leads/sources/summary')          @Roles('super_admin', 'marketing_manager', 'director') async getLeadsSourcesSummary() { return notImplemented('GET /marketing/leads/sources/summary'); }
  @Get('leads/automation/overdue-leads') @Roles('super_admin', 'marketing_manager', 'director') async getAutomationOverdueLeads() { return notImplemented('GET /marketing/leads/automation/overdue-leads'); }

  @Get('leads/:id/contacts') @Roles('super_admin', 'marketing_manager', 'director', 'sales_manager')
  async getLeadContacts(@Param('id') _id: string) { return notImplemented('GET /marketing/leads/:id/contacts'); }

  @Post('leads/:id/convert-to-crm') @Roles('super_admin', 'marketing_manager', 'director', 'sales_manager')
  async convertLeadToCrm(@Param('id') _id: string) { return notImplemented('POST /marketing/leads/:id/convert-to-crm'); }

  @Post('leads/:id/contacts') @Roles('super_admin', 'marketing_manager', 'director', 'sales_manager')
  @HttpCode(HttpStatus.CREATED)
  async createLeadContact(@Param('id') _id: string, @Body() _body: unknown) { return notImplemented('POST /marketing/leads/:id/contacts'); }

  @Delete('leads/:id') @Roles('super_admin', 'marketing_manager', 'director')
  async deleteLead(@Param('id') _id: string) { return notImplemented('DELETE /marketing/leads/:id'); }

  // -- Inbox (social conversations + messages) -------------------------------
  @Get('inbox/stats')         @Roles('super_admin', 'marketing_manager', 'director')
  async getInboxStats() { return notImplemented('GET /marketing/inbox/stats'); }

  @Get('inbox/conversations') @Roles('super_admin', 'marketing_manager', 'director')
  async getInboxConversations() { return notImplemented('GET /marketing/inbox/conversations'); }

  @Get('inbox/conversations/:id/messages') @Roles('super_admin', 'marketing_manager', 'director')
  async getConversationMessages(@Param('id') _id: string) { return notImplemented('GET /marketing/inbox/conversations/:id/messages'); }

  @Post('inbox/conversations/:id/reply') @Roles('super_admin', 'marketing_manager', 'director')
  async replyToConversation(@Param('id') _id: string, @Body() _body: unknown) { return notImplemented('POST /marketing/inbox/conversations/:id/reply'); }

  @Post('inbox/ai-reply/:id') @Roles('super_admin', 'marketing_manager', 'director')
  async aiReplyToConversation(@Param('id') _id: string) { return notImplemented('POST /marketing/inbox/ai-reply/:id'); }

  @Patch('inbox/conversations/:id/status') @Roles('super_admin', 'marketing_manager', 'director')
  async updateConversationStatus(@Param('id') _id: string, @Body() _body: unknown) { return notImplemented('PATCH /marketing/inbox/conversations/:id/status'); }

  // -- A/B tests + competitors -----------------------------------------------
  @Get('ab-tests')    @Roles('super_admin', 'marketing_manager', 'director') async getAbTests()    { return notImplemented('GET /marketing/ab-tests'); }
  @Get('competitors') @Roles('super_admin', 'marketing_manager', 'director') async getCompetitors() { return notImplemented('GET /marketing/competitors'); }

  // -- Budget ----------------------------------------------------------------
  @Get('budget')       @Roles('super_admin', 'marketing_manager', 'director') async getBudget(@Query('year') _year?: string) { return notImplemented('GET /marketing/budget'); }
  @Get('budget/:id')   @Roles('super_admin', 'marketing_manager', 'director') async getBudgetById(@Param('id') _id: string) { return notImplemented('GET /marketing/budget/:id'); }
  @Post('budget')      @Roles('super_admin', 'marketing_manager') @HttpCode(HttpStatus.CREATED)
  async createBudget(@Body() _body: unknown) { return notImplemented('POST /marketing/budget'); }

  // -- Calendar --------------------------------------------------------------
  @Get('calendar')     @Roles('super_admin', 'marketing_manager', 'director')
  async getCalendar(@Query('month') _month?: string, @Query('year') _year?: string) { return notImplemented('GET /marketing/calendar'); }
  @Get('calendar/:id') @Roles('super_admin', 'marketing_manager', 'director') async getCalendarById(@Param('id') _id: string) { return notImplemented('GET /marketing/calendar/:id'); }
  @Post('calendar')    @Roles('super_admin', 'marketing_manager') @HttpCode(HttpStatus.CREATED)
  async createCalendarEvent(@Body() _body: unknown) { return notImplemented('POST /marketing/calendar'); }

  // -- Exhibitions -----------------------------------------------------------
  @Get('exhibitions')           @Roles('super_admin', 'marketing_manager', 'director') async getExhibitions() { return notImplemented('GET /marketing/exhibitions'); }
  @Get('exhibitions/:id')       @Roles('super_admin', 'marketing_manager', 'director') async getExhibitionById(@Param('id') _id: string) { return notImplemented('GET /marketing/exhibitions/:id'); }
  @Get('exhibitions/:id/leads') @Roles('super_admin', 'marketing_manager', 'director') async getExhibitionLeads(@Param('id') _id: string) { return notImplemented('GET /marketing/exhibitions/:id/leads'); }
  @Get('exhibitions/:id/qr')    @Roles('super_admin', 'marketing_manager', 'director') async getExhibitionQr(@Param('id') _id: string) { return notImplemented('GET /marketing/exhibitions/:id/qr'); }
  @Post('exhibitions')           @Roles('super_admin', 'marketing_manager') @HttpCode(HttpStatus.CREATED)
  async createExhibition(@Body() _body: unknown) { return notImplemented('POST /marketing/exhibitions'); }
  @Post('exhibitions/:id/leads') @Roles('super_admin', 'marketing_manager', 'director') @HttpCode(HttpStatus.CREATED)
  async createExhibitionLead(@Param('id') _id: string, @Body() _body: unknown) { return notImplemented('POST /marketing/exhibitions/:id/leads'); }
  @Post('exhibitions/:id/qr') @Roles('super_admin', 'marketing_manager') @HttpCode(HttpStatus.OK)
  async generateExhibitionQr(@Param('id') _id: string) { return notImplemented('POST /marketing/exhibitions/:id/qr'); }

  // -- PR --------------------------------------------------------------------
  @Get('pr')     @Roles('super_admin', 'marketing_manager', 'director') async getPr() { return notImplemented('GET /marketing/pr'); }
  @Get('pr/:id') @Roles('super_admin', 'marketing_manager', 'director') async getPrById(@Param('id') _id: string) { return notImplemented('GET /marketing/pr/:id'); }
  @Post('pr')    @Roles('super_admin', 'marketing_manager') @HttpCode(HttpStatus.CREATED)
  async createPr(@Body() _body: unknown) { return notImplemented('POST /marketing/pr'); }

  // -- Settings --------------------------------------------------------------
  @Get('settings')                 @Roles('super_admin', 'marketing_manager') async getSettings()                 { return notImplemented('GET /marketing/settings'); }
  @Get('settings/social-api')      @Roles('super_admin', 'marketing_manager') async getSocialApiSettings()        { return notImplemented('GET /marketing/settings/social-api'); }
  @Post('settings')                @Roles('super_admin', 'marketing_manager') @HttpCode(HttpStatus.OK)
  async saveSettings(@Body() _body: unknown) { return notImplemented('POST /marketing/settings'); }
  @Post('settings/social-api')     @Roles('super_admin', 'marketing_manager')
  async createSocialApiSetting(@Body() _body: unknown) { return notImplemented('POST /marketing/settings/social-api'); }
  @Delete('settings/social-api/:id') @Roles('super_admin', 'marketing_manager')
  async deleteSocialApiSetting(@Param('id') _id: string) { return notImplemented('DELETE /marketing/settings/social-api/:id'); }
  @Patch('settings/social-api/:id')  @Roles('super_admin', 'marketing_manager')
  async patchSocialApiSetting(@Param('id') _id: string, @Body() _body: unknown) { return notImplemented('PATCH /marketing/settings/social-api/:id'); }
  @Post('settings/setup-telegram-webhook') @Roles('super_admin', 'marketing_manager')
  async setupTelegramWebhook(@Body() _body: unknown) { return notImplemented('POST /marketing/settings/setup-telegram-webhook'); }

  // -- Website / Blog --------------------------------------------------------
  @Get('website/blog')      @Roles('super_admin', 'marketing_manager', 'director') async getBlogPosts() { return notImplemented('GET /marketing/website/blog'); }
  @Get('website/blog/:id')  @Roles('super_admin', 'marketing_manager', 'director') async getBlogPostById(@Param('id') _id: string) { return notImplemented('GET /marketing/website/blog/:id'); }
  @Patch('website/blog/:id') @Roles('super_admin', 'marketing_manager') async updateBlogPost(@Param('id') _id: string, @Body() _body: unknown) { return notImplemented('PATCH /marketing/website/blog/:id'); }
  @Post('website/blog/:id/publish')   @Roles('super_admin', 'marketing_manager') async publishBlogPost(@Param('id') _id: string) { return notImplemented('POST /marketing/website/blog/:id/publish'); }
  @Patch('website/blog/:id/publish')  @Roles('super_admin', 'marketing_manager') async patchPublishBlogPost(@Param('id') _id: string) { return notImplemented('PATCH /marketing/website/blog/:id/publish'); }
  @Post('website/blog/ai-generate')   @Roles('super_admin', 'marketing_manager')
  async aiGenerateBlogPost(@Body() _body: unknown) { return notImplemented('POST /marketing/website/blog/ai-generate'); }
  @Post('website/blog') @Roles('super_admin', 'marketing_manager') @HttpCode(HttpStatus.CREATED)
  async createBlogPost(@Body() _body: unknown) { return notImplemented('POST /marketing/website/blog'); }
  @Delete('website/blog/:id') @Roles('super_admin', 'marketing_manager') async deleteBlogPost(@Param('id') _id: string) { return notImplemented('DELETE /marketing/website/blog/:id'); }

  // -- Overview (root) -------------------------------------------------------
  @Get() @Roles('super_admin', 'marketing_manager', 'director', 'manager')
  async getMarketingOverview() { return notImplemented('GET /marketing'); }

  // -- Lead score recalculation ----------------------------------------------
  @Post('leads/recalculate-scores') @Roles('super_admin', 'marketing_manager', 'director')
  @HttpCode(HttpStatus.OK)
  async recalculateLeadScores(@Body() _body: unknown) {
    return notImplemented('POST /marketing/leads/recalculate-scores');
  }

  // -- Settings - singular PATCH by id ---------------------------------------
  @Patch('settings/:id') @Roles('super_admin', 'marketing_manager')
  async patchSettingById(@Param('id') _id: string, @Body() body: unknown) {
    StubBodySchema.parse(body ?? {});
    return notImplemented('PATCH /marketing/settings/:id');
  }
}
