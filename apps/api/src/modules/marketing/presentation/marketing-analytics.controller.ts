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
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { unwrapOrBadRequest, unwrapOrThrow, unwrapOrInternal } from '@common/http-result';
import { MarketingExtService } from '../application/marketing-ext.service';
import { LeadsService } from '../leads/leads.service';
import {
  CreateSocialPostDtoSchema, CreateSocialPostDto,
  UpdateSocialPostDtoSchema, UpdateSocialPostDto,
  CreateEmailTemplateDtoSchema, CreateEmailTemplateDto,
  UpdateEmailTemplateDtoSchema, UpdateEmailTemplateDto,
  UpdateLeadStatusDtoSchema, UpdateLeadStatusDto,
} from './dto/marketing-ext.dto';

export { MarketingAnalyticsStubsController } from './marketing-analytics-stubs.controller';

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

  @Patch('leads/:id')
  @UseInterceptors(AuditInterceptor)
  @Roles('super_admin', 'marketing_manager', 'director', 'sales_manager')
  async patchLead(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return unwrapOrThrow(await this.leadsSvc.update(Number(id), body));
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

  @Get('leads/loss-analysis')
  @Roles('super_admin', 'marketing_manager', 'director', 'sales_manager', 'manager')
  async getLeadsLossAnalysis() {
    try {
      const rows = await this.leadsSvc.getLossAnalysis();
      return rows;
    } catch {
      return { total: 0, breakdown: [] };
    }
  }
}
