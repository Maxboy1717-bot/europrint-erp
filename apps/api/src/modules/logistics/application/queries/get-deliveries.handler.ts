/**
 * @module get-deliveries.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { Result, PaginatedResult , Ok } from '@common/types/result.type';
import { GetDeliveriesQuery } from './get-deliveries.query';
import { Delivery } from '../../domain/aggregates/delivery.aggregate';
import { IDeliveryRepo, DELIVERY_REPO } from '../../domain/repositories/i-delivery.repo';

@Injectable()
@QueryHandler(GetDeliveriesQuery)
export class GetDeliveriesHandler implements IQueryHandler<GetDeliveriesQuery> {
  private readonly logger = new Logger(GetDeliveriesHandler.name);

  constructor(
    @Inject(DELIVERY_REPO) private readonly deliveryRepo: IDeliveryRepo,
      ) {}

  async execute(query: GetDeliveriesQuery): Promise<Result<PaginatedResult<Delivery>>> {
    const result = await this.deliveryRepo.findAll(query.filters);

    if (!result.ok) {
      this.logger.error('Failed to fetch deliveries');
      return result;
    }

    const page = query.filters.page || 1;
    const limit = query.filters.limit || 10;

    const paginatedResult: PaginatedResult<Delivery> = {
      items: result.data.items,
      total: result.data.total,
      page,
      limit,
    };

    this.logger.log('Deliveries fetched');

    return Ok(paginatedResult);
  }
}
