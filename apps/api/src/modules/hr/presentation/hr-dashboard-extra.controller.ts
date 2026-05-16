/**
 * @module hr-dashboard-extra.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, HttpException, HttpStatus, Param, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { throwFromError, assertOk, unwrapOrThrow, unwrapOrInternal } from '@common/http-result';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { HrDashboardExtraService } from '../application/hr-dashboard-extra.service';

const COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF', '#C7B3E0'];

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
    const _rRows = await this.svc.getResignationStats();
    const rows = unwrapOrThrow(_rRows) as Record<string, unknown>[];
    const data = rows.length > 0
      ? (Array.isArray(rows) ? rows : []).map((row, i) => ({ reason: String(row.reason), count: Number(row.count), color: COLORS[i % COLORS.length] }))
      : [{ reason: "Ma'lumot yo'q", count: 0, color: COLORS[0] }];
    return { data };
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
    const _rRows = await this.svc.getRiskScores();
    const rows = unwrapOrThrow(_rRows);
    const scores = (Array.isArray(rows) ? rows : []).map(row => ({
      id: String(row.id ?? ''),
      fullName: String(row.full_name ?? ''),
      departmentName: String(row.department_name ?? ''),
      positionName: String(row.position_name ?? ''),
      riskLevel: String(row.risk_level ?? 'low') as 'low' | 'medium' | 'high' | 'critical',
      overallScore: Number(row.overall_score ?? 0),
      factors: {} as Record<string, number>,
    }));
    const stats = {
      low:      (Array.isArray(scores) ? scores : []).filter(s => s.riskLevel === 'low').length,
      medium:   (Array.isArray(scores) ? scores : []).filter(s => s.riskLevel === 'medium').length,
      high:     (Array.isArray(scores) ? scores : []).filter(s => s.riskLevel === 'high').length,
      critical: (Array.isArray(scores) ? scores : []).filter(s => s.riskLevel === 'critical').length,
    };
    return { data: { scores, stats } };
  }

  @ApiOperation({ summary: 'Get safety summary' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('safety/summary')
  async getSafetySummary() {
    const _rRow = await this.svc.getSafetySummary();
    const row = (_rRow.ok ? _rRow.data : null) as Record<string, unknown> | null;
    // Return bare object so queryClient passes it through correctly
    return {
      incidentsThisMonth:   Number(row?.this_month ?? 0),
      ppeCompliancePercent: 0,
      expiringTrainings:    0,
      openIncidents:        Number(row?.open_count ?? 0),
    };
  }

  @ApiOperation({ summary: 'Get safety incidents' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('safety/incidents')
  async getSafetyIncidents() {
    // Use unwrapOrInternal so the bare array is returned directly to the frontend
    return unwrapOrInternal(await this.svc.getSafetyIncidents());
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
    const [incidentsData, summaryData] = await Promise.allSettled([
      this.svc.getSafetyIncidents(),
      this.svc.getSafetySummary(),
    ]);
    const _incV = incidentsData.status === 'fulfilled' ? incidentsData.value : null;
    const incidents = (_incV?.ok ? _incV.data : []) as Record<string, unknown>[];
    const _sumV = summaryData.status === 'fulfilled' ? summaryData.value : null;
    const summary = (_sumV?.ok ? _sumV.data : null) as Record<string, unknown> | null;
    return { data: {
      incidents: incidents.slice(0, 5),
      summary: {
        incidentsThisMonth:   Number(summary?.this_month ?? 0),
        openIncidents:        Number(summary?.open_count ?? 0),
        ppeCompliancePercent: 0,
        expiringTrainings:    0,
      },
    }};
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
    const _rRows = await this.svc.getContractsExpiring(d);
    const rows = unwrapOrThrow(_rRows);
    const data = (Array.isArray(rows) ? rows : []).map(row => {
      const dl = Number(row.days_left ?? 0);
      return {
        id:             row.id,
        fullName:       String(row.full_name ?? ''),
        contractNumber: String(row.contract_number ?? ''),
        endDate:        String(row.end_date ?? ''),
        daysLeft:       dl,
        urgency:        dl <= 7 ? 'critical' : dl <= 15 ? 'warning' : 'info',
      };
    });
    return { data };
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
