/**
 * @module get-mrp-report.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { safeNum } from '@common/math';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { db, production_orders, boms, stock_items } from '@shared/db';
import { eq, sql } from 'drizzle-orm';
import { Result } from '@common/types/result.type';
import { GetMrpReportQuery } from './get-mrp-report.query';

@Injectable()
@QueryHandler(GetMrpReportQuery)
export class GetMrpReportHandler implements IQueryHandler<GetMrpReportQuery> {
  private readonly logger = new Logger(GetMrpReportHandler.name);

  async execute(query: GetMrpReportQuery): Promise<Result<object[]>> {
      let orders: unknown[] = [];

      if (query.filters.productionOrderId) {
        const [order] = await db.select().from(production_orders).where(eq(production_orders.id, query.filters.productionOrderId)).limit(1);
        if (order) {
          orders = [order];
        }
      } else {
        orders = await db.select().from(production_orders).where(sql`${production_orders.status} != 'completed' AND ${production_orders.status} != 'cancelled'`);
      }

      const shortage = [];

      for (const _order of orders) {
        const order = _order as Record<string, unknown>;
        let bom: Record<string, unknown> | null = null;

        if (order.bom_id) {
          const [bomRow] = await db.select().from(boms).where(eq(boms.id, String(order.bom_id))).limit(1);
          bom = bomRow ? (bomRow as Record<string, unknown>) : null;
        }

        if (!bom) continue;

        const items = (bom.items as Record<string, unknown>[]) || [];

        for (const bomItem of items) {
          const [stock] = await db.select().from(stock_items).where(eq(stock_items.sku, String(bomItem.sku || ''))).limit(1);
          const stockRow = stock ? (stock as Record<string, unknown>) : null;

          const needed = (Number(bomItem.quantity) || 0) * (Number(order.quantity) || 0);
          const available = stockRow ? safeNum(stockRow.quantity) : 0;
          const shortfall = Math.max(0, needed - available);

          if (shortfall > 0) {
            shortage.push({
              productionOrderId: order.id,
              productionOrderNumber: order.order_number,
              bom: bom.product_name,
              bomItem: bomItem.sku || bomItem.name,
              itemName: stockRow?.name || bomItem.name,
              required: needed,
              available,
              shortage: shortfall,
              unit: order.unit,
            });
          }
        }
      }

      this.logger.debug(`MRP report generated: ${shortage.length} shortages found`);

      return { ok: true, data: shortage };
  }
}
