/**
 * @module crm-leads.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { unwrapOrThrow } from '@common/http-result';
import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors, Logger } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { CommandBus } from '@nestjs/cqrs';
import { z } from 'zod';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { QualifyLeadCommand } from '../application/commands/qualify-lead.handler';
import { LeadsService } from '../leads/leads.service';
import { safeInt } from '@common/db/db-rows';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@common/types/user.types';

const LeadCreateSchema = z.object({
  firstName: z.string().max(200).optional(),
  lastName: z.string().max(200).optional(),
  name: z.string().max(200).optional(),
  fullName: z.string().max(400).optional(),
  title: z.string().max(400).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().max(200).optional(),
  source: z.string().max(50).optional(),
  sourceId: z.union([z.string(), z.number()]).optional(),
  status: z.string().max(50).optional(),
  notes: z.string().max(2000).optional(),
  comments: z.string().max(2000).optional(),
  companyId: z.union([z.string(), z.number()]).optional(),
  assignedTo: z.union([z.string(), z.number()]).optional(),
  assignedById: z.union([z.string(), z.number()]).optional(),
  phones: z.array(z.record(z.string(), z.string())).optional(),
  emails: z.array(z.record(z.string(), z.string())).optional(),
}).passthrough();

const UpdateLeadStageSchema = z.object({
  statusId: z.string().optional(),
  stageId: z.string().optional(),
  stage_id: z.union([z.string(), z.number()]).optional(),
  status: z.string().optional(),
}).passthrough();

const QualifyLeadSchema = z.object({
  expectedDealAmount: z.union([z.string(), z.number()]).optional(),
}).passthrough();

const SendLeadEmailSchema = z.object({
  subject: z.string().max(500).optional(),
  body: z.string().max(50000).optional(),
  to: z.union([z.string(), z.array(z.string())]).optional(),
}).passthrough();

/** Accepts both Bitrix-style {title, phones, emails} and camelCase {firstName, lastName, phone, email} */
function normalizeLeadDto(dto: Record<string, unknown>): Record<string, unknown> {
  const phones = Array.isArray(dto.phones) ? (dto.phones as Array<Record<string, string>>) : [];
  const emails = Array.isArray(dto.emails) ? (dto.emails as Array<Record<string, string>>) : [];
  // Name can arrive as fullName, name, or title (the QuickCreate modal sends `title`).
  // Unify into one source and split into first/last so contact_name is always populated
  // → converted customers get the REAL name, not "Lead #<id>".
  const nameSrc = String(dto.fullName ?? dto.name ?? dto.title ?? '').trim();
  const nameParts = nameSrc.split(/\s+/).filter(Boolean);
  return {
    firstName:  dto.firstName  ?? nameParts[0] ?? '',
    lastName:   dto.lastName   ?? nameParts.slice(1).join(' ') ?? '',
    phone:      dto.phone      ?? phones[0]?.['value'] ?? '',
    email:      dto.email      ?? emails[0]?.['value'] ?? '',
    source:     dto.source     ?? dto.sourceId          ?? 'website',
    status:     dto.status     ?? 'new',
    notes:      dto.notes      ?? dto.comments,
    companyId:  dto.companyId,
    assignedTo: dto.assignedTo ?? dto.assignedById,
  };
}

const CRM_READ_ROLES = ['sales_manager', 'SALES', 'crm_manager', 'director', 'super_admin'];

@ApiTags('Crm Leads')
@ApiBearerAuth()
@Controller('crm/leads')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@ApiThrottle()
@Roles(...CRM_READ_ROLES)
export class CrmLeadsController {
  private readonly logger = new Logger(CrmLeadsController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly leadsService: LeadsService,
  ) {}

  @ApiOperation({ summary: 'List' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  async list(
    @Query('limit') limit?: string,
    @Query('page') page?: string,
    @Query('status') _status?: string,
  ) {
    const res = await this.leadsService.findAll({
      limit: safeInt(limit, 20),
      page: safeInt(page, 1),
    });
    return unwrapOrThrow(res);
  }

  @ApiOperation({ summary: 'Quick leads' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('quick')
  async quickLeads(@Query('limit') _limit?: string) {
    const res = await this.leadsService.findAll({ limit: safeInt(_limit, 10) });
    return unwrapOrThrow(res);
  }

  @ApiOperation({ summary: 'Get by id' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id')
  async getById(@Param('id') id: string) {
    // findOne already unwraps (returns the row or throws NotFound/500). It is NOT a Result
    // envelope, so it must NOT be passed through unwrapOrThrow again — doing so read
    // `.error.message` on a plain row → "Cannot read properties of undefined" → 500/503.
    return await this.leadsService.findOne(safeInt(id, 0));
  }

  @ApiOperation({ summary: 'Get lead emails' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id/emails')
  async getLeadEmails(@Param('id') id: string) {
    // findOne already unwraps (row or throws) — do not double-unwrap (see getById).
    const lead = await this.leadsService.findOne(safeInt(id, 0));
    const emails = Array.isArray((lead as Record<string, unknown>).emails)
      ? ((lead as Record<string, unknown>).emails as { value: string; type: string }[])
      : [];
    return { items: emails, total: emails.length };
  }

  @ApiOperation({ summary: 'Create' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  async create(@Body() dto: unknown, @CurrentUser() user: AuthenticatedUser) {
    const parsed = LeadCreateSchema.parse(dto);
    // Item A (CRM ownership convergence): default assigned_to to the creating user when no explicit
    // assignee is given; an explicit assignedTo/assignedById in the body still wins (repo COALESCE order).
    const res = await this.leadsService.create(normalizeLeadDto(parsed as Record<string, unknown>), user?.id);
    return unwrapOrThrow(res);
  }

  @ApiOperation({ summary: 'Update stage' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id/stage')
  async updateStage(@Param('id') id: string, @Body() dto: unknown) {
    const parsed = UpdateLeadStageSchema.parse(dto);
    const statusId = String(
      parsed.stage_id ?? parsed.statusId ?? parsed.stageId ?? parsed.status ?? 'NEW',
    );
    // CRM-2: statusId (camelCase Drizzle accessor) ishlatiladi, 'status' emas
    const res = await this.leadsService.update(safeInt(id, 0), { statusId: statusId.toUpperCase(), status: statusId.toLowerCase() });
    return unwrapOrThrow(res);
  }

  @ApiOperation({ summary: 'Qualify' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch(':id/qualify')
  async qualify(@Param('id') id: string, @Body() dto: unknown) {
    const parsed = QualifyLeadSchema.parse(dto);
    const command = new QualifyLeadCommand(safeInt(id, 0), Number(parsed.expectedDealAmount) || 0, new Date());
    return unwrapOrThrow(await this.commandBus.execute(command));
  }

  @ApiOperation({ summary: 'Send lead email' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post(':id/emails')
  async sendLeadEmail(@Param('id') id: string, @Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    const parsed = SendLeadEmailSchema.parse(body);
    // A3: was { id: Date.now(), sent: true } — a green-lie (no email sent, nothing saved). No mail
    // provider is configured, so we honestly LOG the email as a lead activity (queued) instead of
    // claiming it was sent. Returns { leadId, subject, queued: true, activityId }.
    const bodyText = parsed.body != null ? String(parsed.body) : '';
    return unwrapOrThrow(await this.leadsService.logEmail(safeInt(id, 0), String(parsed.subject ?? ''), bodyText, user?.id ?? null));
  }

  @ApiOperation({ summary: 'Create quick lead' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('quick')
  async createQuickLead(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    const parsed = LeadCreateSchema.parse(body);
    // Item A: same default-to-creator ownership as create() above.
    const res = await this.leadsService.create(normalizeLeadDto(parsed as Record<string, unknown>), user?.id);
    return unwrapOrThrow(res);
  }
}
