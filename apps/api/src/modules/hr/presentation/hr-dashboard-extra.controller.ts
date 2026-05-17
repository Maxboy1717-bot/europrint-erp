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

  // P3-26: bulk contracts listing not yet wired — use /contracts/expiring.
  @ApiOperation({ summary: 'Get contracts' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('contracts')
  async getContracts(@Query() _query: Record<string, unknown>) {
    throw new HttpException(
      { message: 'Endpoint not yet implemented: GET /hr/contracts', code: 'NOT_IMPLEMENTED' },
      HttpStatus.NOT_IMPLEMENTED,
    );
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
  // P3-26: HrCapital module (courses/stats) is not yet wired to a service.
  // Return 501 instead of fake empty payloads.
  @ApiOperation({ summary: 'Get courses' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('courses')
  async getCourses(@Query() _q: Record<string, unknown>) {
    throw new HttpException(
      { message: 'Endpoint not yet implemented: GET /hr-capital/courses', code: 'NOT_IMPLEMENTED' },
      HttpStatus.NOT_IMPLEMENTED,
    );
  }

  @ApiOperation({ summary: 'Get stats' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('stats')
  async getStats() {
    throw new HttpException(
      { message: 'Endpoint not yet implemented: GET /hr-capital/stats', code: 'NOT_IMPLEMENTED' },
      HttpStatus.NOT_IMPLEMENTED,
    );
  }
}
