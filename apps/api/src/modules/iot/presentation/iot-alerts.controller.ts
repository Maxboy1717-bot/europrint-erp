/**
 * @module iot-alerts.controller
 * @description NestJS controller for IoT alert endpoints (GET, acknowledge, create).
 *              Extracted from iot-main.controller as part of Rule 13/16 split.
 */

import { Body, Controller, Get, HttpException, HttpStatus, Param, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { unwrapOrThrow } from '@common/http-result';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { z } from 'zod';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { IotMainService } from '../application/iot-main.service';
import { CameraAlertsQuerySchema } from './dto/iot-camera.dto';

const CreateAlertSchema = z.object({
  type:     z.string().max(100).optional(),
  severity: z.string().max(50).optional(),
  message:  z.string().max(2000).optional(),
  source:   z.string().max(200).optional(),
}).passthrough();

const IOT_READ = ['super_admin', 'director', 'production_manager', 'technologist'];
const IOT_WRITE = ['super_admin', 'director', 'production_manager'];

@ApiThrottle()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Iot Alerts')
@ApiBearerAuth()
@Controller('iot')
export class IotAlertsController {
  constructor(private readonly svc: IotMainService) {}

  @ApiOperation({ summary: 'Get alerts' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('alerts') @Roles(...IOT_READ)
  async getAlerts(@Query() raw: Record<string, unknown>) {
    const q = CameraAlertsQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getAlerts(q.status, q.severity, q.limit));
  }

  @ApiOperation({ summary: 'Acknowledge alert' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('alerts/:id/acknowledge') @Roles(...IOT_WRITE) @UseInterceptors(AuditInterceptor)
  async acknowledgeAlert(@Param('id') id: string) { return unwrapOrThrow(await this.svc.acknowledgeAlert(id)); }

  @ApiOperation({ summary: 'Get safety violations' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('safety-violations')
  @Roles(...IOT_READ)
  async getSafetyViolations(@Query() raw: Record<string, unknown>) {
    const q = CameraAlertsQuerySchema.parse(raw);
    return unwrapOrThrow(await this.svc.getSafetyViolations(q.status, q.severity, q.limit));
  }

  @ApiOperation({ summary: 'Create alert (INSERT iot_alerts)' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('alerts') @Roles(...IOT_WRITE)
  @UseInterceptors(AuditInterceptor)
  async createAlert(@Body() body: unknown) {
    const dto = CreateAlertSchema.parse(body);
    const r = await db.execute(sql`
      INSERT INTO iot_alerts (sensor_id, alert_type, severity, message, is_resolved, created_at)
      VALUES (0, ${dto.type ?? 'manual'}, ${dto.severity ?? 'medium'}, ${dto.message ?? ''}, false, NOW())
      RETURNING *
    `);
    const row = ((r as { rows?: unknown[] }).rows ?? [])[0] ?? {};
    return { data: row };
  }

  @ApiOperation({ summary: 'Patch acknowledge alert' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('alerts/:id/acknowledge') @Roles(...IOT_WRITE)
  @UseInterceptors(AuditInterceptor)
  async patchAcknowledgeAlert(@Param('id') id: string) { return unwrapOrThrow(await this.svc.acknowledgeAlert(id)); }
}
