/**
 * @module analytics-extended.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { Controller, Get, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/constants/roles.constants';
import { unwrapOrInternal } from '@common/http-result';
import { AnalyticsExtendedService } from './analytics-extended.service';

@ApiTags('Analytics — Extended')
@ApiBearerAuth()
@ApiThrottle()
@Controller('analytics')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
export class AnalyticsExtendedController {
  constructor(private readonly svc: AnalyticsExtendedService) {}

  @Get('engagement/active-users')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER, Role.MANAGER)
  @ApiOperation({ summary: 'DAU/WAU/MAU active users' })
  async getActiveUsers() { return unwrapOrInternal(await this.svc.getActiveUsers()); }

  @Get('engagement/activity-trend')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER, Role.MANAGER)
  @ApiOperation({ summary: 'Activity trend last 30 days' })
  async getActivityTrend() { return unwrapOrInternal(await this.svc.getActivityTrend()); }

  @Get('engagement/retention')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER, Role.MANAGER)
  @ApiOperation({ summary: 'Day-1/7/30 retention rates' })
  async getRetention() { return unwrapOrInternal(await this.svc.getRetention()); }

  @Get('engagement/sessions')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER, Role.MANAGER)
  @ApiOperation({ summary: 'Session statistics' })
  async getSessionStats() { return unwrapOrInternal(await this.svc.getSessionStats()); }

  @Get('assessment/difficulty')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER, Role.MANAGER)
  @ApiOperation({ summary: 'Difficulty analysis per test' })
  async getDifficultyAnalysis() { return unwrapOrInternal(await this.svc.getDifficultyAnalysis()); }

  @Get('assessment/discrimination')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER, Role.MANAGER)
  @ApiOperation({ summary: 'Discrimination index analysis' })
  async getDiscriminationData() { return unwrapOrInternal(await this.svc.getDiscriminationData()); }

  @Get('assessment/reliability')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER, Role.MANAGER)
  @ApiOperation({ summary: "Cronbach's Alpha reliability" })
  async getReliabilityData() { return unwrapOrInternal(await this.svc.getReliabilityData()); }

  @Get('assessment/item-analysis')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER, Role.MANAGER)
  @ApiOperation({ summary: 'Item-level difficulty and facility' })
  async getItemAnalysis() { return unwrapOrInternal(await this.svc.getItemAnalysis()); }

  @Get('mentorships-stats')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER, Role.MANAGER)
  @ApiOperation({ summary: 'Mentorship program statistics' })
  async getMentorshipsStats() { return unwrapOrInternal(await this.svc.getMentorshipsStats()); }

  @Get('events-stats')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER, Role.MANAGER)
  @ApiOperation({ summary: 'Events statistics' })
  async getEventsStats() { return unwrapOrInternal(await this.svc.getEventsStats()); }

  @Get('applications-stats')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER, Role.MANAGER)
  @ApiOperation({ summary: 'Applications and responses statistics' })
  async getApplicationsStats() { return unwrapOrInternal(await this.svc.getApplicationsStats()); }

  @Get('surveys-stats')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER, Role.MANAGER)
  @ApiOperation({ summary: 'Surveys statistics' })
  async getSurveysStats() { return unwrapOrInternal(await this.svc.getSurveysStats()); }

  @Get('broadcasts-stats')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER, Role.MANAGER)
  @ApiOperation({ summary: 'Broadcasts delivery statistics' })
  async getBroadcastsStats() { return unwrapOrInternal(await this.svc.getBroadcastsStats()); }

  @Get('skills-stats')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER, Role.MANAGER)
  @ApiOperation({ summary: 'Skills registry statistics' })
  async getSkillsStats() { return unwrapOrInternal(await this.svc.getSkillsStats()); }

  @Get('employee-stats')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER, Role.MANAGER)
  @ApiOperation({ summary: 'Employee movement statistics' })
  async getEmployeeStats() { return unwrapOrInternal(await this.svc.getEmployeeStats()); }

  @Get('ai-general-analysis')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER, Role.MANAGER)
  @ApiOperation({ summary: 'AI-generated general analysis text' })
  async getAiGeneralAnalysis() { return unwrapOrInternal(await this.svc.getAiGeneralAnalysis()); }

  @Get('score-distribution')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER, Role.MANAGER)
  @ApiOperation({ summary: 'Score distribution histogram' })
  async getScoreDistribution() { return unwrapOrInternal(await this.svc.getScoreDistribution()); }

  @Get('skills-matrix')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER, Role.MANAGER)
  @ApiOperation({ summary: 'Skills radar matrix by department' })
  async getSkillsMatrix() { return unwrapOrInternal(await this.svc.getSkillsMatrix()); }
}
