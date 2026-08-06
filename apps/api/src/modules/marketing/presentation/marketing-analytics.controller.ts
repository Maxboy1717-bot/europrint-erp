/**
 * @module marketing-analytics.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 *
 * Rule 16: NOT_IMPLEMENTED stub endpoints live in marketing-analytics-stubs.controller.ts.
 * Both controllers must be registered in marketing.module.ts.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import {
  Controller, Get, Post, Put, Delete, Patch, Param, Body, Query,
  UseGuards, UseInterceptors, Logger, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { unwrapOrBadRequest, unwrapOrThrow, unwrapOrInternal } from '@common/http-result';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@common/types/user.types';
import { MarketingExtService } from '../application/marketing-ext.service';
import { OrderTrendService } from '../application/order-trend.service';
import { LeadsService } from '../leads/leads.service';
import {
  CreateSocialPostDtoSchema, CreateSocialPostDto,
  UpdateSocialPostDtoSchema, UpdateSocialPostDto,
  CreateEmailTemplateDtoSchema, CreateEmailTemplateDto,
  UpdateEmailTemplateDtoSchema, UpdateEmailTemplateDto,
  UpdateLeadStatusDtoSchema, UpdateLeadStatusDto,
} from './dto/marketing-ext.dto';
import { z } from 'zod';

const MarketingLeadSchema = z.object({
  name: z.string().max(500).optional(),
  email: z.string().max(200).optional(),
  phone: z.string().max(50).optional(),
  source: z.string().max(100).optional(),
  status: z.string().max(50).optional(),
  notes: z.string().max(2000).optional(),
  // VISION EP-MKT-118 / #96 (owner qaror QARORLAR-JURNALI-2026-07-11: "SD'ga o'tish
  // majburiy → STIR + shartnoma + manzil") — convertLeadToCrm darvozasi shu 3 ta
  // maydonni tekshiradi; shu yerda kiritish/yangilash imkoniyati beriladi.
  stir: z.string().max(20).optional(),
  contractNumber: z.string().max(100).optional(),
  address: z.string().max(1000).optional(),
}).passthrough();

const MarketingLeadUpdateSchema = MarketingLeadSchema.partial();

export { MarketingAnalyticsStubsController } from './marketing-analytics-stubs.controller';

@ApiTags('§17 Marketing Analytics')
@ApiBearerAuth()
@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('marketing')
@Roles('super_admin', 'director', 'manager')
export class MarketingAnalyticsController {
  private readonly logger = new Logger(MarketingAnalyticsController.name);

  constructor(
    private readonly svc: MarketingExtService,
    private readonly leadsSvc: LeadsService,
    private readonly orderTrendSvc: OrderTrendService,
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
  async createLead(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    const dto = MarketingLeadSchema.parse(body);
    // vision 14-marketing#43: no dealer portal — a "manba: diler" lead is entered on behalf of
    // the acting marketing employee, so thread the current user id through as the lead owner.
    return unwrapOrThrow(await this.leadsSvc.create(dto as Record<string, unknown>, user?.id));
  }

  @Get('leads/loss-analysis')
  @Roles('super_admin', 'marketing_manager', 'director', 'sales_manager', 'manager')
  @ApiOperation({ summary: 'Lead yo`qotish sabablari analitikasi' })
  @ApiResponse({ status: 200, description: 'OK' })
  async getLeadsLossAnalysis() {
    const r = await this.leadsSvc.getLossAnalysis();
    if (!r.ok) return { total: 0, breakdown: [] };
    return r.data;
  }

  @Get('leads/:id')
  @ApiOperation({ summary: 'Lead tafsiloti' })
  async getLead(@Param('id') id: string) {
    // marketing_leads.id is varchar (slug) — pass it straight through (was Number(id) -> NaN).
    // findOne now returns the raw row or throws 404, so no unwrap wrapper here.
    return await this.leadsSvc.findOne(id);
  }

  @Put('leads/:id')
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: "Lead ma'lumotlarini yangilash" })
  async updateLead(@Param('id') id: string, @Body() body: unknown) {
    const dto = MarketingLeadUpdateSchema.parse(body);
    return unwrapOrThrow(await this.leadsSvc.update(id, dto as Record<string, unknown>));
  }

  @Patch('leads/:id/status')
  @UseInterceptors(AuditInterceptor)
  @ApiOperation({ summary: 'Lead statusini yangilash' })
  async updateLeadStatus(@Param('id') id: string, @Body() body: UpdateLeadStatusDto) {
    const dto = UpdateLeadStatusDtoSchema.parse(body);
    return unwrapOrThrow(await this.leadsSvc.update(id, { status: dto.status }));
  }

  @Patch('leads/:id')
  @UseInterceptors(AuditInterceptor)
  @Roles('super_admin', 'marketing_manager', 'manager', 'director', 'sales_manager')
  @ApiOperation({ summary: "Lead ma'lumotlarini patch qilish" })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async patchLead(@Param('id') id: string, @Body() body: unknown) {
    const dto = MarketingLeadUpdateSchema.parse(body);
    return unwrapOrThrow(await this.leadsSvc.update(id, dto as Record<string, unknown>));
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

  @Get('analytics/channel-roi')
  @ApiOperation({
    summary: 'Kanal kesimida sarf/lid/ROI taqsimoti (EP-MKT-002 / EP-MKT-031)',
  })
  @ApiResponse({ status: 200, description: 'OK' })
  async getChannelRoi() {
    return unwrapOrInternal(await this.svc.getChannelRoi());
  }

  @Get('analytics/order-trend')
  @ApiOperation({
    summary: "'Kichiklashgan buyurtma' signali — pul qiymati kamaygan mijozlar (vision 14 #12)",
  })
  @ApiResponse({ status: 200, description: 'OK' })
  async getOrderTrend() {
    return unwrapOrInternal(await this.orderTrendSvc.getOrderValueTrend());
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
    // campaign ids are varchar slugs — pass the raw id (Number(id) -> NaN 500'd the lookup).
    return unwrapOrBadRequest(await this.svc.getCampaignStats(id));
  }

}
