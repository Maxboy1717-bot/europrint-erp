/**
 * @module hr-dashboard-extra.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, HttpException, HttpStatus, Param, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { unwrapOrInternal, unwrapOrDefault } from '@common/http-result';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { HrDashboardExtraService } from '../application/hr-dashboard-extra.service';
import { notImplemented } from '@common/exceptions/not-implemented';



@ApiThrottle()
@ApiTags('Hr Dashboard Extra')
@Controller('hr')
@UseGuards(RolesGuard)
@Roles('HR_MANAGER', 'HR_SPECIALIST', 'SUPER_ADMIN', 'DIRECTOR', 'ADMIN', 'MANAGER')
@UseInterceptors(AuditInterceptor)
export class HrDashboardExtraController {
  constructor(private readonly svc: HrDashboardExtraService) {}

  @ApiOperation({ summary: 'Get resignation stats' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('resignation-stats')
  async getResignationStats() {
    const r = await this.svc.getResignationStatsProjected();
    return { data: r.ok && r.data ? r.data : [] };
  }

  @ApiOperation({ summary: 'Get resignation stats by lang' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('resignation-stats/:lang')
  getResignationStatsByLang() {
    return this.getResignationStats();
  }

  @ApiOperation({ summary: 'Get risk scores' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('risk-scores')
  async getRiskScores() {
    const r = await this.svc.getRiskScoresProjected();
    return { data: r.ok && r.data ? r.data : { scores: [], stats: {} } };
  }

  @ApiOperation({ summary: 'Get safety summary' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('safety/summary')
  async getSafetySummary() {
    const r = await this.svc.getSafetySummaryProjected();
    return r.ok && r.data ? r.data : { incidentsThisMonth: 0, ppeCompliancePercent: 0, expiringTrainings: 0, openIncidents: 0 };
  }

  @ApiOperation({ summary: 'Get safety incidents' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('safety/incidents')
  async getSafetyIncidents() {
    const r = await this.svc.getSafetyIncidentsRaw();
    return r.ok && Array.isArray(r.data) ? r.data : [];
  }

  @ApiOperation({ summary: 'Get offboarding stats' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('offboarding/cases/stats')
  async getOffboardingStats() {
    const r = await this.svc.getOffboardingStats();
    // P1.18: FE expects { active, completed, cancelled, total } — normalise field names
    const d = (r.ok && r.data ? r.data : {}) as Record<string, unknown>;
    return {
      total:      Number(d['total']       ?? 0),
      completed:  Number(d['completed']   ?? 0),
      inProgress: Number(d['inProgress']  ?? 0),
      active:     Number(d['active']      ?? d['inProgress'] ?? 0),
      cancelled:  Number(d['cancelled']   ?? 0),
    };
  }

  @ApiOperation({ summary: 'Get safety overview' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('safety')
  async getSafetyOverview() {
    const r = await this.svc.getSafetyOverview();
    return { data: r.ok && r.data ? r.data : { incidents: [], summary: {} } };
  }

  @ApiOperation({ summary: 'Get contracts' })
  @ApiResponse({ status: 501, description: 'Feature gated off - tracking #FX-9 (use /contracts/expiring)' })
  @Get('contracts')
  async getContracts(@Query() _query: Record<string, unknown>) {
    return notImplemented('GET /hr/contracts');
  }

  @ApiOperation({ summary: 'Get contracts expiring' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('contracts/expiring')
  async getContractsExpiring(@Query('days') days?: string) {
    const d = Math.min(parseInt(days ?? '30', 10) || 30, 365);
    const r = await this.svc.getContractsExpiringProjected(d);
    return { data: r.ok && Array.isArray(r.data) ? r.data : [] };
  }
}

@Controller('hr-capital')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles('HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR', 'ADMIN')
export class HrCapitalController {
  @ApiOperation({ summary: 'Get courses' })
  @ApiResponse({ status: 501, description: 'Feature gated off - tracking #FX-9' })
  @Get('courses')
  async getCourses(@Query() _q: Record<string, unknown>) {
    return notImplemented('GET /hr-capital/courses');
  }

  @ApiOperation({ summary: 'Get stats' })
  @ApiResponse({ status: 501, description: 'Feature gated off - tracking #FX-9' })
  @Get('stats')
  async getStats() {
    return notImplemented('GET /hr-capital/stats');
  }
}
