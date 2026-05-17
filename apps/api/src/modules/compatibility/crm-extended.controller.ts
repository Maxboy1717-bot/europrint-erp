/**
 * @module crm-extended.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
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
import {
  CrmInvoiceAclTranslator,
  type LegacyCrmInvoiceRow,
  type CrmInvoiceDto,
} from './acl/crm-invoice-acl';

@ApiTags('CRM Extended (Compat)')
@ApiBearerAuth()
@Roles('admin', 'manager', 'hr_manager', 'director')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@Controller('crm')
export class CrmExtendedCompatController {
  /** PA2-14 ACL translator. Stateless — direct instantiation is fine. */
  private readonly invoiceAcl = new CrmInvoiceAclTranslator();

  constructor(private readonly svc: CrmExtendedCompatService) {}

  @Get('invoices')
  async getCrmInvoices(@Query('page') page?: string, @Query('limit') limit?: string) {
    return unwrapOrInternal(await this.svc.getCrmInvoices(page, limit));
  }

  /**
   * PA2-14 ACL-translated variant of CRM invoices. Envelope-preserving:
   * the legacy `{data, total, page}` shape is kept, but `data` is
   * narrowed to typed `CrmInvoiceDto[]`. New BC-8 (Sales / CRM) consumers
   * should target this route; `/invoices` stays for backwards-compat.
   */
  @Get('invoices/v2')
  async getCrmInvoicesV2(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{ data: CrmInvoiceDto[]; total: number; page: number }> {
    const envelope = unwrapOrInternal(await this.svc.getCrmInvoices(page, limit)) as unknown as {
      data?: LegacyCrmInvoiceRow[];
      total?: unknown;
      page?: unknown;
    };
    const rawRows = Array.isArray(envelope?.data) ? envelope.data : [];
    const translated = rawRows
      .map((row) => this.invoiceAcl.toDomain(row))
      .filter((r): r is { ok: true; data: CrmInvoiceDto } => r.ok)
      .map((r) => r.data);
    const total = typeof envelope?.total === 'number' ? envelope.total : Number(envelope?.total ?? 0) || 0;
    const pageNum = typeof envelope?.page === 'number' ? envelope.page : Number(envelope?.page ?? 1) || 1;
    return { data: translated, total, page: pageNum };
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

  @Post(['chat', 'ai/extended/chat/respond'])
  @HttpCode(HttpStatus.OK)
  async processChat(@Body() body: CrmChatDto) {
    return unwrapOrInternal(await this.svc.processChat(body));
  }

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

  @Post(['ai/voice', 'ai/extended/voice/analyze-call'])
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
