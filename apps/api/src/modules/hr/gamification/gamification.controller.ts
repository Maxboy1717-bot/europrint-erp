/**
 * @module gamification.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { Controller, UseGuards, Get, Post, Body, Param, ParseIntPipe, Query, Logger, UseInterceptors} from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';
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
@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@Controller('hr/gamification')
export class GamificationController {
  private readonly logger = new Logger(GamificationController.name);
  constructor(private readonly svc: GamificationService) {}

  @Get('leaderboard')
  async leaderboard(@Query('period') period: 'monthly' | 'quarterly' | 'all') {
    return unwrapOrInternal(await this.svc.getLeaderboard(period || 'monthly'));
  }

  @Get('my/badges')
  async getMyBadges(@Query('employeeId') employeeId?: string): Promise<unknown[]> {
    const empId = employeeId ? parseInt(employeeId) : null;
    return empId
      ? this.svc.getEmployeeBadges(empId).then(r => (r.ok && Array.isArray(r.data) ? r.data : []))
      : [];
  }

  @Get('my/points')
  getMyPoints(@Query('employeeId') employeeId?: string) {
    const empId = employeeId ? parseInt(employeeId) : null;
    return empId
      ? this.svc.getEmployeePoints(empId)
      : { totals: { total_points: 0, monthly_points: 0, quarterly_points: 0 }, history: [] as { id: number; points: number; event_type: string; description: string; created_at: string }[] };
  }

  @Get('badges/catalog')
  async badgeCatalog() {
    return unwrapOrInternal(await this.svc.getBadgeCatalog());
  }

  @Post('badges/catalog')
  async createBadgeCatalog(@Body() body: BadgeCatalogDto) {
    return unwrapOrInternal(await this.svc.createBadgeCatalogEntry(body as Parameters<typeof this.svc.createBadgeCatalogEntry>[0]));
  }

  @Get('employee/:id/points')
  async getPoints(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.svc.getEmployeePoints(id));
  }

  @Get('employee/:id/badges')
  async getBadges(@Param('id', ParseIntPipe) id: number) {
    return unwrapOrInternal(await this.svc.getEmployeeBadges(id));
  }

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

  @Post('award/badge')
  async awardBadge(@Body() body: AwardBadgeDto) {
    return unwrapOrInternal(await this.svc.awardBadge(body.employee_id, body.badge_code, body.awarded_by, body.reason));
  }
}
