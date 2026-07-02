/**
 * @module get-purchase-orders.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { Result, Ok } from '@common/result';
import { db } from '@shared/db';
// APPROVED: egasi ikki-dunyo-tuzatish 2026-07-02 — live `purchase_orders`.id/vendor_id
// are INTEGER, not the uuid PK schema-wms.ts declares (see schema-compat-mm-po-intpk.ts).
import { purchase_orders } from '@shared/db/schema-compat-mm-po-intpk';
import { and, count, sql } from 'drizzle-orm';
import { GetPurchaseOrdersQuery } from './get-purchase-orders.query';

@Injectable()
@QueryHandler(GetPurchaseOrdersQuery)
export class GetPurchaseOrdersHandler implements IQueryHandler<GetPurchaseOrdersQuery> {
  private readonly logger = new Logger(GetPurchaseOrdersHandler.name);

  async execute(
    query: GetPurchaseOrdersQuery): Promise<Result<{ items: unknown[]; total: number }>> {
      const page = query.page || 1;
      const limit = query.limit || 20;
      const offset = (page - 1) * limit;

      const conditions: import('drizzle-orm').SQL<unknown>[] = [];
      if (query.status) {
        conditions.push(sql`${purchase_orders.status} = ${String(query.status)}`);
      }
      if (query.vendorId) {
        conditions.push(sql`${purchase_orders.vendor_id} = ${query.vendorId}`);
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const items = await db
        .select({
          id: purchase_orders.id,
          po_number: purchase_orders.po_number,
          vendor_name: purchase_orders.vendor_name,
          vendor_id: purchase_orders.vendor_id,
          total_amount: purchase_orders.total_amount,
          currency: purchase_orders.currency,
          status: purchase_orders.status,
          created_at: purchase_orders.created_at,
          updated_at: purchase_orders.updated_at,
        })
        .from(purchase_orders)
        .where(whereClause)
        .limit(limit)
        .offset(offset);

      const countResult = await db
        .select({ count: count() })
        .from(purchase_orders)
        .where(whereClause);

      this.logger.log(
        { status: query.status, vendorId: query.vendorId, page, limit },
        'Purchase orders retrieved');

      return Ok({
        items,
        total: countResult[0]?.count || 0,
      });
  }
}
