import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { AppErr, Err, Ok, Result } from '@common/result';
import { SensorDevice } from '../../domain/aggregates/sensor-device.aggregate';
import { SensorType } from '../../domain/enums/sensor-status.enum';
import { ISensorRepo, SENSOR_REPO } from '../../domain/repositories/i-sensor.repo';
import { UpdateDeviceThresholdsCommand } from './update-device-thresholds.command';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';

type Row = Record<string, unknown>;
const exec = async (q: Parameters<typeof db.execute>[0]): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

@Injectable()
@CommandHandler(UpdateDeviceThresholdsCommand)
export class UpdateDeviceThresholdsHandler implements ICommandHandler<UpdateDeviceThresholdsCommand> {
  private readonly logger = new Logger(UpdateDeviceThresholdsHandler.name);

  constructor(@Inject(SENSOR_REPO) private readonly sensorRepo: ISensorRepo) {}

  async execute(command: UpdateDeviceThresholdsCommand): Promise<Result<SensorDevice>> {
    const existing = await exec(sql`SELECT id FROM iot_sensors WHERE id = ${command.deviceId} LIMIT 1`);
    if (!existing.length) return Err(AppErr('NOT_FOUND', 'Device not found'));

    const minT = command.thresholds?.min ?? null;
    const maxT = command.thresholds?.max ?? null;

    const result = await exec(sql`UPDATE iot_sensors SET min_threshold = ${minT}, max_threshold = ${maxT} WHERE id = ${command.deviceId} RETURNING id, sensor_code, name, type, location, unit, is_active, min_threshold, max_threshold, created_at, CASE WHEN is_active THEN 'active' ELSE 'inactive' END AS status`);
    if (!result.length) return Err('Failed to update thresholds');

    const updated = result[0];
    const device = new SensorDevice(String(updated.name), String(updated.name), updated.type as SensorType);
    device.id = String(updated.id);
    device.createdAt = updated.created_at ? new Date(String(updated.created_at)) : _time.now();
    device.updatedAt = device.createdAt;
    device.thresholds = { min: updated.min_threshold != null ? Number(updated.min_threshold) : undefined, max: updated.max_threshold != null ? Number(updated.max_threshold) : undefined };
    this.logger.log('Thresholds updated');
    return Ok(device);
  }
}
