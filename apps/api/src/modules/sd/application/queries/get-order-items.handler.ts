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
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import {
  ISalesOrderRepository,
  SALES_ORDER_REPO,
  SalesOrderItemView,
} from '../../domain/repositories/i-sales-order.repo';

/** audit 2026-08-06 T6 (IDOR item 3): roles that see every order. */
const SD_SEES_ALL = new Set(['super_admin', 'admin', 'director', 'accountant', 'finance']);

export class GetOrderItemsQuery {
  constructor(
    public readonly orderId: number,
    /** audit 2026-08-06 T6: caller identity for ownership scoping. */
    public readonly requester?: { id?: number | null; role?: string | null },
  ) {}
}

@QueryHandler(GetOrderItemsQuery)
export class GetOrderItemsHandler implements IQueryHandler<GetOrderItemsQuery> {
  private readonly logger = new Logger(GetOrderItemsHandler.name);

  constructor(
    @Inject(SALES_ORDER_REPO) private readonly orderRepo: ISalesOrderRepository,
  ) {}

  async execute(query: GetOrderItemsQuery): Promise<Result<SalesOrderItemView[]>> {
    this.logger.debug({ msg: 'Fetching order line-items', orderId: query.orderId });

    // audit 2026-08-06 T6 (IDOR item 3): same ownership rule as GetOrderByIdHandler —
    // non-privileged callers only read line-items of orders they created (NULL-pass).
    if (query.requester && !SD_SEES_ALL.has(String(query.requester.role ?? '').toLowerCase())) {
      const own = await runQuery<{ created_by_user_id: number | null }>(sql`
        SELECT created_by_user_id FROM sales_orders WHERE id = ${query.orderId} LIMIT 1
      `);
      const createdBy = own.rows[0]?.created_by_user_id ?? null;
      if (createdBy != null && Number(createdBy) !== Number(query.requester.id ?? -1)) {
        return Ok([]);
      }
    }

    const result = await this.orderRepo.findItemsByOrderId(query.orderId);
    if (!result.ok) return result;

    // Empty array when the order has no lines (or does not exist) — no 404 on empty,
    // mirroring the read-only nature of this list endpoint.
    return Ok(Array.isArray(result.data) ? result.data : []);
  }
}
