/**
 * @module get-order-items.handler
 * @description CQRS query handler. execute() reads one order's persisted line-items; returns Result<T>.
 *
 * VISION-3340 #53 "Takrorlash"/clone enabler: the 360° order-detail view
 * (GetOrderByIdHandler) returns only the header summary, so the FE clone dialog
 * needs the real line-items (product/qty/unit/price) to pre-fill a new order.
 */

import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Ok, Result } from '@common/result';
import {
  ISalesOrderRepository,
  SALES_ORDER_REPO,
  SalesOrderItemView,
} from '../../domain/repositories/i-sales-order.repo';

export class GetOrderItemsQuery {
  constructor(public readonly orderId: number) {}
}

@QueryHandler(GetOrderItemsQuery)
export class GetOrderItemsHandler implements IQueryHandler<GetOrderItemsQuery> {
  private readonly logger = new Logger(GetOrderItemsHandler.name);

  constructor(
    @Inject(SALES_ORDER_REPO) private readonly orderRepo: ISalesOrderRepository,
  ) {}

  async execute(query: GetOrderItemsQuery): Promise<Result<SalesOrderItemView[]>> {
    this.logger.debug({ msg: 'Fetching order line-items', orderId: query.orderId });

    const result = await this.orderRepo.findItemsByOrderId(query.orderId);
    if (!result.ok) return result;

    // Empty array when the order has no lines (or does not exist) — no 404 on empty,
    // mirroring the read-only nature of this list endpoint.
    return Ok(Array.isArray(result.data) ? result.data : []);
  }
}
