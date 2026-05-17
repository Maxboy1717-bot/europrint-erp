/**
 * @module hr-vacancies-analytics.controller
 * @description Recruitment analytics + internal board endpoints split from
 * hr-vacancies-pipeline.controller.ts (Rule 16). Mounted under /hr/recruitment.
 */

import {
  Controller, Get, Post, Body, Param, ParseIntPipe,
  UseGuards, UseInterceptors, Logger, UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@common/types/user.types';
import { HrVacanciesService } from './hr-vacancies.service';
import { HrInternalApplySchema, HrInternalApplyDto } from './dto/hr-vacancies.dto';

const HR_ROLES = ['SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER', 'HR_SPECIALIST', 'hr_manager', 'hr_recruiter', 'hr', 'admin'] as const;

@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles(...HR_ROLES)
@ApiTags('Hr Vacancies Analytics')
@ApiBearerAuth()
@Controller('hr/recruitment')
export class HrVacanciesAnalyticsController {
  private readonly logger = new Logger(HrVacanciesAnalyticsController.name);

  constructor(private readonly svc: HrVacanciesService) {}

  @ApiOperation({ summary: 'Get checklist alerts' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('checklist-alerts')
  async getChecklistAlerts() {
    const r = await this.svc.findPipeline();
    const rows = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items: rows.slice(0, 20), total: rows.length };
  }

  @ApiOperation({ summary: 'Get kpi' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('kpi')
  async getKpi() {
    const r = await this.svc.findKpi();
    const rows = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items: rows, total: rows.length };
  }

  @ApiOperation({ summary: 'Get urgent' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('urgent')
  async getUrgent() {
    const r = await this.svc.findUrgent();
    const rows = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items: rows, total: rows.length };
  }

  @ApiOperation({ summary: 'Get worker type stats' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('worker-type-stats')
  async getWorkerTypeStats() {
    const r = await this.svc.findWorkerTypeStats();
    const rows = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items: rows, total: rows.length };
  }

  @ApiOperation({ summary: 'Get internal board' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('internal-board')
  async getInternalBoard() {
    const r = await this.svc.findInternalBoard();
    const rows = r.ok && Array.isArray(r.data) ? r.data : [];
    return { items: rows, total: rows.length };
  }

  @ApiOperation({ summary: 'Internal apply' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('internal-apply/:id')
  @UsePipes(new ZodValidationPipe(HrInternalApplySchema))
  async internalApply(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: HrInternalApplyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const note = String(body.note ?? '');
    const r = await this.svc.addCandidateToFunnel(id, user.id, note, 'INTERNAL');
    const row = r.ok ? r.data : {};
    return { data: { vacancy_id: id, applied_by: user.id, note, funnel: row } };
  }
}
