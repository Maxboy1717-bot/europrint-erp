/**
 * @module get-design-orders.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { Result, PaginatedResult , Ok } from '@common/types/result.type';
import { GetDesignOrdersQuery } from './get-design-orders.query';
import { DesignOrder } from '../../domain/aggregates/design-order.aggregate';
import { IDesignRepo, DESIGN_REPO } from '../../domain/repositories/i-design.repo';

@Injectable()
@QueryHandler(GetDesignOrdersQuery)
export class GetDesignOrdersHandler implements IQueryHandler<GetDesignOrdersQuery> {
  private readonly logger = new Logger(GetDesignOrdersHandler.name);

  constructor(
    @Inject(DESIGN_REPO) private readonly designRepo: IDesignRepo,
      ) {}

  async execute(query: GetDesignOrdersQuery): Promise<Result<PaginatedResult<DesignOrder>>> {
    const result = await this.designRepo.findAll(query.filters);

    if (!result.ok) {
      this.logger.error('Failed to fetch design orders');
      return result;
    }

    const page = query.filters.page || 1;
    const limit = query.filters.limit || 10;

    const paginatedResult: PaginatedResult<DesignOrder> = {
      items: result.data.items,
      total: result.data.total,
      page,
      limit,
    };

    this.logger.log('Design orders fetched');

    return Ok(paginatedResult);
  }
}
