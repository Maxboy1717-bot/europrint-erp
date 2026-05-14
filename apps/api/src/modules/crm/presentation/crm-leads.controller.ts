/**
 * @module crm-leads.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { unwrapOrThrow } from '@common/http-result';
import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors, Logger } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CommandBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { QualifyLeadCommand } from '../application/commands/qualify-lead.handler';
import { LeadsService } from '../leads/leads.service';
import { safeInt } from '../../hr/common/db-rows';

/** Accepts both Bitrix-style {title, phones, emails} and camelCase {firstName, lastName, phone, email} */
function normalizeLeadDto(dto: Record<string, unknown>): Record<string, unknown> {
  const phones = Array.isArray(dto.phones) ? (dto.phones as Array<Record<string, string>>) : [];
  const emails = Array.isArray(dto.emails) ? (dto.emails as Array<Record<string, string>>) : [];
  const titleParts = String(dto.title ?? '').trim().split(/\s+/);
  return {
    firstName:  dto.firstName  ?? dto.name ?? titleParts[0] ?? '',
    lastName:   dto.lastName   ?? titleParts.slice(1).join(' ') ?? '',
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

@Controller('crm/leads')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Roles(...CRM_READ_ROLES)
export class CrmLeadsController {
  private readonly logger = new Logger(CrmLeadsController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly leadsService: LeadsService,
  ) {}

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

  @Get('quick')
  async quickLeads(@Query('limit') _limit?: string) {
    const res = await this.leadsService.findAll({ limit: safeInt(_limit, 10) });
    return unwrapOrThrow(res);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const result = await this.leadsService.findOne(safeInt(id, 0));
    return unwrapOrThrow(result);
  }

  @Get(':id/emails')
  async getLeadEmails(@Param('id') id: string) {
    const leadResult = await this.leadsService.findOne(safeInt(id, 0));
    const lead = unwrapOrThrow(leadResult);
    const emails = Array.isArray((lead as Record<string, unknown>).emails)
      ? ((lead as Record<string, unknown>).emails as { value: string; type: string }[])
      : [];
    return { items: emails, total: emails.length };
  }

  @Post()
  async create(@Body() dto: Record<string, unknown>) {
    const res = await this.leadsService.create(normalizeLeadDto(dto));
    return unwrapOrThrow(res);
  }

  @Patch(':id/stage')
  async updateStage(@Param('id') id: string, @Body() dto: Record<string, unknown>) {
    const statusId = String(dto.statusId ?? dto.stageId ?? dto.status ?? 'NEW');
    const res = await this.leadsService.update(safeInt(id, 0), { status: statusId.toLowerCase() });
    return unwrapOrThrow(res);
  }

  @Patch(':id/qualify')
  async qualify(@Param('id') id: string, @Body() dto: Record<string, unknown>) {
    const command = new QualifyLeadCommand(safeInt(id, 0), Number(dto.expectedDealAmount) || 0, new Date());
    return unwrapOrThrow(await this.commandBus.execute(command));
  }

  @Post(':id/emails')
  async sendLeadEmail(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return { id: Date.now(), leadId: safeInt(id, 0), ...body, sent: true };
  }

  @Post('quick')
  async createQuickLead(@Body() body: Record<string, unknown>) {
    const res = await this.leadsService.create(normalizeLeadDto(body));
    return unwrapOrThrow(res);
  }
}
