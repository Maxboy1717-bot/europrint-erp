/**
 * @module marketing-analytics.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  AuditInterceptor } from '@common/interceptors/audit.interceptor';import {  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  Logger,
  HttpCode,
  InternalServerErrorException, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard }  from '@common/guards/roles.guard';
import { Roles }       from '@common/decorators/roles.decorator';
import { unwrapOrBadRequest, throwFromError, unwrapOrThrow, unwrapOrInternal } from '@common/http-result';
import { MarketingExtService } from '../application/marketing-ext.service';
import { LeadsService } from '../leads/leads.service';
import {
  CreateSocialPostDtoSchema, CreateSocialPostDto,
  UpdateSocialPostDtoSchema, UpdateSocialPostDto,
  CreateEmailTemplateDtoSchema, CreateEmailTemplateDto,
  UpdateEmailTemplateDtoSchema, UpdateEmailTemplateDto,
  UpdateLeadStatusDtoSchema, UpdateLeadStatusDto,
} from './dto/marketing-ext.dto';

@ApiTags('§17 Marketing Analytics')
@ApiBearerAuth()
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('marketing')
@Roles('super_admin', 'director', 'manager')
export class MarketingAnalyticsController {
  private readonly logger = new Logger(MarketingAnalyticsController.name);

  constructor(
    private readonly svc: MarketingExtService,
    private readonly leadsSvc: LeadsService,
  ) {}

  @Get('social/posts')
  @ApiOperation({ summary: 'Ijtimoiy tarmoq postlari' })
  async getSocialPosts(@Query('page') page?: string, @Query('limit') limit?: string) {
    return unwrapOrBadRequest(await this.svc.getSocialPosts(Number(page), Number(limit)));
  }

  @Post('social/posts')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Ijtimoiy tarmoq posti yaratish' })
  async createSocialPost(@Body() body: CreateSocialPostDto) {
    const dto = CreateSocialPostDtoSchema.parse(body);
    return unwrapOrBadRequest(await this.svc.createSocialPost(dto));
  }

  @Put('social/posts/:id')
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Ijtimoiy tarmoq postini yangilash' })
  async updateSocialPost(@Param('id') id: string, @Body() body: UpdateSocialPostDto) {
    const dto = UpdateSocialPostDtoSchema.parse(body);
    return unwrapOrBadRequest(await this.svc.updateSocialPost(id, dto));
  }

  @Delete('social/posts/:id')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: "Ijtimoiy tarmoq postini o'chirish" })
  async deleteSocialPost(@Param('id') id: string) {
    return unwrapOrBadRequest(await this.svc.deleteSocialPost(id));
  }

  @Get('leads')
  @ApiOperation({ summary: "Lead-lar ro'yxati" })
  async getLeads(@Query() query: Record<string, unknown>) {
    return unwrapOrThrow(await this.leadsSvc.findAll(query));
  }

  @Post('leads')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Yangi lead yaratish' })
  async createLead(@Body() body: Record<string, unknown>) {
    return unwrapOrThrow(await this.leadsSvc.create(body));
  }

  @Get('leads/:id')
  @ApiOperation({ summary: 'Lead tafsiloti' })
  async getLead(@Param('id') id: string) {
    return unwrapOrInternal(await this.leadsSvc.findOne(Number(id)));
  }

  @Put('leads/:id')
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: "Lead ma'lumotlarini yangilash" })
  async updateLead(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return unwrapOrThrow(await this.leadsSvc.update(Number(id), body));
  }

  @Patch('leads/:id/status')
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Lead statusini yangilash' })
  async updateLeadStatus(@Param('id') id: string, @Body() body: UpdateLeadStatusDto) {
    const dto = UpdateLeadStatusDtoSchema.parse(body);
    return unwrapOrThrow(await this.leadsSvc.update(Number(id), { status: dto.status }));
  }

  @Get('email/templates')
  @ApiOperation({ summary: "Email shablonlar ro'yxati" })
  async getEmailTemplates() {
    return unwrapOrBadRequest(await this.svc.getEmailTemplates());
  }

  @Post('email/templates')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Email shablon yaratish' })
  async createEmailTemplate(@Body() body: CreateEmailTemplateDto) {
    const dto = CreateEmailTemplateDtoSchema.parse(body);
    return unwrapOrBadRequest(await this.svc.createEmailTemplate(dto));
  }

  @Put('email/templates/:id')
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Email shablonni yangilash' })
  async updateEmailTemplate(@Param('id') id: string, @Body() body: UpdateEmailTemplateDto) {
    const dto = UpdateEmailTemplateDtoSchema.parse(body);
    return unwrapOrBadRequest(await this.svc.updateEmailTemplate(id, dto));
  }

  @Delete('email/templates/:id')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: "Email shablonni o'chirish" })
  async deleteEmailTemplate(@Param('id') id: string) {
    return unwrapOrBadRequest(await this.svc.deleteEmailTemplate(id));
  }

  @Get('analytics/overview')
  @ApiOperation({ summary: "Marketing analitika umumiy ko'rinishi" })
  async getAnalyticsOverview() {
    return unwrapOrBadRequest(await this.svc.getAnalyticsOverview());
  }

  @Get('analytics/campaigns')
  @ApiOperation({ summary: 'Kampaniya analitikasi' })
  async getCampaignAnalytics() {
    return unwrapOrBadRequest(await this.svc.getCampaignAnalytics());
  }

  @Get('analytics/audience')
  @ApiOperation({ summary: 'Auditoriya analitikasi' })
  async getAudienceAnalytics() {
    return unwrapOrBadRequest(await this.svc.getLeadsBySource());
  }

  @Get('analytics/conversion')
  @ApiOperation({ summary: 'Konversiya analitikasi' })
  async getConversionAnalytics() {
    return unwrapOrBadRequest(await this.svc.getMarketingFunnel());
  }

  @Get('funnel')
  @ApiOperation({ summary: 'Marketing voronkasi' })
  async getMarketingFunnel() {
    return unwrapOrBadRequest(await this.svc.getMarketingFunnel());
  }

  @Get('reports')
  @ApiOperation({ summary: "Marketing hisobotlar ro'yxati" })
  async getReports() {
    return unwrapOrBadRequest(await this.svc.getCampaignAnalytics());
  }

  @Get('reports/:id')
  @ApiOperation({ summary: 'Marketing kampaniya hisobot tafsiloti' })
  async getReportById(@Param('id') id: string) {
    return unwrapOrBadRequest(await this.svc.getCampaignStats(Number(id)));
  }

  @Post('content/ai-generate') @Roles('super_admin', 'marketing_manager', 'director')
  async aiGenerateContent(@Body() body: Record<string, unknown>) { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Get('nps/stats') @Roles('super_admin', 'marketing_manager', 'director')
  async getNpsStats() { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Get('nps/monthly') @Roles('super_admin', 'marketing_manager', 'director')
  async getNpsMonthly() { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Get('churn-risk/ai-signal') @Roles('super_admin', 'marketing_manager', 'director')
  async getChurnRiskAiSignal() { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Get('ai/hot-leads') @Roles('super_admin', 'marketing_manager', 'director', 'sales_manager')
  async getAiHotLeads() { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Get('leads/sources/summary') @Roles('super_admin', 'marketing_manager', 'director')
  async getLeadsSourcesSummary() { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Get('leads/loss-analysis') @Roles('super_admin', 'marketing_manager', 'director', 'sales_manager', 'manager')
  async getLeadsLossAnalysis() {
    try {
      const rows = await this.leadsSvc.getLossAnalysis();
      return rows;
    } catch {
      return { total: 0, breakdown: [] };
    }
  }

  @Get('leads/automation/overdue-leads') @Roles('super_admin', 'marketing_manager', 'director')
  async getAutomationOverdueLeads() { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Get('leads/:id/contacts') @Roles('super_admin', 'marketing_manager', 'director', 'sales_manager')
  async getLeadContacts(@Param('id') id: string) { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Post('leads/:id/convert-to-crm') @Roles('super_admin', 'marketing_manager', 'director', 'sales_manager')
  async convertLeadToCrm(@Param('id') id: string) { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Get('inbox/stats') @Roles('super_admin', 'marketing_manager', 'director')
  async getInboxStats() { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Get('inbox/conversations') @Roles('super_admin', 'marketing_manager', 'director')
  async getInboxConversations() { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Get('inbox/conversations/:id/messages') @Roles('super_admin', 'marketing_manager', 'director')
  async getConversationMessages(@Param('id') id: string) { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Post('inbox/conversations/:id/reply') @Roles('super_admin', 'marketing_manager', 'director')
  async replyToConversation(@Param('id') id: string, @Body() body: Record<string, unknown>) { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Post('inbox/ai-reply/:id') @Roles('super_admin', 'marketing_manager', 'director')
  async aiReplyToConversation(@Param('id') id: string) { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Patch('inbox/conversations/:id/status') @Roles('super_admin', 'marketing_manager', 'director')
  async updateConversationStatus(@Param('id') id: string, @Body() body: Record<string, unknown>) { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Get('ab-tests') @Roles('super_admin', 'marketing_manager', 'director')
  async getAbTests() { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Get('competitors') @Roles('super_admin', 'marketing_manager', 'director')
  async getCompetitors() { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Get('churn-risk') @Roles('super_admin', 'marketing_manager', 'director')
  async getChurnRisk() { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Get('budget') @Roles('super_admin', 'marketing_manager', 'director')
  async getBudget(@Query('year') _year?: string) { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Get('calendar') @Roles('super_admin', 'marketing_manager', 'director')
  async getCalendar(@Query('month') _month?: string, @Query('year') _year?: string) { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Get('exhibitions') @Roles('super_admin', 'marketing_manager', 'director')
  async getExhibitions() { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Get('pr') @Roles('super_admin', 'marketing_manager', 'director')
  async getPr() { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Get('settings') @Roles('super_admin', 'marketing_manager')
  async getSettings() { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Get('exhibitions/:id/leads') @Roles('super_admin', 'marketing_manager', 'director')
  async getExhibitionLeads(@Param('id') id: string) { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Get('exhibitions/:id/qr') @Roles('super_admin', 'marketing_manager', 'director')
  async getExhibitionQr(@Param('id') id: string) { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Get('settings/social-api') @Roles('super_admin', 'marketing_manager')
  async getSocialApiSettings() { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Post('settings/social-api') @Roles('super_admin', 'marketing_manager')
  async createSocialApiSetting(@Body() body: Record<string, unknown>) { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Delete('settings/social-api/:id') @Roles('super_admin', 'marketing_manager')
  async deleteSocialApiSetting(@Param('id') id: string) { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Post('settings/setup-telegram-webhook') @Roles('super_admin', 'marketing_manager')
  async setupTelegramWebhook(@Body() _body: Record<string, unknown>) { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Get('website/blog') @Roles('super_admin', 'marketing_manager', 'director')
  async getBlogPosts() { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Get('website/blog/:id') @Roles('super_admin', 'marketing_manager', 'director')
  async getBlogPostById(@Param('id') id: string) { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Patch('website/blog/:id') @Roles('super_admin', 'marketing_manager')
  async updateBlogPost(@Param('id') id: string, @Body() body: Record<string, unknown>) { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Post('website/blog/:id/publish') @Roles('super_admin', 'marketing_manager')
  async publishBlogPost(@Param('id') id: string) { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Post('website/blog/ai-generate') @Roles('super_admin', 'marketing_manager')
  async aiGenerateBlogPost(@Body() body: Record<string, unknown>) { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Get() @Roles('super_admin', 'marketing_manager', 'director', 'manager')
  async getMarketingOverview() { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Get('budget/:id') @Roles('super_admin', 'marketing_manager', 'director')
  async getBudgetById(@Param('id') id: string) { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Get('calendar/:id') @Roles('super_admin', 'marketing_manager', 'director')
  async getCalendarById(@Param('id') id: string) { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Get('nps') @Roles('super_admin', 'marketing_manager', 'director')
  async getNps() { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Get('ai-assistant') @Roles('super_admin', 'marketing_manager', 'director')
  async getAiAssistant() { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Get('exhibitions/:id') @Roles('super_admin', 'marketing_manager', 'director')
  async getExhibitionById(@Param('id') id: string) { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Get('pr/:id') @Roles('super_admin', 'marketing_manager', 'director')
  async getPrById(@Param('id') id: string) { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Post('budget') @Roles('super_admin', 'marketing_manager')
  @HttpCode(HttpStatus.CREATED)
  async createBudget(@Body() body: Record<string, unknown>) { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Post('calendar') @Roles('super_admin', 'marketing_manager')
  @HttpCode(HttpStatus.CREATED)
  async createCalendarEvent(@Body() body: Record<string, unknown>) { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Post('churn-risk/ai-signal') @Roles('super_admin', 'marketing_manager', 'director')
  @HttpCode(HttpStatus.OK)
  async postChurnRiskAiSignal(@Body() _body: Record<string, unknown>) { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Post('exhibitions') @Roles('super_admin', 'marketing_manager')
  @HttpCode(HttpStatus.CREATED)
  async createExhibition(@Body() body: Record<string, unknown>) { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Post('exhibitions/:id/leads') @Roles('super_admin', 'marketing_manager', 'director')
  @HttpCode(HttpStatus.CREATED)
  async createExhibitionLead(@Param('id') id: string, @Body() body: Record<string, unknown>) { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Post('exhibitions/:id/qr') @Roles('super_admin', 'marketing_manager')
  @HttpCode(HttpStatus.OK)
  async generateExhibitionQr(@Param('id') id: string) { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Patch('leads/:id') @UseInterceptors(AuditInterceptor) @Roles('super_admin', 'marketing_manager', 'director', 'sales_manager')
  async patchLead(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return unwrapOrThrow(await this.leadsSvc.update(Number(id), body));
  }

  @Delete('leads/:id') @UseInterceptors(AuditInterceptor) @Roles('super_admin', 'marketing_manager', 'director')
  async deleteLead(@Param('id') _id: string) { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Post('leads/:id/contacts') @Roles('super_admin', 'marketing_manager', 'director', 'sales_manager')
  @HttpCode(HttpStatus.CREATED)
  async createLeadContact(@Param('id') id: string, @Body() body: Record<string, unknown>) { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Post('pr') @Roles('super_admin', 'marketing_manager')
  @HttpCode(HttpStatus.CREATED)
  async createPr(@Body() body: Record<string, unknown>) { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Post('settings') @Roles('super_admin', 'marketing_manager')
  @HttpCode(HttpStatus.OK)
  async saveSettings(@Body() body: Record<string, unknown>) { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Patch('settings/social-api/:id') @Roles('super_admin', 'marketing_manager')
  async patchSocialApiSetting(@Param('id') id: string, @Body() body: Record<string, unknown>) { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Post('website/blog') @Roles('super_admin', 'marketing_manager')
  @HttpCode(HttpStatus.CREATED)
  async createBlogPost(@Body() body: Record<string, unknown>) { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Delete('website/blog/:id') @Roles('super_admin', 'marketing_manager')
  async deleteBlogPost(@Param('id') id: string) { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }

  @Patch('website/blog/:id/publish') @Roles('super_admin', 'marketing_manager')
  async patchPublishBlogPost(@Param('id') id: string) { throw new HttpException('Tez orada amalga oshiriladi', HttpStatus.NOT_IMPLEMENTED); }
}
