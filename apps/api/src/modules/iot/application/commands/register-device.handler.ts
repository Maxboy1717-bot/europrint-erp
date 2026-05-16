/**
 * @module register-device.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { AppErr, Err, Ok, Result, isErr } from '@common/result';
import { SensorDevice } from '../../domain/aggregates/sensor-device.aggregate';
import { ISensorRepo, SENSOR_REPO } from '../../domain/repositories/i-sensor.repo';
import { RegisterDeviceCommand } from './register-device.command';

@Injectable()
@CommandHandler(RegisterDeviceCommand)
export class RegisterDeviceHandler implements ICommandHandler<RegisterDeviceCommand> {
  private readonly logger = new Logger(RegisterDeviceHandler.name);

  constructor(@Inject(SENSOR_REPO) private readonly sensorRepo: ISensorRepo) {}

  async execute(command: RegisterDeviceCommand): Promise<Result<SensorDevice>> {
    const existsResult = await this.sensorRepo.existsByCode(command.deviceCode);
    if (isErr(existsResult)) return Err(existsResult.error);
    if (existsResult.data) {
      this.logger.warn('Device code already exists');
      return Err(AppErr('CONFLICT', 'Device code already exists'));
    }

    const result = await this.sensorRepo.registerDevice({
      deviceCode: command.deviceCode,
      name: command.name,
      type: command.type,
      location: command.location,
      thresholds: command.thresholds,
    });
    if (isErr(result)) return Err(result.error);

    this.logger.log('Device registered');
    return Ok(result.data);
  }
}
