import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Result } from '@common/result';
import { SensorDevice } from '../../domain/aggregates/sensor-device.aggregate';
import { ISensorRepo, SENSOR_REPO } from '../../domain/repositories/i-sensor.repo';
import { GetDevicesQuery } from './get-devices.query';

@Injectable()
@QueryHandler(GetDevicesQuery)
export class GetDevicesHandler implements IQueryHandler<GetDevicesQuery> {
  private readonly logger = new Logger(GetDevicesHandler.name);

  

  constructor(@Inject(SENSOR_REPO) private readonly sensorRepo: ISensorRepo) {}

  async execute(query: GetDevicesQuery): Promise<Result<{ items: SensorDevice[]; total: number }>> {
      this.logger.log('Getting devices');

      const result = await this.sensorRepo.findAllDevices({
        status: query.status,
        type: query.type,
        page: query.page,
        limit: query.limit,
      });

      return result;
  }
}
