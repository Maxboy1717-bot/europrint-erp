/**
 * @module get-order-by-id.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { AppErr, Err, Ok, Result } from '@common/result';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { ISalesOrderRepository, SALES_ORDER_REPO } from '../../domain/repositories/i-sales-order.repo';

/** audit 2026-08-06 T6 (IDOR item 3): roles that see every order. */
const SD_SEES_ALL = new Set(['super_admin', 'admin', 'director', 'accountant', 'finance']);

export class GetOrderByIdQuery {
  private readonly logger = new Logger(GetOrderByIdQuery.name);
  constructor(
    public readonly orderId: number,
    /** audit 2026-08-06 T6: caller identity for ownership scoping. */
    public readonly requester?: { id?: number | null; role?: string | null },
  ) {}
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

    // audit 2026-08-06 T6 (IDOR item 3): non-privileged callers (sales_manager/manager)
    // may only read orders they created. created_by_user_id NULL = legacy row → pass
    // (established NULL-pass pattern); mismatch → same NOT_FOUND (existence not leaked).
    if (query.requester && !SD_SEES_ALL.has(String(query.requester.role ?? '').toLowerCase())) {
      const own = await runQuery<{ created_by_user_id: number | null }>(sql`
        SELECT created_by_user_id FROM sales_orders WHERE id = ${query.orderId} LIMIT 1
      `);
      const createdBy = own.rows[0]?.created_by_user_id ?? null;
      if (createdBy != null && Number(createdBy) !== Number(query.requester.id ?? -1)) {
        return Err(AppErr('NOT_FOUND', 'Order not found'));
      }
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
