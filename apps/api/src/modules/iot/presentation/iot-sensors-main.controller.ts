import {
  Controller, Get, Patch, Body, InternalServerErrorException,
  Param, Query, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { throwFromError, unwrapOrThrow } from '@common/http-result';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { IotSensorsExtendedService } from '../application/iot-sensors-extended.service';
import {
  OeeQuerySchema,
  SensorHistoryQuerySchema,
  SensorListQuerySchema,
  SensorLiveQuerySchema,
  SensorSeverityQuerySchema,
  SensorTrendsQuerySchema,
} from './dto/iot-camera.dto';

const IOT_READ = ['super_admin', 'director', 'production_manager', 'ERP_MANAGER', 'admin', 'technologist'];

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Controller('iot-sensors')
export class IotSensorsMainController {
  constructor(private readonly svc: IotSensorsExtendedService) {}

  @Get('dashboard')
  @Roles(...IOT_READ)
  async getDashboard() {
    return unwrapOrThrow(await this.svc.getDashboard());
  }

  @Get('live')
  @Roles(...IOT_READ)
  async getLive(@Query() raw: Record<string, unknown>) {
    const q = SensorLiveQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getLiveReadings(q.type, q.location, q.limit));
  }

  @Get('alerts')
  @Roles(...IOT_READ)
  async getAlerts(@Query() raw: Record<string, unknown>) {
    const q = SensorSeverityQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getAlerts(q.severity, q.limit));
  }

  @Get('oee')
  @Roles(...IOT_READ)
  async getOee(@Query() raw: Record<string, unknown>) {
    const q = OeeQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getOee(q.device_id, q.period));
  }

  @Get()
  @Roles(...IOT_READ)
  async listSensors(@Query() raw: Record<string, unknown>) {
    const q = SensorListQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.listSensors(q.type, q.status, q.page, q.limit));
  }

  @Get('trends')
  @Roles(...IOT_READ)
  async getTrends(@Query() raw: Record<string, unknown>) {
    const q = SensorTrendsQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getSensorTrends(q.type, q.period));
  }

  @Get(':id/history')
  @Roles(...IOT_READ)
  async getSensorHistory(
    @Param('id') id: string,
    @Query() raw: Record<string, unknown>,
  ) {
    const q = SensorHistoryQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getSensorHistory(id, q.from, q.to, q.limit));
  }

  @Get('predictive-maintenance')
  async getPredictiveMaintenance() { return { data: [], alerts: [] }; }

  @Patch('alerts/:alertId/resolve')
  async resolveAlert(@Param('alertId') alertId: string, @Body() body: Record<string, unknown>) { return { alertId, resolved: true }; }
}
