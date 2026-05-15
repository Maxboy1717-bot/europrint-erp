/**
 * @module marketing-analytics-stubs.controller
 * @description Not-yet-implemented endpoints split from marketing-analytics.controller.ts (Rule 16).
 * All endpoints throw HttpStatus.NOT_IMPLEMENTED until real services are built.
 */

import {
  Controller, Get, Post, Delete, Patch, Param, Body, Query,
  UseGuards, Logger, HttpException, HttpStatus, HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';

const NI = () => { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); };

@ApiTags('§17 Marketing Analytics (stubs)')
@ApiBearerAuth()
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('marketing')
@Roles('super_admin', 'director', 'manager')
export class MarketingAnalyticsStubsController {
  private readonly logger = new Logger(MarketingAnalyticsStubsController.name);

  @Post('content/ai-generate') @Roles('super_admin', 'marketing_manager', 'director')
  async aiGenerateContent(@Body() _body: Record<string, unknown>) { NI(); }

  @Get('nps/stats')    @Roles('super_admin', 'marketing_manager', 'director') async getNpsStats()    { NI(); }
  @Get('nps/monthly')  @Roles('super_admin', 'marketing_manager', 'director') async getNpsMonthly()  { NI(); }
  @Get('nps')          @Roles('super_admin', 'marketing_manager', 'director') async getNps()         { NI(); }

  @Get('churn-risk/ai-signal') @Roles('super_admin', 'marketing_manager', 'director') async getChurnRiskAiSignal() { NI(); }
  @Get('churn-risk')           @Roles('super_admin', 'marketing_manager', 'director') async getChurnRisk()         { NI(); }

  @Get('ai/hot-leads') @Roles('super_admin', 'marketing_manager', 'director', 'sales_manager') async getAiHotLeads() { NI(); }
  @Get('ai-assistant') @Roles('super_admin', 'marketing_manager', 'director') async getAiAssistant() { NI(); }

  @Get('leads/sources/summary')          @Roles('super_admin', 'marketing_manager', 'director') async getLeadsSourcesSummary() { NI(); }
  @Get('leads/automation/overdue-leads') @Roles('super_admin', 'marketing_manager', 'director') async getAutomationOverdueLeads() { NI(); }

  @Get('leads/:id/contacts') @Roles('super_admin', 'marketing_manager', 'director', 'sales_manager')
  async getLeadContacts(@Param('id') _id: string) { NI(); }

  @Post('leads/:id/convert-to-crm') @Roles('super_admin', 'marketing_manager', 'director', 'sales_manager')
  async convertLeadToCrm(@Param('id') _id: string) { NI(); }

  @Post('leads/:id/contacts') @Roles('super_admin', 'marketing_manager', 'director', 'sales_manager')
  @HttpCode(HttpStatus.CREATED)
  async createLeadContact(@Param('id') _id: string, @Body() _body: Record<string, unknown>) { NI(); }

  @Delete('leads/:id') @Roles('super_admin', 'marketing_manager', 'director') async deleteLead(@Param('id') _id: string) { NI(); }

  @Get('inbox/stats')         @Roles('super_admin', 'marketing_manager', 'director') async getInboxStats()         { NI(); }
  @Get('inbox/conversations') @Roles('super_admin', 'marketing_manager', 'director') async getInboxConversations() { NI(); }

  @Get('inbox/conversations/:id/messages') @Roles('super_admin', 'marketing_manager', 'director')
  async getConversationMessages(@Param('id') _id: string) { NI(); }

  @Post('inbox/conversations/:id/reply') @Roles('super_admin', 'marketing_manager', 'director')
  async replyToConversation(@Param('id') _id: string, @Body() _body: Record<string, unknown>) { NI(); }

  @Post('inbox/ai-reply/:id') @Roles('super_admin', 'marketing_manager', 'director')
  async aiReplyToConversation(@Param('id') _id: string) { NI(); }

  @Patch('inbox/conversations/:id/status') @Roles('super_admin', 'marketing_manager', 'director')
  async updateConversationStatus(@Param('id') _id: string, @Body() _body: Record<string, unknown>) { NI(); }

  @Get('ab-tests')    @Roles('super_admin', 'marketing_manager', 'director') async getAbTests()    { NI(); }
  @Get('competitors') @Roles('super_admin', 'marketing_manager', 'director') async getCompetitors() { NI(); }

  @Get('budget')       @Roles('super_admin', 'marketing_manager', 'director') async getBudget(@Query('year') _year?: string) { NI(); }
  @Get('budget/:id')   @Roles('super_admin', 'marketing_manager', 'director') async getBudgetById(@Param('id') _id: string) { NI(); }
  @Post('budget')      @Roles('super_admin', 'marketing_manager') @HttpCode(HttpStatus.CREATED)
  async createBudget(@Body() _body: Record<string, unknown>) { NI(); }

  @Get('calendar')     @Roles('super_admin', 'marketing_manager', 'director')
  async getCalendar(@Query('month') _month?: string, @Query('year') _year?: string) { NI(); }
  @Get('calendar/:id') @Roles('super_admin', 'marketing_manager', 'director') async getCalendarById(@Param('id') _id: string) { NI(); }
  @Post('calendar')    @Roles('super_admin', 'marketing_manager') @HttpCode(HttpStatus.CREATED)
  async createCalendarEvent(@Body() _body: Record<string, unknown>) { NI(); }

  @Get('exhibitions')           @Roles('super_admin', 'marketing_manager', 'director') async getExhibitions() { NI(); }
  @Get('exhibitions/:id')       @Roles('super_admin', 'marketing_manager', 'director') async getExhibitionById(@Param('id') _id: string) { NI(); }
  @Get('exhibitions/:id/leads') @Roles('super_admin', 'marketing_manager', 'director') async getExhibitionLeads(@Param('id') _id: string) { NI(); }
  @Get('exhibitions/:id/qr')    @Roles('super_admin', 'marketing_manager', 'director') async getExhibitionQr(@Param('id') _id: string) { NI(); }

  @Post('exhibitions')           @Roles('super_admin', 'marketing_manager') @HttpCode(HttpStatus.CREATED)
  async createExhibition(@Body() _body: Record<string, unknown>) { NI(); }

  @Post('exhibitions/:id/leads') @Roles('super_admin', 'marketing_manager', 'director') @HttpCode(HttpStatus.CREATED)
  async createExhibitionLead(@Param('id') _id: string, @Body() _body: Record<string, unknown>) { NI(); }

  @Post('exhibitions/:id/qr') @Roles('super_admin', 'marketing_manager') @HttpCode(HttpStatus.OK)
  async generateExhibitionQr(@Param('id') _id: string) { NI(); }

  @Get('pr')     @Roles('super_admin', 'marketing_manager', 'director') async getPr() { NI(); }
  @Get('pr/:id') @Roles('super_admin', 'marketing_manager', 'director') async getPrById(@Param('id') _id: string) { NI(); }
  @Post('pr')    @Roles('super_admin', 'marketing_manager') @HttpCode(HttpStatus.CREATED)
  async createPr(@Body() _body: Record<string, unknown>) { NI(); }

  @Get('settings')                 @Roles('super_admin', 'marketing_manager') async getSettings()                 { NI(); }
  @Get('settings/social-api')      @Roles('super_admin', 'marketing_manager') async getSocialApiSettings()        { NI(); }
  @Post('settings')                @Roles('super_admin', 'marketing_manager') @HttpCode(HttpStatus.OK)
  async saveSettings(@Body() _body: Record<string, unknown>) { NI(); }
  @Post('settings/social-api')     @Roles('super_admin', 'marketing_manager')
  async createSocialApiSetting(@Body() _body: Record<string, unknown>) { NI(); }
  @Delete('settings/social-api/:id') @Roles('super_admin', 'marketing_manager')
  async deleteSocialApiSetting(@Param('id') _id: string) { NI(); }
  @Patch('settings/social-api/:id')  @Roles('super_admin', 'marketing_manager')
  async patchSocialApiSetting(@Param('id') _id: string, @Body() _body: Record<string, unknown>) { NI(); }
  @Post('settings/setup-telegram-webhook') @Roles('super_admin', 'marketing_manager')
  async setupTelegramWebhook(@Body() _body: Record<string, unknown>) { NI(); }

  @Get('website/blog')      @Roles('super_admin', 'marketing_manager', 'director') async getBlogPosts() { NI(); }
  @Get('website/blog/:id')  @Roles('super_admin', 'marketing_manager', 'director') async getBlogPostById(@Param('id') _id: string) { NI(); }
  @Patch('website/blog/:id') @Roles('super_admin', 'marketing_manager') async updateBlogPost(@Param('id') _id: string, @Body() _body: Record<string, unknown>) { NI(); }
  @Post('website/blog/:id/publish')   @Roles('super_admin', 'marketing_manager') async publishBlogPost(@Param('id') _id: string) { NI(); }
  @Patch('website/blog/:id/publish')  @Roles('super_admin', 'marketing_manager') async patchPublishBlogPost(@Param('id') _id: string) { NI(); }
  @Post('website/blog/ai-generate')   @Roles('super_admin', 'marketing_manager')
  async aiGenerateBlogPost(@Body() _body: Record<string, unknown>) { NI(); }
  @Post('website/blog') @Roles('super_admin', 'marketing_manager') @HttpCode(HttpStatus.CREATED)
  async createBlogPost(@Body() _body: Record<string, unknown>) { NI(); }
  @Delete('website/blog/:id') @Roles('super_admin', 'marketing_manager') async deleteBlogPost(@Param('id') _id: string) { NI(); }

  @Get() @Roles('super_admin', 'marketing_manager', 'director', 'manager') async getMarketingOverview() { NI(); }

  @Post('churn-risk/ai-signal') @Roles('super_admin', 'marketing_manager', 'director') @HttpCode(HttpStatus.OK)
  async postChurnRiskAiSignal(@Body() _body: Record<string, unknown>) { NI(); }
}
