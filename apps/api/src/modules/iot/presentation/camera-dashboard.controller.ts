import {
  Controller, Get, InternalServerErrorException,
  Query, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { throwFromError, unwrapOrThrow } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
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

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Controller('camera-dashboard')
export class CameraDashboardController {
  constructor(private readonly svc: CameraDashboardService) {}

  @Get('stats')
  @Roles(...CAM_READ)
  async getStats() {
    return unwrapOrThrow(await this.svc.getStats());
  }

  @Get('pending-alerts')
  @Roles(...CAM_READ)
  async getPendingAlerts(@Query() raw: Record<string, unknown>) {
    const q = PendingAlertsQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getPendingAlerts(q.limit));
  }

  @Get('recent-events')
  @Roles(...CAM_READ)
  async getRecentEvents(@Query() raw: Record<string, unknown>) {
    const q = DashboardEventQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getRecentEvents(q.limit, q.type));
  }

  @Get('top-employees')
  @Roles(...CAM_READ)
  async getTopEmployees(@Query() raw: Record<string, unknown>) {
    const q = TopEmployeesQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getTopEmployees(q.limit, q.metric));
  }

  @Get('quality-stats')
  @Roles(...CAM_READ)
  async getQualityStats() {
    return unwrapOrThrow(await this.svc.getQualityStats());
  }

  @Get('attendance-stats')
  @Roles(...CAM_READ)
  async getAttendanceStats() {
    return unwrapOrThrow(await this.svc.getAttendanceStats());
  }

  @Get('production-stats')
  @Roles(...CAM_READ)
  async getProductionStats() {
    return unwrapOrThrow(await this.svc.getProductionStats());
  }

  @Get('safety-stats')
  @Roles(...CAM_READ)
  async getSafetyStats() {
    return unwrapOrThrow(await this.svc.getSafetyStats());
  }

  @Get('weekly-trend')
  @Roles(...CAM_READ)
  async getWeeklyTrend() {
    return unwrapOrThrow(await this.svc.getWeeklyTrend());
  }
}
