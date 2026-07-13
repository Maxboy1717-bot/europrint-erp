/**
 * @module crm-extended.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 * @deprecated Legacy compatibility shim. New consumers should target the canonical
 *   crm-extended module endpoints (see docs/B5-compat-endpoints.md). Existing routes
 *   remain functional but receive no new features. Removal target: post-PA3 cutover.
 */
import { Controller, UseGuards, Get, Post, Body, Query, HttpCode, UseInterceptors, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { Roles } from '@common/decorators/roles.decorator';
import { CrmExtendedCompatService } from './crm-extended.service';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CrmCreateTaskDto, CrmChatDto, CrmAutoTasksDto, CrmChurnDto, CrmVoiceDto } from './dto/crm.dto';
import { unwrapOrInternal } from '@common/http-result';

@ApiTags('CRM Extended (Compat)')
@ApiBearerAuth()
@Roles('admin', 'manager', 'hr_manager', 'director')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@Controller('crm')
export class CrmExtendedCompatController {
  constructor(private readonly svc: CrmExtendedCompatService) {}

  @Get('invoices')
  async getCrmInvoices(@Query('page') page?: string, @Query('limit') limit?: string) {
    return unwrapOrInternal(await this.svc.getCrmInvoices(page, limit));
  }

  @Get('ai/dashboard-analysis')
  async getAiDashboardAnalysis() {
    return unwrapOrInternal(await this.svc.getAiDashboardAnalysis());
  }

  @Get('supervisor/dashboard')
  async getSupervisorDashboard() {
    return unwrapOrInternal(await this.svc.getSupervisorDashboard());
  }

  @Get('ai/supervisor-dashboard')
  async getSupervisorDashboardAi() {
    return unwrapOrInternal(await this.svc.getSupervisorDashboard());
  }

  @Get('ai/nba/:entityType/:entityId')
  async getNextBestAction() {
    const r = await this.svc.getNextBestAction();
    const items = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items, total: items.length };
  }

  @Get('ai/extended/insights')
  async getExtendedInsights() {
    const r = await this.svc.getExtendedInsights();
    const items = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items, total: items.length };
  }

  @Post('ai/create-task')
  @HttpCode(HttpStatus.CREATED)
  async createTask(@Body() body: CrmCreateTaskDto) {
    return unwrapOrInternal(await this.svc.createTask(body));
  }

  // Alias 'ai/extended/chat/respond' removed — it collided with the canonical
  // crm/ai controller (crm-ai-extended.controller.ts:231), which owns that path and
  // returns the honest 501 (Q-40). The collision crashed Fastify at boot.
  @Post('chat')
  @HttpCode(HttpStatus.OK)
  async processChat(@Body() body: CrmChatDto) {
    return unwrapOrInternal(await this.svc.processChat(body));
  }

  // Alias 'ai/extended/auto-tasks/create' removed — collided with the canonical
  // crm/ai controller (crm-ai-extended.controller.ts:119).
  @Post('auto-tasks')
  @HttpCode(HttpStatus.OK)
  async runAutoTasks(@Body() body: CrmAutoTasksDto) {
    return unwrapOrInternal(await this.svc.runAutoTasks(body));
  }

  @Post(['ai/churn', 'ai/extended/churn/analyze'])
  @HttpCode(HttpStatus.OK)
  async churnAnalysis(@Body() body: CrmChurnDto) {
    return unwrapOrInternal(await this.svc.churnAnalysis(body));
  }

  // Alias 'ai/extended/voice/analyze-call' removed — collided with the canonical
  // crm/ai controller (crm-ai-extended.controller.ts:223).
  @Post('ai/voice')
  @HttpCode(HttpStatus.OK)
  async processVoice(@Body() body: CrmVoiceDto) {
    return unwrapOrInternal(await this.svc.processVoice(body));
  }
}


@ApiTags('Marketing Extended (Compat)')
@ApiBearerAuth()
@Roles('admin', 'manager', 'hr_manager', 'director')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@Controller('marketing')
export class MarketingExtendedCompatController {
  constructor(private readonly svc: CrmExtendedCompatService) {}

  @Get('segments')
  async getMarketingSegments() {
    return unwrapOrInternal(await this.svc.getMarketingSegments());
  }
}
