/**
 * @module hr-dashboard-extra.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, HttpException, HttpStatus, Param, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { unwrapOrInternal } from '@common/http-result';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { HrDashboardExtraService } from '../application/hr-dashboard-extra.service';

// FEATURE_FLAGGED: bulk contracts + HrCapital courses/stats not wired (tracking #FX-9).
const hrExtraNotImplemented = (route: string): never => {
  throw new HttpException(
    { message: `Endpoint not yet implemented: ${route}`, code: 'NOT_IMPLEMENTED' },
    HttpStatus.NOT_IMPLEMENTED,
  );
};

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
    return { data: unwrapOrInternal(await this.svc.getResignationStatsProjected()) };
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
    return { data: unwrapOrInternal(await this.svc.getRiskScoresProjected()) };
  }

  @ApiOperation({ summary: 'Get safety summary' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('safety/summary')
  async getSafetySummary() {
    return unwrapOrInternal(await this.svc.getSafetySummaryProjected());
  }

  @ApiOperation({ summary: 'Get safety incidents' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('safety/incidents')
  async getSafetyIncidents() {
    return unwrapOrInternal(await this.svc.getSafetyIncidentsRaw());
  }

  @ApiOperation({ summary: 'Get offboarding stats' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('offboarding/cases/stats')
  async getOffboardingStats() {
    return unwrapOrInternal(await this.svc.getOffboardingStats());
  }

  @ApiOperation({ summary: 'Get safety overview' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('safety')
  async getSafetyOverview() {
    return { data: unwrapOrInternal(await this.svc.getSafetyOverview()) };
  }

  @ApiOperation({ summary: 'Get contracts' })
  @ApiResponse({ status: 501, description: 'Feature gated off — tracking #FX-9 (use /contracts/expiring)' })
  @Get('contracts')
  async getContracts(@Query() _query: Record<string, unknown>) {
    return hrExtraNotImplemented('GET /hr/contracts');
  }

  @ApiOperation({ summary: 'Get contracts expiring' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('contracts/expiring')
  async getContractsExpiring(@Query('days') days?: string) {
    const d = Math.min(parseInt(days ?? '30', 10) || 30, 365);
    return { data: unwrapOrInternal(await this.svc.getContractsExpiringProjected(d)) };
  }
}

@Controller('hr-capital')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
@Roles('HR_MANAGER', 'SUPER_ADMIN', 'DIRECTOR', 'ADMIN')
export class HrCapitalController {
  @ApiOperation({ summary: 'Get courses' })
  @ApiResponse({ status: 501, description: 'Feature gated off — tracking #FX-9' })
  @Get('courses')
  async getCourses(@Query() _q: Record<string, unknown>) {
    return hrExtraNotImplemented('GET /hr-capital/courses');
  }

  @ApiOperation({ summary: 'Get stats' })
  @ApiResponse({ status: 501, description: 'Feature gated off — tracking #FX-9' })
  @Get('stats')
  async getStats() {
    return hrExtraNotImplemented('GET /hr-capital/stats');
  }
}
