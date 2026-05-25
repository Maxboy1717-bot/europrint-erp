/**
 * @module get-incidents.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { Result, PaginatedResult , Ok } from '@common/types/result.type';
import { GetIncidentsQuery } from './get-incidents.query';
import { SecurityIncident } from '../../domain/aggregates/security-incident.aggregate';
import { IIncidentRepo, INCIDENT_REPO } from '../../domain/repositories/i-incident.repo';

@Injectable()
@QueryHandler(GetIncidentsQuery)
export class GetIncidentsHandler implements IQueryHandler<GetIncidentsQuery> {
  private readonly logger = new Logger(GetIncidentsHandler.name);

  constructor(
    @Inject(INCIDENT_REPO) private readonly incidentRepo: IIncidentRepo,
      ) {}

  async execute(query: GetIncidentsQuery): Promise<Result<PaginatedResult<SecurityIncident>>> {
    const result = await this.incidentRepo.findAll(query.filters);

    if (!result.ok) {
      this.logger.error('Failed to fetch incidents');
      return result;
    }

    const page = query.filters.page || 1;
    const limit = query.filters.limit || 10;

    const paginatedResult: PaginatedResult<SecurityIncident> = {
      items: result.data.items,
      total: result.data.total,
      page,
      limit,
    };

    this.logger.log('Incidents fetched');

    return Ok(paginatedResult);
  }
}
