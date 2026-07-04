/**
 * @module sd-dashboard.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import { safeInt } from '../../hr/common/db-rows';
import {
  Controller,
  UseGuards,
  Get,
  Logger,
  Query,
  UseInterceptors,
  InternalServerErrorException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { throwFromError, unwrapOrThrow } from '@common/http-result';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { Roles } from '@shared/decorators/roles.decorator';
import { SdDashboardService } from '../application/sd-dashboard.service';

@Roles('admin', 'manager', 'supervisor', 'operator', 'director')
@ApiThrottle()
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard)
@ApiTags('Sd Dashboard')
@ApiBearerAuth()
@Controller('sd/dashboard')
export class SdDashboardController {
  private readonly logger = new Logger(SdDashboardController.name);

  constructor(private readonly svc: SdDashboardService) {}

  @ApiOperation({ summary: 'Get overview' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('overview')
  async getOverview(@Query('period') _period?: string) {
    return unwrapOrThrow(await this.svc.getOverview());
  }

  @ApiOperation({ summary: 'Get manager actions' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('manager-actions')
  async getManagerActions(@Query('managerId') managerId?: string, @Query('limit') limit?: string) {
    return unwrapOrThrow(await this.svc.getManagerActions(managerId ? safeInt(managerId, 0) : null, safeInt(limit, 20)));
  }

  @ApiOperation({ summary: 'Get quota stats' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('quota')
  async getQuotaStats(@Query('managerId') managerId?: string, @Query('period') _period?: string) {
    return unwrapOrThrow(await this.svc.getQuotaStats(managerId ? safeInt(managerId, 0) : null));
  }

  @ApiOperation({ summary: 'Get manager KPI leaderboard' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('leaderboard')
  async getLeaderboard(@Query('period') period?: string, @Query('limit') limit?: string) {
    return unwrapOrThrow(await this.svc.getLeaderboard(period ?? null, safeInt(limit, 20)));
  }
}
