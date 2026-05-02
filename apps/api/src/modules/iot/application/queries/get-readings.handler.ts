import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Result } from '@common/result';
import { SensorReading } from '../../domain/aggregates/sensor-reading.aggregate';
import { ISensorRepo, SENSOR_REPO } from '../../domain/repositories/i-sensor.repo';
import { GetReadingsQuery } from './get-readings.query';

@Injectable()
@QueryHandler(GetReadingsQuery)
export class GetReadingsHandler implements IQueryHandler<GetReadingsQuery> {
  private readonly logger = new Logger(GetReadingsHandler.name);

  

  constructor(@Inject(SENSOR_REPO) private readonly sensorRepo: ISensorRepo) {}

  async execute(query: GetReadingsQuery): Promise<Result<SensorReading[]>> {
      this.logger.log('Getting readings');

      const result = await this.sensorRepo.findReadings(query.deviceId, {
        from: query.from,
        to: query.to,
        limit: query.limit,
      });

      return result;
  }
}
