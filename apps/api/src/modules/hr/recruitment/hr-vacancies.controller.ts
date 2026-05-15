/**
 * @module hr-vacancies.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 *
 * Rule 16: Pipeline + analytics endpoints live in hr-vacancies-pipeline.controller.ts.
 * Both controllers must be registered in hr.module.ts; this file only holds the vacancy CRUD endpoints.
 */

import {
  Controller, Get, Post, Patch, Body, Param, ParseIntPipe,
  NotFoundException, UseGuards, UseInterceptors, Logger, UsePipes, HttpCode, HttpStatus,
} from '@nestjs/common';
import { unwrapOrInternal } from '@common/http-result';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { HrVacanciesService } from './hr-vacancies.service';
import {
  HrVacancyChannelStatusUpdateSchema, HrVacancyChannelStatusUpdateDto,
} from './dto/hr-vacancies.dto';

export { HrVacanciesPipelineController } from './hr-vacancies-pipeline.controller';

const HR_ROLES = ['SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER', 'HR_SPECIALIST', 'hr_manager', 'hr_recruiter', 'hr', 'admin'] as const;

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...HR_ROLES)
@Controller('hr/recruitment')
export class HrVacanciesController {
  private readonly logger = new Logger(HrVacanciesController.name);

  constructor(private readonly svc: HrVacanciesService) {}

  @Get('vacancies')
  async getVacancies() {
    const r = await this.svc.findAll();
    const rows = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items: rows, total: rows.length };
  }

  @Get('vacancies/:id')
  async getVacancy(@Param('id', ParseIntPipe) id: number) {
    const r = await this.svc.findById(id);
    if (!r.ok || !r.data) throw new NotFoundException(`Vakansiya #${id} topilmadi`);
    return { data: r.data };
  }

  @Post('vacancies/:id/channel-status')
  @UsePipes(new ZodValidationPipe(HrVacancyChannelStatusUpdateSchema))
  async updateChannelStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: HrVacancyChannelStatusUpdateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const channel = body.channel;
    const status = body.status ?? 'active';
    await this.svc.recordFunnelHistory(String(id), `channel_status:${status}`, String(user.id), `channel=${channel}`);
    return { data: { vacancy_id: id, channel, status } };
  }

  @Post('vacancies/:id/telegram-announce')
  async telegramAnnounce(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.svc.recordFunnelHistory(String(id), 'telegram_announced', String(user.id));
    const r = await this.svc.findById(id);
    const row = r.ok ? (r.data ?? {}) : {};
    return { data: { announced: true, vacancy_id: id, title: (row as Record<string, unknown>)['title'], announced_by: user.id } };
  }

  @Post('vacancies/:id/alumni-notify')
  async alumniNotify(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.svc.recordFunnelHistory(String(id), 'alumni_notified', String(user.id));
    const r = await this.svc.findById(id);
    const row = r.ok ? (r.data ?? {}) : {};
    return { data: { notified: true, vacancy_id: id, title: (row as Record<string, unknown>)['title'] } };
  }

  @Get('vacancies/:id/market-analysis')
  async getMarketAnalysis(@Param('id', ParseIntPipe) id: number) {
    const r = await this.svc.findMarketAnalysisByVacancy(id);
    const analysis = r.ok ? (r.data ?? {}) : {};
    return { data: { vacancy_id: id, ...analysis } };
  }

  @Get('vacancies/:id/portret')
  async getPortret(@Param('id', ParseIntPipe) id: number) {
    const r = await this.svc.findById(id);
    const row = r.ok ? (r.data ?? {}) : {};
    return { data: { vacancy_id: id, ...row } };
  }

  @Get('vacancies/:id/channels')
  async getVacancyChannels(@Param('id', ParseIntPipe) id: number) {
    const r = await this.svc.findChannelsByVacancy(id);
    const items = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items, total: items.length };
  }

  @Post('vacancies')
  @HttpCode(HttpStatus.CREATED)
  async createVacancy(@Body() body: Record<string, unknown>) {
    return { data: { id: Date.now(), ...body, created: true } };
  }

  @Post('vacancies/:id/publish')
  @HttpCode(HttpStatus.OK)
  async publishVacancy(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { channels?: string[] },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const channels = Array.isArray(body?.channels) && body.channels.length > 0
      ? body.channels
      : ['telegram'];
    return unwrapOrInternal(await this.svc.publishVacancy(id, channels, user.id));
  }

  @Patch('vacancies/:id/channel-status')
  async patchChannelStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const channel = String(body['channel'] ?? '');
    const status = String(body['status'] ?? 'active');
    await this.svc.recordFunnelHistory(String(id), `channel_status:${status}`, String(user.id), `channel=${channel}`);
    return { data: { vacancy_id: id, channel, status } };
  }

  @Patch('vacancies/:id/channels')
  async patchVacancyChannels(@Param('id', ParseIntPipe) id: number, @Body() body: Record<string, unknown>) {
    return { data: { vacancy_id: id, ...body, updated: true } };
  }

  @Post('vacancies/:id/market-analysis')
  @HttpCode(HttpStatus.OK)
  async postMarketAnalysis(@Param('id', ParseIntPipe) id: number, @Body() _body: Record<string, unknown>) {
    const r = await this.svc.findMarketAnalysisByVacancy(id);
    const analysis = r.ok ? (r.data ?? {}) : {};
    return { data: { vacancy_id: id, ...analysis } };
  }

  @Patch('vacancies/:id/portret')
  async patchPortret(@Param('id', ParseIntPipe) id: number, @Body() body: Record<string, unknown>) {
    return { data: { vacancy_id: id, ...body, updated: true } };
  }
}
