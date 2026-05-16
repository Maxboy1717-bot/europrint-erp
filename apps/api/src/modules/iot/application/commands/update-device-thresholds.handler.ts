/**
 * @module update-device-thresholds.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Err, Ok, Result, isErr } from '@common/result';
import { SensorDevice } from '../../domain/aggregates/sensor-device.aggregate';
import { ISensorRepo, SENSOR_REPO } from '../../domain/repositories/i-sensor.repo';
import { UpdateDeviceThresholdsCommand } from './update-device-thresholds.command';

@Injectable()
@CommandHandler(UpdateDeviceThresholdsCommand)
export class UpdateDeviceThresholdsHandler implements ICommandHandler<UpdateDeviceThresholdsCommand> {
  private readonly logger = new Logger(UpdateDeviceThresholdsHandler.name);

  constructor(@Inject(SENSOR_REPO) private readonly sensorRepo: ISensorRepo) {}

  async execute(command: UpdateDeviceThresholdsCommand): Promise<Result<SensorDevice>> {
    const result = await this.sensorRepo.updateThresholds(command.deviceId, {
      min: command.thresholds?.min ?? null,
      max: command.thresholds?.max ?? null,
    });
    if (isErr(result)) return Err(result.error);

    this.logger.log('Thresholds updated');
    return Ok(result.data);
  }
}
