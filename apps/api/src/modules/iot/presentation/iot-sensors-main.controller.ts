/**
 * @module iot-sensors-main.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Controller, Get, HttpCode, HttpException, HttpStatus, Patch, Post, Body, InternalServerErrorException,
  Param, Query, UseGuards, UseInterceptors,
} from '@nestjs/common';

import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { throwFromError, unwrapOrThrow } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { z } from 'zod';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';

const ResolveAlertSchema = z.object({
  notes: z.string().max(2000).optional(),
  resolution: z.string().max(2000).optional(),
}).passthrough();

const CreateSensorSchema = z.object({
  name: z.string().max(200).optional(),
  type: z.string().max(100).optional(),
  location: z.string().max(500).optional(),
  status: z.string().max(50).optional(),
}).passthrough();
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { IotSensorsExtendedService } from '../application/iot-sensors-extended.service';
import { notImplemented } from '@common/exceptions/not-implemented';
import {
  OeeQuerySchema,
  SensorHistoryQuerySchema,
  SensorListQuerySchema,
  SensorLiveQuerySchema,
  SensorSeverityQuerySchema,
  SensorTrendsQuerySchema,
} from './dto/iot-camera.dto';

const IOT_READ = ['super_admin', 'director', 'production_manager', 'ERP_MANAGER', 'admin', 'technologist'];

@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@ApiTags('Iot Sensors Main')
@ApiBearerAuth()
@Controller('iot-sensors')
export class IotSensorsMainController {
  constructor(private readonly svc: IotSensorsExtendedService) {}

  @ApiOperation({ summary: 'Get dashboard' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('dashboard')
  @Roles(...IOT_READ)
  async getDashboard() {
    return unwrapOrThrow(await this.svc.getDashboard());
  }

  @ApiOperation({ summary: 'Get live' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('live')
  @Roles(...IOT_READ)
  async getLive(@Query() raw: Record<string, unknown>) {
    const q = SensorLiveQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getLiveReadings(q.type, q.location, q.limit));
  }

  @ApiOperation({ summary: 'Get alerts' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('alerts')
  @Roles(...IOT_READ)
  async getAlerts(@Query() raw: Record<string, unknown>) {
    const q = SensorSeverityQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getAlerts(q.severity, q.limit));
  }

  @ApiOperation({ summary: 'Get oee' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('oee')
  @Roles(...IOT_READ)
  async getOee(@Query() raw: Record<string, unknown>) {
    const q = OeeQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getOee(q.device_id, q.period));
  }

  @ApiOperation({ summary: 'List sensors' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get()
  @Roles(...IOT_READ)
  async listSensors(@Query() raw: Record<string, unknown>) {
    const q = SensorListQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.listSensors(q.type, q.status, q.page, q.limit));
  }

  @ApiOperation({ summary: 'Get trends' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('trends')
  @Roles(...IOT_READ)
  async getTrends(@Query() raw: Record<string, unknown>) {
    const q = SensorTrendsQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getSensorTrends(q.type, q.period));
  }

  @ApiOperation({ summary: 'Get sensor history' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get(':id/history')
  @Roles(...IOT_READ)
  async getSensorHistory(
    @Param('id') id: string,
    @Query() raw: Record<string, unknown>,
  ) {
    const q = SensorHistoryQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getSensorHistory(id, q.from, q.to, q.limit));
  }

  @ApiOperation({ summary: 'Get predictive maintenance schedule (equipment_maintenance)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('predictive-maintenance')
  @Roles(...IOT_READ)
  async getPredictiveMaintenance() {
    const r = await db.execute(sql`
      SELECT * FROM equipment_maintenance
      WHERE status IS DISTINCT FROM 'completed'
      ORDER BY next_maintenance_date ASC NULLS LAST
      LIMIT 100
    `);
    const items = ((r as { rows?: unknown[] }).rows) ?? [];
    return { items, total: items.length };
  }

  @ApiOperation({ summary: 'Resolve alert (UPDATE iot_alerts)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Patch('alerts/:alertId/resolve')
  async resolveAlert(@Param('alertId') alertId: string, @Body() body: unknown) {
    ResolveAlertSchema.parse(body ?? {});
    await db.execute(sql`
      UPDATE iot_alerts SET is_resolved=true, resolved_at=NOW()
      WHERE id=${parseInt(alertId, 10)}
    `);
    return { id: parseInt(alertId, 10), resolved: true };
  }

  @ApiOperation({ summary: 'Create sensor' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(...IOT_READ)
  async createSensor(@Body() body: unknown) {
    const dto = CreateSensorSchema.parse(body);
    return unwrapOrThrow(await this.svc.createSensor(dto));
  }

  @ApiOperation({ summary: 'Post resolve alert' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('alerts/:alertId/resolve')
  @HttpCode(HttpStatus.OK)
  @Roles(...IOT_READ)
  async postResolveAlert(@Param('alertId') alertId: string, @Body() body: unknown) {
    ResolveAlertSchema.parse(body ?? {});
    const id = parseInt(alertId, 10);
    if (!Number.isFinite(id)) throw new HttpException('alertId must be numeric', HttpStatus.BAD_REQUEST);
    await db.execute(sql`
      UPDATE iot_alerts
         SET is_resolved = TRUE, resolved_at = COALESCE(resolved_at, NOW())
       WHERE id = ${id}
    `);
    return { id, resolved: true };
  }
}
