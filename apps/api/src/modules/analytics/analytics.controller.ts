import { Controller, Get, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@common/guards/roles.guard';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/constants/roles.constants';
import { unwrapOrInternal } from '@common/http-result';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@ApiBearerAuth()
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('analytics')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
export class AnalyticsController {
  constructor(private readonly svc: AnalyticsService) {}

  @Get('stats')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER, Role.MANAGER)
  @ApiOperation({ summary: 'Overall analytics stats' })
  async getStats() { return unwrapOrInternal(await this.svc.getStats()); }

  @Get('course-progress')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER, Role.MANAGER)
  @ApiOperation({ summary: 'Course progress per course' })
  async getCourseProgress() { return unwrapOrInternal(await this.svc.getCourseProgress()); }

  @Get('user-activity')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER, Role.MANAGER)
  @ApiOperation({ summary: 'User activity last 30 days' })
  async getUserActivity() { return unwrapOrInternal(await this.svc.getUserActivity()); }

  @Get('test-results')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER, Role.MANAGER)
  @ApiOperation({ summary: 'Test results summary' })
  async getTestResults() { return unwrapOrInternal(await this.svc.getTestResults()); }

  @Get('learning-outcomes')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER, Role.MANAGER)
  @ApiOperation({ summary: 'Learning outcomes KPIs' })
  async getLearningOutcomes() { return unwrapOrInternal(await this.svc.getLearningOutcomes()); }

  @Get('funnel')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER, Role.MANAGER)
  @ApiOperation({ summary: 'Learning funnel' })
  async getFunnel() { return unwrapOrInternal(await this.svc.getFunnel()); }

  @Get('by-department')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER, Role.MANAGER)
  @ApiOperation({ summary: 'Analytics by department' })
  async getByDepartment() { return unwrapOrInternal(await this.svc.getByDepartment()); }

  @Get('by-position')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER, Role.MANAGER)
  @ApiOperation({ summary: 'Analytics by position' })
  async getByPosition() { return unwrapOrInternal(await this.svc.getByPosition()); }

  @Get('leaderboard/employees')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER, Role.MANAGER)
  @ApiOperation({ summary: 'Employee leaderboard' })
  async getLeaderboardEmployees() { return unwrapOrInternal(await this.svc.getLeaderboardEmployees()); }

  @Get('leaderboard/departments')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER, Role.MANAGER)
  @ApiOperation({ summary: 'Department leaderboard' })
  async getLeaderboardDepartments() { return unwrapOrInternal(await this.svc.getLeaderboardDepartments()); }

  @Get('leaderboard/courses')
  @Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER, Role.MANAGER)
  @ApiOperation({ summary: 'Course leaderboard by effectiveness' })
  async getLeaderboardCourses() { return unwrapOrInternal(await this.svc.getLeaderboardCourses()); }
}
