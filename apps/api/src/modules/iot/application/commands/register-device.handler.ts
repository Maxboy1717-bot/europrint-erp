import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { AppErr, Err, Ok, Result } from '@common/result';
import { SensorDevice } from '../../domain/aggregates/sensor-device.aggregate';
import { SensorType } from '../../domain/enums/sensor-status.enum';
import { ISensorRepo, SENSOR_REPO } from '../../domain/repositories/i-sensor.repo';
import { RegisterDeviceCommand } from './register-device.command';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';

type Row = Record<string, unknown>;
const exec = async (q: Parameters<typeof db.execute>[0]): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

@Injectable()
@CommandHandler(RegisterDeviceCommand)
export class RegisterDeviceHandler implements ICommandHandler<RegisterDeviceCommand> {
  private readonly logger = new Logger(RegisterDeviceHandler.name);

  constructor(@Inject(SENSOR_REPO) private readonly sensorRepo: ISensorRepo) {}

  async execute(command: RegisterDeviceCommand): Promise<Result<SensorDevice>> {
    const existing = await exec(sql`SELECT id FROM iot_sensors WHERE sensor_code = ${command.deviceCode} LIMIT 1`);
    if (existing.length > 0) { this.logger.warn('Device code already exists'); return Err(AppErr('CONFLICT', 'Device code already exists')); }

    const minT = command.thresholds?.min ?? null;
    const maxT = command.thresholds?.max ?? null;

    const result = await exec(sql`INSERT INTO iot_sensors (sensor_code, name, type, location, unit, min_threshold, max_threshold, is_active) VALUES (${command.deviceCode}, ${command.name}, ${command.type ?? 'generic'}, ${command.location ?? ''}, '', ${minT}, ${maxT}, true) RETURNING id, sensor_code, name, type, location, unit, is_active, min_threshold, max_threshold, created_at, 'active' AS status`);
    if (!result.length) return Err('Failed to register device');

    const saved = result[0];
    const registeredDevice = new SensorDevice(String(saved.name), String(saved.name), saved.type as SensorType);
    registeredDevice.id = String(saved.id);
    registeredDevice.createdAt = saved.created_at ? new Date(String(saved.created_at)) : _time.now();
    registeredDevice.updatedAt = registeredDevice.createdAt;
    this.logger.log('Device registered');
    return Ok(registeredDevice);
  }
}
