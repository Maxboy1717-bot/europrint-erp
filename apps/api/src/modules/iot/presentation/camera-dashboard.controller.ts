/**
 * @module camera-dashboard.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Controller, Get, InternalServerErrorException,
  Query, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { throwFromError, unwrapOrThrow } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { CameraDashboardService } from '../application/camera-dashboard.service';
import {
  DashboardEventQuerySchema,
  PendingAlertsQuerySchema,
  TopEmployeesQuerySchema,
} from './dto/iot-camera.dto';

const CAM_READ = ['super_admin', 'director', 'security_manager', 'production_manager', 'ERP_MANAGER', 'admin'];

@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@ApiTags('Camera Dashboard')
@ApiBearerAuth()
@Controller('camera-dashboard')
export class CameraDashboardController {
  constructor(private readonly svc: CameraDashboardService) {}

  @ApiOperation({ summary: 'Get stats' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('stats')
  @Roles(...CAM_READ)
  async getStats() {
    return unwrapOrThrow(await this.svc.getStats());
  }

  @ApiOperation({ summary: 'Get pending alerts' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('pending-alerts')
  @Roles(...CAM_READ)
  async getPendingAlerts(@Query() raw: Record<string, unknown>) {
    const q = PendingAlertsQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getPendingAlerts(q.limit));
  }

  @ApiOperation({ summary: 'Get recent events' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('recent-events')
  @Roles(...CAM_READ)
  async getRecentEvents(@Query() raw: Record<string, unknown>) {
    const q = DashboardEventQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getRecentEvents(q.limit, q.type));
  }

  @ApiOperation({ summary: 'Get top employees' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('top-employees')
  @Roles(...CAM_READ)
  async getTopEmployees(@Query() raw: Record<string, unknown>) {
    const q = TopEmployeesQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getTopEmployees(q.limit, q.metric));
  }

  @ApiOperation({ summary: 'Get quality stats' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('quality-stats')
  @Roles(...CAM_READ)
  async getQualityStats() {
    return unwrapOrThrow(await this.svc.getQualityStats());
  }

  @ApiOperation({ summary: 'Get attendance stats' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('attendance-stats')
  @Roles(...CAM_READ)
  async getAttendanceStats() {
    return unwrapOrThrow(await this.svc.getAttendanceStats());
  }

  @ApiOperation({ summary: 'Get production stats' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('production-stats')
  @Roles(...CAM_READ)
  async getProductionStats() {
    return unwrapOrThrow(await this.svc.getProductionStats());
  }

  @ApiOperation({ summary: 'Get safety stats' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('safety-stats')
  @Roles(...CAM_READ)
  async getSafetyStats() {
    return unwrapOrThrow(await this.svc.getSafetyStats());
  }

  @ApiOperation({ summary: 'Get weekly trend' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('weekly-trend')
  @Roles(...CAM_READ)
  async getWeeklyTrend() {
    return unwrapOrThrow(await this.svc.getWeeklyTrend());
  }
}
