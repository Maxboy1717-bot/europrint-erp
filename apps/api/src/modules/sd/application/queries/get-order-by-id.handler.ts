/**
 * @module get-order-by-id.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { AppErr, Err, Ok, Result } from '@common/result';
import { ISalesOrderRepository, SALES_ORDER_REPO } from '../../domain/repositories/i-sales-order.repo';

export class GetOrderByIdQuery {
  private readonly logger = new Logger(GetOrderByIdQuery.name);
  constructor(public readonly orderId: number) {}
}

@QueryHandler(GetOrderByIdQuery)
export class GetOrderByIdHandler implements IQueryHandler<GetOrderByIdQuery> {
  private readonly logger = new Logger(GetOrderByIdHandler.name);

  constructor(
    @Inject(SALES_ORDER_REPO) private readonly orderRepo: ISalesOrderRepository,
  ) {}

  async execute(query: GetOrderByIdQuery): Promise<Result<Record<string, unknown>>> {
    this.logger.debug({ msg: 'Fetching order by id', orderId: query.orderId });

    const result = await this.orderRepo.findById(query.orderId);
    if (!result.ok || !result.data) {
      this.logger.warn({ msg: 'Order not found', orderId: query.orderId });
      return Err(AppErr('NOT_FOUND', 'Order not found'));
    }

    const order = result.data;

    // §11: 360° card view
    return Ok({
      id: order.getId(),
      orderNumber: order.getOrderNumber(),
      status: order.getStatus(),
      companyId: order.getCompanyId(),
      totalAmount: order.getTotalAmount(),
      advanceStatus: order.getAdvanceStatus(),
      checkpoints: {
        bom: order['_techBomApproved'],
        routing: order['_techRoutingApproved'],
        card: order['_techCardApproved'],
      },
      threeCheckpointPassed: order.isThreeCheckpointPassed(),
      advanceBlock: order.checkAdvanceAndBlock(),
    });
  }
}
