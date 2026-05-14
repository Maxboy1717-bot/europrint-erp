/**
 * @module pending-advance-orders.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { AppErr, Err, Ok, Result } from '@common/result';
import { ISalesOrderRepository } from '../../domain/repositories/i-sales-order.repo';

export class PendingAdvanceOrdersQuery {
  constructor(public readonly limit: number = 50,
    public readonly offset: number = 0) {}
}

@QueryHandler(PendingAdvanceOrdersQuery)
export class PendingAdvanceOrdersHandler implements IQueryHandler<PendingAdvanceOrdersQuery> {
  private readonly logger = new Logger(PendingAdvanceOrdersHandler.name);
  constructor(
    @Inject('ISalesOrderRepository') private readonly orderRepo: ISalesOrderRepository,
  ) {}

  async execute(query: PendingAdvanceOrdersQuery): Promise<Result<Record<string, unknown>>> {
    this.logger.debug({
      msg: 'Fetching pending advance orders',
      limit: query.limit,
      offset: query.offset,
    });

    const result = await this.orderRepo.findPendingAdvanceOrders(query.limit, query.offset);
    if (!result.ok) {
      this.logger.error({ msg: 'Failed to fetch pending advance orders', error: result.error });
      return Err(AppErr('INTERNAL', 'Failed to fetch pending advance orders'));
    }

    return Ok({
      data: result.data,
      pagination: {
        limit: query.limit,
        offset: query.offset,
        total: result.data?.length || 0,
      },
    });
  }
}
