import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Result } from '@common/result';
import { SensorReading } from '../../domain/aggregates/sensor-reading.aggregate';
import { ISensorRepo, SENSOR_REPO } from '../../domain/repositories/i-sensor.repo';
import { GetAnomaliesQuery } from './get-anomalies.query';

@Injectable()
@QueryHandler(GetAnomaliesQuery)
export class GetAnomaliesHandler implements IQueryHandler<GetAnomaliesQuery> {
  private readonly logger = new Logger(GetAnomaliesHandler.name);

  

  constructor(@Inject(SENSOR_REPO) private readonly sensorRepo: ISensorRepo) {}

  async execute(query: GetAnomaliesQuery): Promise<Result<{ items: SensorReading[]; total: number }>> {
      this.logger.log('Getting anomalies');

      const result = await this.sensorRepo.findAnomalies({
        page: query.page,
        limit: query.limit,
      });

      return result;
  }
}
