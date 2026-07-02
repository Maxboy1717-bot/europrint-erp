/**
 * @module iot-sensors.controller
 * @description NestJS controller. HTTP route handlers; delegates to services and returns unwrapped Result data.
 */

import {
  Body,
  Controller,
  Get,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiThrottle } from '@common/decorators/throttle-profiles';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { AuditInterceptor } from '@common/interceptors/audit.interceptor';
import { RecordSensorReadingCommand } from '../application/commands/record-sensor-reading.command';
import { RegisterDeviceCommand } from '../application/commands/register-device.command';
import { UpdateDeviceThresholdsCommand } from '../application/commands/update-device-thresholds.command';
import { GetDevicesQuery } from '../application/queries/get-devices.query';
import { GetReadingsQuery } from '../application/queries/get-readings.query';
import { GetAnomaliesQuery } from '../application/queries/get-anomalies.query';
import { RegisterDeviceDtoSchema, RecordReadingDtoSchema, UpdateThresholdsDtoSchema } from '../presentation/dto/iot.dto';
import { db } from '@shared/db';
import { sql, eq } from 'drizzle-orm';
// NOTE: iot_devices has no barrel export in @shared/db (schema-compat-* index) —
// it exists only as a local pgTable definition in schema-db-only-generated.ts.
// Imported directly from that file (same pattern used in iot-main.controller.ts).
import { iotDevices } from '@shared/db/schema-db-only-generated';

enum Role {
  OPERATOR = 'operator',
  TECHNOLOGIST = 'technologist',
  SUPER_ADMIN = 'super_admin',
}

@ApiThrottle()
@ApiTags('Iot Sensors')
@Controller('iot')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
export class IotSensorsController {
  private readonly logger = new Logger(IotSensorsController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @ApiOperation({ summary: 'Get devices' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('devices')
  @Roles(Role.OPERATOR, Role.TECHNOLOGIST, Role.SUPER_ADMIN)
  async getDevices(
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    const query = new GetDevicesQuery(status, type, page, limit);
    return unwrapOrThrow(await this.queryBus.execute(query));
  }

  @ApiOperation({ summary: 'Get device' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('devices/:id')
  @Roles(Role.OPERATOR, Role.TECHNOLOGIST, Role.SUPER_ADMIN)
  async getDevice(@Param('id') deviceId: string) {
    this.logger.log('Get device');
    const rows = await db.select().from(iotDevices).where(eq(iotDevices.id, parseInt(deviceId, 10))).limit(1);
    if (!rows[0]) throw new NotFoundException(`Device #${deviceId} topilmadi`);
    return { statusCode: HttpStatus.OK, data: rows[0] };
  }

  @ApiOperation({ summary: 'Register device' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('devices')
  @Roles(Role.SUPER_ADMIN)
  async registerDevice(@Body() dto: Record<string, unknown>) {
    const validated = RegisterDeviceDtoSchema.parse(dto);
    const cmd = new RegisterDeviceCommand(
      validated.deviceCode,
      validated.name,
      validated.location,
      validated.type,
      { ...validated.thresholds, unit: validated.thresholds?.unit ?? 'unit' },
    );
    const result = await this.commandBus.execute(cmd);
    this.logger.log('Device registered');
    assertOk(result);
    return result.data;
  }

  @ApiOperation({ summary: 'Update thresholds' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Patch('devices/:id/thresholds')
  @Roles(Role.SUPER_ADMIN)
  async updateThresholds(@Param('id') deviceId: string, @Body() dto: Record<string, unknown>) {
    const validated = UpdateThresholdsDtoSchema.parse(dto);
    const cmd = new UpdateDeviceThresholdsCommand(deviceId, { ...validated.thresholds, unit: validated.thresholds?.unit ?? 'unit' });
    const result = await this.commandBus.execute(cmd);
    this.logger.log('Thresholds updated');
    assertOk(result);
    return result.data;
  }

  @ApiOperation({ summary: 'Record reading' })
  @ApiResponse({ status: 201, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Post('devices/:id/readings')
  @Roles(Role.OPERATOR, Role.TECHNOLOGIST, Role.SUPER_ADMIN)
  async recordReading(@Param('id') deviceId: string, @Body() dto: Record<string, unknown>) {
    const validated = RecordReadingDtoSchema.parse(dto);
    const cmd = new RecordSensorReadingCommand(deviceId, deviceId, validated.value, validated.unit);
    const result = await this.commandBus.execute(cmd);
    this.logger.log('Sensor reading recorded');
    assertOk(result);
    return result.data;
  }

  @ApiOperation({ summary: 'Get readings' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('devices/:id/readings')
  @Roles(Role.OPERATOR, Role.TECHNOLOGIST, Role.SUPER_ADMIN)
  async getReadings(
    @Param('id') deviceId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit: number = 100,
  ) {
    const query = new GetReadingsQuery(
      deviceId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
      limit,
    );
    return unwrapOrThrow(await this.queryBus.execute(query));
  }

  @ApiOperation({ summary: 'Get anomalies' })
  @ApiResponse({ status: 200, description: 'OK' })
  @Get('anomalies')
  @Roles(Role.OPERATOR, Role.TECHNOLOGIST, Role.SUPER_ADMIN)
  async getAnomalies(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    const query = new GetAnomaliesQuery(page, limit);
    return unwrapOrThrow(await this.queryBus.execute(query));
  }

  @ApiOperation({ summary: 'Get o e e' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get('sensors/:id/oee')
  @Roles(Role.OPERATOR, Role.TECHNOLOGIST, Role.SUPER_ADMIN)
  async getOEE(@Param('id') sensorId: string) {
    this.logger.log('Get OEE');
    const machineId = parseInt(sensorId, 10);

    // 1. Try oee_records first (persisted historical OEE)
    const r = await db.execute(sql`
      SELECT availability, performance, quality, oee, date, shift_number
      FROM oee_records WHERE machine_id=${machineId}
      ORDER BY date DESC, shift_number DESC LIMIT 1
    `);
    const row = ((r as unknown as { rows: unknown[] }).rows ?? [])[0] as Record<string, unknown> | undefined;
    if (row) {
      return { statusCode: HttpStatus.OK, data: row };
    }

    // 2. Fallback: aggregate from production_sessions (real live data)
    const ps = await db.execute(sql`
      SELECT AVG(availability)::numeric(6,2) AS availability,
             AVG(performance)::numeric(6,2)  AS performance,
             AVG(quality)::numeric(6,2)      AS quality,
             AVG(oee)::numeric(6,2)          AS oee,
             COUNT(*)::int                   AS sample_size
      FROM production_sessions
      WHERE machine_id=${machineId}
        AND deleted_at IS NULL
        AND availability IS NOT NULL
    `);
    const psRow = ((ps as unknown as { rows: unknown[] }).rows ?? [])[0] as Record<string, unknown> | undefined;
    if (psRow && psRow['sample_size'] && Number(psRow['sample_size']) > 0) {
      return { statusCode: HttpStatus.OK, data: { ...psRow, source: 'production_sessions' } };
    }

    // 3. No data at all — 404 instead of fake zeros
    throw new NotFoundException(`Sensor #${sensorId} uchun OEE ma'lumoti topilmadi`);
  }
}
