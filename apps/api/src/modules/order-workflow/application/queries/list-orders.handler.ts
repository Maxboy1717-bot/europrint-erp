/**
 * @module list-orders.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result, Err, Ok } from '@common/types/result.type';
import { PaginatedResult } from '@common/types/result.type';
import { IOrderRepo, ORDER_WF_REPO } from '../../infrastructure/repositories/i-order.repo';
import { OrderAggregate } from '../../domain/aggregates/order.aggregate';

const SCOPED_ROLES = new Set(['SALES_MANAGER']);

export class ListOrdersQuery {
  constructor(
    public readonly status?:     string,
    public readonly customerId?: number,
    public readonly limit:       number = 50,
    public readonly offset:      number = 0,
    public readonly actorRole:   string = '',
    public readonly actorId:     number = 0,
  ) {}
}

export interface OrderListItem {
  id:           string;
  orderNumber:  string;
  status:       string;
  customerId:   number | null;
  totalAmount:  number;
  currency:     string;
  stateVersion: number;
}

@QueryHandler(ListOrdersQuery)
export class ListOrdersHandler implements IQueryHandler<ListOrdersQuery> {
  private readonly logger = new Logger(ListOrdersHandler.name);

  constructor(@Inject(ORDER_WF_REPO) private readonly repo: IOrderRepo) {}

  async execute(query: ListOrdersQuery): Promise<Result<PaginatedResult<OrderListItem>>> {
    const scopedActorId = SCOPED_ROLES.has(query.actorRole) ? query.actorId : undefined;

    const result = await this.repo.findAll({
      status:       query.status,
      customerId:   query.customerId,
      limit:        query.limit,
      offset:       query.offset,
      actorId:      scopedActorId,
    });
    if (!result.ok) return Err(result.error);

    const items = (Array.isArray(result.data.items) ? result.data.items : []).map((o: OrderAggregate) => this.toListItem(o));
    return Ok({ items, total: result.data.total });
  }

  private toListItem(o: OrderAggregate): OrderListItem {
    return {
      id:           o.getId(),
      orderNumber:  o.getOrderNumber(),
      status:       o.getStatus(),
      customerId:   o.getCustomerId(),
      totalAmount:  o.getTotalAmount(),
      currency:     o.getCurrency(),
      stateVersion: o.getStateVersion(),
    };
  }
}
