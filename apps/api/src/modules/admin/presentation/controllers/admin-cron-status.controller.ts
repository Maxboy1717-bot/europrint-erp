/**
 * @module admin-cron-status.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Controller, Get, Logger, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiThrottle } from '@common/decorators/throttle-profiles';

import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '../../infrastructure/guards/roles.guard';
import { Roles } from '../../infrastructure/decorators/roles.decorator';
import { AuditInterceptor } from '../../infrastructure/interceptors/audit.interceptor';
import { UserRole } from '../../domain/aggregates/user.aggregate';
import { CronStatusService } from '@/cron/cron-status.service';

@ApiThrottle()
@Controller('admin/cron-status')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@ApiBearerAuth()
@ApiTags('Admin - Cron Status')
export class AdminCronStatusController {
  private readonly logger = new Logger(AdminCronStatusController.name);

  constructor(private readonly cronStatusService: CronStatusService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.DIRECTOR)
  @ApiOperation({ summary: 'Barcha cron job holati va statistikasi' })
  @ApiResponse({ status: 200, description: 'OK' })
  getCronStatus() {
    const jobs    = this.cronStatusService.getAllStatuses();
    const summary = this.cronStatusService.getSummary();
    return {
      summary,
      jobs: (Array.isArray(jobs) ? jobs : []).map(j => ({
        name:         j.name,
        description:  j.description,
        schedule:     j.schedule,
        lastRanAt:    j.lastRanAt,
        nextRunAt:    j.nextRunAt,
        successCount: j.successCount,
        failureCount: j.failureCount,
        lastResult:   j.lastResult,
        lastError:    j.lastError,
      })),
      generatedAt: _time.now().toISOString(),
    };
  }
}
