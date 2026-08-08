/**
 * @module get-sales-order-queue-position.handler
 * @description Modul-06 #47: resolve ONE sales order's production queue_position (=rank in the
 *   ranked plan) + estimated_start (production_orders.scheduled_start) for the SD order card.
 *   Reuses the REAL ranked queue (GetProductionQueueQuery -> ProductionPriorityService.buildQueue)
 *   via the QueryBus — no duplicated ranking, no DDL, no fabrication (Q-40). NOT_FOUND when no
 *   production order links the sales order yet.
 */

import { QueryHandler, IQueryHandler, QueryBus } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { AppErr, Result, Ok, Err } from '@common/result';
import { GetProductionQueueQuery } from './get-production-queue.query';
import { GetSalesOrderQueuePositionQuery } from './get-sales-order-queue-position.query';

@Injectable()
@QueryHandler(GetSalesOrderQueuePositionQuery)
export class GetSalesOrderQueuePositionHandler
  implements IQueryHandler<GetSalesOrderQueuePositionQuery>
{
  private readonly logger = new Logger(GetSalesOrderQueuePositionHandler.name);

  constructor(private readonly queryBus: QueryBus) {}

  async execute(
    query: GetSalesOrderQueuePositionQuery,
  ): Promise<Result<Record<string, unknown>>> {
    // Reuse the single source of ranking truth (no duplicated buildQueue logic).
    const queueRes = (await this.queryBus.execute(
      new GetProductionQueueQuery({}),
    )) as Result<Record<string, unknown>[]>;
    if (!queueRes.ok) return Err(queueRes.error);

    const rows = Array.isArray(queueRes.data) ? queueRes.data : [];
    const entry = rows.find(
      (r) => r.salesOrderId != null && Number(r.salesOrderId) === query.salesOrderId,
    );
    if (!entry) {
      this.logger.debug(
        `No production queue entry for sales order ${query.salesOrderId}`,
      );
      return Err(
        AppErr(
          'NOT_FOUND',
          'Bu sotuv buyurtmasi uchun ishlab chiqarish navbati topilmadi',
        ),
      );
    }

    return Ok({
      salesOrderId: query.salesOrderId,
      productionOrderId: entry.id ?? null,
      queuePosition: entry.rank ?? null,
      estimatedStart: entry.estimatedStart ?? null,
      orderNumber: entry.orderNumber ?? null,
      status: entry.status ?? null,
    });
  }
}
