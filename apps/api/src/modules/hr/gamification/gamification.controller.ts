/**
 * @module gamification.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Controller, UseGuards, Get, Post, Body, Param, ParseIntPipe, Query, Logger, UseInterceptors} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { GamificationService } from './gamification.service';
import { Roles } from '../../../common/decorators/roles.decorator';
import { unwrapOrInternal } from '@common/http-result';

const AwardPointsSchema = z.object({
  employee_id:  z.number().int(),
  points:       z.number(),
  event_type:   z.string().optional(),
  description:  z.string().optional(),
  reference_id: z.number().int().optional(),
});
class AwardPointsDto extends createZodDto(AwardPointsSchema) {}

const AwardBadgeSchema = z.object({
  employee_id: z.number().int(),
  badge_code:  z.string().min(1),
  awarded_by:  z.number().int().optional(),
  reason:      z.string().optional(),
});
class AwardBadgeDto extends createZodDto(AwardBadgeSchema) {}

const BadgeCatalogSchema = z.object({
  code:        z.string().min(1),
  name:        z.string().min(1),
  name_ru:     z.string().optional(),
  description: z.string().optional(),
  icon:        z.string().optional(),
  point_value: z.number().optional(),
  category:    z.string().optional(),
});
class BadgeCatalogDto extends createZodDto(BadgeCatalogSchema) {}

@Roles('admin', 'manager', 'supervisor', 'employee', 'hr_manager')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@ApiTags('Gamification')
@ApiBearerAuth()
@Controller('hr/gamification')
export class GamificationController {
  private readonly logger = new Logger(GamificationController.name);
  constructor(private readonly svc: GamificationService) {}

  @ApiOperation({ summary: 'Leaderboard' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('leaderboard')
  async leaderboard(@Query('period') period: 'monthly' | 'quarterly' | 'all') {
    return unwrapOrInternal(await this.svc.getLeaderboard(period || 'monthly'));
  }

  @ApiOperation({ summary: 'Get my badges' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('my/badges')
  async getMyBadges(@Query('employeeId') employeeId?: string): Promise<unknown[]> {
    const empId = employeeId ? parseInt(employeeId) : null;
    return empId
      ? this.svc.getEmployeeBadges(empId).then(r => (r.ok && Array.isArray(r.data) ? r.data : []))
      : [];
  }

  @ApiOperation({ summary: 'Get my points' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('my/points')
  getMyPoints(@Query('employeeId') employeeId?: string) {
    const empId = employeeId ? parseInt(employeeId) : null;
    return empId
      ? this.svc.getEmployeePoints(empId)
      : { totals: { total_points: 0, monthly_points: 0, quarterly_points: 0 }, history: [] as { id: number; points: number; event_type: string; description: string; created_at: string }[] };
  }

  @ApiOperation({ summary: 'Badge catalog' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('badges/catalog')
  async badgeCatalog() {
    return unwrapOrInternal(await this.svc.getBadgeCatalog());
  }

  @ApiOperation({ summary: 'Create badge catalog' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('badges/catalog')
  async createBadgeCatalog(@Body() body: BadgeCatalogDto) {
    return unwrapOrInternal(await this.svc.createBadgeCatalogEntry(body as Parameters<typeof this.svc.createBadgeCatalogEntry>[0]));
  }

  @ApiOperation({ summary: 'Get points' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('employee/:id/points')
  async getPoints(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.svc.getEmployeePoints(id));
  }

  @ApiOperation({ summary: 'Get badges' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('employee/:id/badges')
  async getBadges(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.svc.getEmployeeBadges(id));
  }

  @ApiOperation({ summary: 'Award points' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('award/points')
  async awardPoints(@Body() body: AwardPointsDto) {
    return unwrapOrInternal(await this.svc.awardPoints(
      body.employee_id,
      body.points,
      body.event_type || 'manual',
      body.description ?? '',
      body.reference_id,
    ));
  }

  @ApiOperation({ summary: 'Award badge' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('award/badge')
  async awardBadge(@Body() body: AwardBadgeDto) {
    return unwrapOrInternal(await this.svc.awardBadge(body.employee_id, body.badge_code, body.awarded_by, body.reason));
  }
}
