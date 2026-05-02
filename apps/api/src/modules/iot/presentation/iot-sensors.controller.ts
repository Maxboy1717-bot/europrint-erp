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
import { throwFromError, unwrapOrThrow, assertOk } from '@common/http-result';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';
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

enum Role {
  OPERATOR = 'operator',
  TECHNOLOGIST = 'technologist',
  SUPER_ADMIN = 'super_admin',
}

@Throttle({ default: { limit: 100, ttl: 60_000 } })
@Controller('iot')
@UseGuards(RolesGuard)
@UseInterceptors(AuditInterceptor)
export class IotSensorsController {
  private readonly logger = new Logger(IotSensorsController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

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

  @Get('devices/:id')
  @Roles(Role.OPERATOR, Role.TECHNOLOGIST, Role.SUPER_ADMIN)
  async getDevice(@Param('id') deviceId: string) {
    this.logger.log('Get device');
    return { statusCode: HttpStatus.OK, data: { id: deviceId } };
  }

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

  @Get('anomalies')
  @Roles(Role.OPERATOR, Role.TECHNOLOGIST, Role.SUPER_ADMIN)
  async getAnomalies(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    const query = new GetAnomaliesQuery(page, limit);
    return unwrapOrThrow(await this.queryBus.execute(query));
  }

  @Get('sensors/:id/oee')
  @Roles(Role.OPERATOR, Role.TECHNOLOGIST, Role.SUPER_ADMIN)
  async getOEE(@Param('id') sensorId: string) {
    this.logger.log('Get OEE');
    return { statusCode: HttpStatus.OK, data: { oee: 85.5 } };
  }
}
