/**
 * @module integration-extended-hr.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Controller, Get, Param, Query,
  UseGuards, UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { IntegrationExtendedHrRepository } from './integration-extended-hr.repo';
import { IntegrationExtendedMroRepository } from './integration-extended-mro.repo';

const HR_ROLES      = ['admin', 'super_admin', 'hr_manager', 'manager', 'director'] as const;
const VENDOR_ROLES  = ['admin', 'super_admin', 'manager', 'director', 'accountant', 'finance'] as const;
const SKILLS_ROLES  = ['admin', 'super_admin', 'hr_manager', 'manager', 'director', 'employee'] as const;

@ApiThrottle()
@ApiTags('Integration Extended Hr')
@ApiBearerAuth()
@Controller('integration')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class IntegrationExtendedHrController {
  constructor(
    private readonly repo: IntegrationExtendedHrRepository,
    private readonly mroRepo: IntegrationExtendedMroRepository,
  ) {}

  @ApiOperation({ summary: 'Get position skills' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('hr-lms/position-skills')
  @Roles(...SKILLS_ROLES)
  async getPositionSkills() {
    const r = await this.repo.findHrLmsPositionSkills();
    return r.ok ? r.data : [];
  }

  @ApiOperation({ summary: 'Get employee skills' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('hr-lms/employee-skills')
  @Roles(...SKILLS_ROLES)
  async getEmployeeSkills() {
    const r = await this.repo.findHrLmsEmployeeSkills();
    return r.ok ? r.data : [];
  }

  @ApiOperation({ summary: 'Get expiring certifications' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('hr-lms/expiring-certifications')
  @Roles(...HR_ROLES)
  async getExpiringCertifications() {
    const r = await this.repo.findHrLmsExpiringCertifications();
    return r.ok ? r.data : [];
  }

  @ApiOperation({ summary: 'Get hr lms stats' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('hr-lms/stats')
  @Roles(...HR_ROLES)
  async getHrLmsStats() {
    const r = await this.repo.getHrLmsStats();
    return r.ok ? r.data : {};
  }

  @ApiOperation({ summary: 'Get employee ratings by period' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('employee-rating/ratings/:year/:month')
  @Roles(...HR_ROLES)
  async getEmployeeRatingsByPeriod(
    @Param('year') year: string,
    @Param('month') month: string,
  ) {
    const r = await this.repo.findEmployeeRatings(parseInt(year, 10), parseInt(month, 10));
    return r.ok ? r.data : [];
  }

  @ApiOperation({ summary: 'Get employee ratings' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('employee-rating/ratings')
  @Roles(...HR_ROLES)
  async getEmployeeRatings(
    @Query('periodYear') periodYear?: string,
    @Query('periodMonth') periodMonth?: string,
  ) {
    const r = await this.repo.findEmployeeRatings(
      periodYear ? parseInt(periodYear, 10) : undefined,
      periodMonth ? parseInt(periodMonth, 10) : undefined,
    );
    // P1.13.1: wrap in { ratings, total } + map snake_case DB cols → camelCase FE fields
    const rows = (r.ok && Array.isArray(r.data) ? r.data : []) as Record<string, unknown>[];
    const ratings = rows.map((row) => ({
      id:               row['id'],
      productivityScore: Number(row['performance_rating'] ?? row['productivity_score']  ?? 0),
      disciplineScore:   Number(row['behavior_rating']    ?? row['discipline_score']    ?? 0),
      qualityScore:      Number(row['quality_score']      ?? row['performance_rating']  ?? 0),
      skillsScore:       Number(row['skills_rating']      ?? row['skills_score']        ?? 0),
      compositeScore:    Number(row['overall_rating']     ?? row['composite_score']     ?? 0),
      trend:             String(row['trend'] ?? 'stable'),
      ratingYear:        row['rating_year']  ?? row['period_year'],
      ratingMonth:       row['rating_month'] ?? row['period_month'],
      status:            row['status'],
      employee: row['employee_name']
        ? { fullName: String(row['employee_name']) }
        : null,
    }));
    return { ratings, total: ratings.length };
  }

  @ApiOperation({ summary: 'Get employee rating goals' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('employee-rating/goals')
  @Roles(...HR_ROLES)
  async getEmployeeRatingGoals() {
    const r = await this.repo.findEmployeeRatingGoals();
    // P1.13.1: map snake_case goal fields → camelCase FE fields
    const rows = (r.ok && Array.isArray(r.data) ? r.data : []) as Record<string, unknown>[];
    return rows.map((g) => ({
      id:           g['id'],
      title:        g['title']          ?? g['goal_title'],
      currentValue: Number(g['current_value'] ?? g['current_progress'] ?? 0),
      targetValue:  Number(g['target_value']  ?? g['target']           ?? 0),
      unit:         String(g['unit']    ?? ''),
      status:       String(g['status']  ?? 'active'),
      employee:     g['employee_name'] ? { fullName: String(g['employee_name']) } : null,
    }));
  }

  @ApiOperation({ summary: 'Get employee rating stats' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('employee-rating/stats')
  @Roles(...HR_ROLES)
  async getEmployeeRatingStats() {
    const r = await this.repo.getEmployeeRatingStats();
    // P1.13.1: map to FE's { avgScores: { avgComposite, avgProductivity, totalRated } }
    const raw = (r.ok && r.data ? r.data as Record<string, unknown> : {});
    return {
      avgScores: {
        avgComposite:    Number(raw['average_score']    ?? raw['avg_composite']    ?? 0),
        avgProductivity: Number(raw['average_score']    ?? raw['avg_productivity'] ?? 0),
        totalRated:      Number(raw['total_ratings']    ?? raw['total_rated']      ?? 0),
      },
    };
  }

  @ApiOperation({ summary: 'Get vendor performance' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('vendor-performance')
  @Roles(...VENDOR_ROLES)
  async getVendorPerformance() {
    const r = await this.repo.findVendorPerformance();
    return r.ok ? r.data : [];
  }

  @ApiOperation({ summary: 'Get vendor spend analysis' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('vendor-performance/spend-analysis')
  @Roles(...VENDOR_ROLES)
  async getVendorSpendAnalysis() {
    const r = await this.repo.findVendorSpendAnalysis();
    return r.ok ? r.data : [];
  }

  @ApiOperation({ summary: 'Get pm upcoming alias' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('pm-upcoming')
  @Roles('admin', 'super_admin', 'manager', 'director', 'warehouse', 'warehouse_manager')
  async getPmUpcomingAlias() {
    const r = await this.mroRepo.findPmUpcoming();
    return r.ok ? r.data : [];
  }
}

@ApiThrottle()
@Controller('integration/mro')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class IntegrationMroPmController {
  constructor(private readonly repo: IntegrationExtendedMroRepository) {}

  @ApiOperation({ summary: 'Get pm upcoming' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('pm-upcoming')
  @Roles('admin', 'super_admin', 'manager', 'director', 'warehouse', 'warehouse_manager')
  async getPmUpcoming() {
    const r = await this.repo.findPmUpcoming();
    return r.ok ? r.data : [];
  }
}
