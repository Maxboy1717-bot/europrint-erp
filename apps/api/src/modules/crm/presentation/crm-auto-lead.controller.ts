/**
 * @module crm-auto-lead.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { assertFound, assertRequired, assertAnyRequired } from '@common/assertions';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { safeInt } from '@common/db/db-rows';
import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Post, UseGuards, Logger , UseInterceptors, UsePipes } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { Public } from '@common/decorators/public.decorator';
import { WebhookSignatureGuard } from '@common/guards/webhook-signature.guard';
import { CrmAutoLeadService } from '../application/crm-auto-lead.service';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import {
  IngestCallLeadDtoSchema, IngestCallLeadDto,
  IngestFormLeadDtoSchema, IngestFormLeadDto,
  IngestTelegramLeadDtoSchema, IngestTelegramLeadDto,
  IngestWebsiteLeadDtoSchema, IngestWebsiteLeadDto,
  IngestWhatsappLeadDtoSchema, IngestWhatsappLeadDto,
  IngestSmsLeadDtoSchema, IngestSmsLeadDto,
  ChurnRescueDtoSchema, ChurnRescueDto,
} from './dto/crm-auto-lead.dto';

const CRM_AI_ROLES = ['sales_manager', 'SALES', 'crm_manager', 'director', 'super_admin'];

@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@ApiTags('Crm Auto Lead')
@Controller('crm')
@UseGuards(RolesGuard)
@Roles(...CRM_AI_ROLES)
export class CrmAutoLeadController {
  private readonly logger = new Logger(CrmAutoLeadController.name);

  constructor(private readonly svc: CrmAutoLeadService) {}

  @ApiOperation({ summary: 'Quick score' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('quick-score/:entityType/:id')
  async quickScore(@Param('entityType') entityType: string, @Param('id') id: string) {
    const _rQuickScore = await this.svc.quickScore(entityType, safeInt(id, 0));
    assertOk(_rQuickScore);
    const r = _rQuickScore.data as Record<string, unknown>;
    assertFound(r, `${entityType} not found`);
    return r;
  }

  @ApiOperation({ summary: 'Get supervisor dashboard' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('supervisor-dashboard')
  @Roles('sales_manager', 'director', 'super_admin')
  async getSupervisorDashboard() {
    return unwrapOrThrow(await this.svc.getSupervisorDashboard());
  }

  @ApiOperation({ summary: 'Churn rescue' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('churn-rescue/:entityType/:id')
  @UsePipes(new ZodValidationPipe(ChurnRescueDtoSchema))
  async churnRescue(@Param('entityType') entityType: string, @Param('id') id: string, @Body() _body: ChurnRescueDto) {
    return unwrapOrThrow(await this.svc.churnRescue(entityType, safeInt(id, 0)));
  }

  @ApiOperation({ summary: 'Get auto lead sources' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('auto-lead/sources')
  async getAutoLeadSources() {
    return unwrapOrThrow(await this.svc.getAutoLeadSources());
  }

  // ── Tashqi kanal ingestion (call/form/telegram/website) ───────────────────
  // `@Public()` bypasses the global JwtAuthGuard/RolesGuard (external callers have
  // no ERP session) but is "open-but-protected": `WebhookSignatureGuard` still
  // requires a valid `X-Webhook-Signature: HMAC-SHA256(CRM_WEBHOOK_SECRET_<SOURCE>
  // || CRM_WEBHOOK_SECRET, JSON.stringify(body))` header, rejecting any request
  // without a correct signature before it reaches the service layer.

  @ApiOperation({ summary: 'Ingest call lead (webhook — HMAC signed)' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Missing/invalid X-Webhook-Signature' })
  @Public()
  @UseGuards(WebhookSignatureGuard)
  @Post('auto-lead/call')
  @UsePipes(new ZodValidationPipe(IngestCallLeadDtoSchema))
  async ingestCallLead(@Body() body: IngestCallLeadDto) {
    assertRequired(body.phone, 'phone required');
    return unwrapOrThrow(await this.svc.ingestCallLead(body.phone, body.first_name, body.last_name, body.notes, body.source_meta));
  }

  @ApiOperation({ summary: 'Ingest form lead (webhook — HMAC signed)' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Missing/invalid X-Webhook-Signature' })
  @Public()
  @UseGuards(WebhookSignatureGuard)
  @Post('auto-lead/form')
  @UsePipes(new ZodValidationPipe(IngestFormLeadDtoSchema))
  async ingestFormLead(@Body() body: IngestFormLeadDto) {
    assertAnyRequired([body.email, body.phone], 'email or phone required');
    return unwrapOrThrow(await this.svc.ingestFormLead(body.email, body.phone, body.first_name, body.last_name, body.form_name, body.notes));
  }

  @ApiOperation({ summary: 'Ingest telegram lead (webhook — HMAC signed)' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Missing/invalid X-Webhook-Signature' })
  @Public()
  @UseGuards(WebhookSignatureGuard)
  @Post('auto-lead/telegram')
  @UsePipes(new ZodValidationPipe(IngestTelegramLeadDtoSchema))
  async ingestTelegramLead(@Body() body: IngestTelegramLeadDto) {
    assertRequired(body.telegram_id, 'telegram_id required');
    return unwrapOrThrow(await this.svc.ingestTelegramLead(body.telegram_id, body.first_name, body.last_name, body.username, body.message));
  }

  @ApiOperation({ summary: 'Ingest website lead (webhook — HMAC signed)' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Missing/invalid X-Webhook-Signature' })
  @Public()
  @UseGuards(WebhookSignatureGuard)
  @Post('auto-lead/website')
  @UsePipes(new ZodValidationPipe(IngestWebsiteLeadDtoSchema))
  async ingestWebsiteLead(@Body() body: IngestWebsiteLeadDto) {
    assertAnyRequired([body.email, body.phone], 'email or phone required');
    return unwrapOrThrow(await this.svc.ingestWebsiteLead(body.email, body.phone, body.first_name, body.last_name, body.page_url, body.message));
  }

  // SB0651/SB0671 fix: EP-CRM-007 names whatsapp/sms as channels alongside
  // telegram/website/call/form; those four were wired, whatsapp/sms were not.
  @ApiOperation({ summary: 'Ingest WhatsApp lead (webhook — HMAC signed)' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Missing/invalid X-Webhook-Signature' })
  @Public()
  @UseGuards(WebhookSignatureGuard)
  @Post('auto-lead/whatsapp')
  @UsePipes(new ZodValidationPipe(IngestWhatsappLeadDtoSchema))
  async ingestWhatsappLead(@Body() body: IngestWhatsappLeadDto) {
    assertRequired(body.phone, 'phone required');
    return unwrapOrThrow(await this.svc.ingestWhatsappLead(body.phone, body.first_name, body.last_name, body.message));
  }

  @ApiOperation({ summary: 'Ingest SMS lead (webhook — HMAC signed)' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Missing/invalid X-Webhook-Signature' })
  @Public()
  @UseGuards(WebhookSignatureGuard)
  @Post('auto-lead/sms')
  @UsePipes(new ZodValidationPipe(IngestSmsLeadDtoSchema))
  async ingestSmsLead(@Body() body: IngestSmsLeadDto) {
    assertRequired(body.phone, 'phone required');
    return unwrapOrThrow(await this.svc.ingestSmsLead(body.phone, body.first_name, body.last_name, body.message));
  }
}
