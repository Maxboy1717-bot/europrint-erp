import { assertFound, assertRequired, assertAnyRequired } from '@common/assertions';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { safeInt } from '../../hr/common/db-rows';
import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Post, UseGuards, Logger , UseInterceptors, UsePipes } from '@nestjs/common';

import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CrmAutoLeadService } from '../application/crm-auto-lead.service';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {
  IngestCallLeadDtoSchema, IngestCallLeadDto,
  IngestFormLeadDtoSchema, IngestFormLeadDto,
  IngestTelegramLeadDtoSchema, IngestTelegramLeadDto,
  IngestWebsiteLeadDtoSchema, IngestWebsiteLeadDto,
  ChurnRescueDtoSchema, ChurnRescueDto,
} from './dto/crm-auto-lead.dto';

const CRM_AI_ROLES = ['sales_manager', 'SALES', 'crm_manager', 'director', 'super_admin'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@Controller('crm')
@UseGuards(RolesGuard)
@Roles(...CRM_AI_ROLES)
export class CrmAutoLeadController {
  private readonly logger = new Logger(CrmAutoLeadController.name);

  constructor(private readonly svc: CrmAutoLeadService) {}

  @Get('quick-score/:entityType/:id')
  async quickScore(@Param('entityType') entityType: string, @Param('id') id: string) {
    const _rQuickScore = await this.svc.quickScore(entityType, safeInt(id, 0));
    assertOk(_rQuickScore);
    const r = _rQuickScore.data as Record<string, unknown>;
    assertFound(r, `${entityType} not found`);
    return r;
  }

  @Get('supervisor-dashboard')
  @Roles('sales_manager', 'director', 'super_admin')
  async getSupervisorDashboard() {
    return unwrapOrThrow(await this.svc.getSupervisorDashboard());
  }

  @Post('churn-rescue/:entityType/:id')
  @UsePipes(new ZodValidationPipe(ChurnRescueDtoSchema))
  async churnRescue(@Param('entityType') entityType: string, @Param('id') id: string, @Body() _body: ChurnRescueDto) {
    return {
      entity_type: entityType,
      entity_id: safeInt(id, 0),
      risk_level: 'medium',
      rescue_actions: [
        { action: 'personal_call', priority: 1 },
        { action: 'discount_offer', priority: 2 },
        { action: 'executive_outreach', priority: 3 },
      ],
    };
  }

  @Get('auto-lead/sources')
  async getAutoLeadSources() {
    return unwrapOrThrow(await this.svc.getAutoLeadSources());
  }

  @Post('auto-lead/call')
  @UsePipes(new ZodValidationPipe(IngestCallLeadDtoSchema))
  async ingestCallLead(@Body() body: IngestCallLeadDto) {
    assertRequired(body.phone, 'phone required');
    return unwrapOrThrow(await this.svc.ingestCallLead(body.phone, body.first_name, body.last_name, body.notes, body.source_meta));
  }

  @Post('auto-lead/form')
  @UsePipes(new ZodValidationPipe(IngestFormLeadDtoSchema))
  async ingestFormLead(@Body() body: IngestFormLeadDto) {
    assertAnyRequired([body.email, body.phone], 'email or phone required');
    return unwrapOrThrow(await this.svc.ingestFormLead(body.email, body.phone, body.first_name, body.last_name, body.form_name, body.notes));
  }

  @Post('auto-lead/telegram')
  @UsePipes(new ZodValidationPipe(IngestTelegramLeadDtoSchema))
  async ingestTelegramLead(@Body() body: IngestTelegramLeadDto) {
    assertRequired(body.telegram_id, 'telegram_id required');
    return unwrapOrThrow(await this.svc.ingestTelegramLead(body.telegram_id, body.first_name, body.last_name, body.username, body.message));
  }

  @Post('auto-lead/website')
  @UsePipes(new ZodValidationPipe(IngestWebsiteLeadDtoSchema))
  async ingestWebsiteLead(@Body() body: IngestWebsiteLeadDto) {
    assertAnyRequired([body.email, body.phone], 'email or phone required');
    return unwrapOrThrow(await this.svc.ingestWebsiteLead(body.email, body.phone, body.first_name, body.last_name, body.page_url, body.message));
  }
}
