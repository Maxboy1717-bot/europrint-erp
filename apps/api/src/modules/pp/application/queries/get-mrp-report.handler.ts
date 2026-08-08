/**
 * @module get-mrp-report.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { safeNum } from '@common/math';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { db, production_orders_int, boms_int, warehouse_stock } from '@shared/db';
import { materialCards } from '@workspace/db';
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
        // production_orders.id is INTEGER in the live DB (not UUID) — coerce the
        // string filter to a number so the comparison matches the real PK type.
        const [order] = await db.select().from(production_orders_int).where(eq(production_orders_int.id, Number(query.filters.productionOrderId))).limit(1);
        if (order) {
          orders = [order];
        }
      } else {
        orders = await db.select().from(production_orders_int).where(sql`${production_orders_int.status} != 'completed' AND ${production_orders_int.status} != 'cancelled'`);
      }

      const shortage = [];

      for (const _order of orders) {
        const order = _order as Record<string, unknown>;
        let bom: Record<string, unknown> | null = null;

        if (order.bomId) {
          const [bomRow] = await db.select().from(boms_int).where(eq(boms_int.id, Number(order.bomId))).limit(1);
          bom = bomRow ? (bomRow as Record<string, unknown>) : null;
        }

        if (!bom) continue;

        const items = (bom.items as Record<string, unknown>[]) || [];

        for (const bomItem of items) {
          // Real material master = material_cards (business code column `kod`,
          // matches the BOM item's sku). Real stock = warehouse_stock, summed
          // across all warehouses' availableQuantity (quantity minus reserved),
          // NOT the 7-row demo `stock_items` table.
          const [materialRow] = await db
            .select()
            .from(materialCards)
            .where(eq(materialCards.kod, String(bomItem.sku || '')))
            .limit(1);

          let available = 0;
          let itemName: unknown = bomItem.name;

          if (materialRow) {
            const [stockAgg] = await db
              .select({ available: sql<string>`COALESCE(SUM(${warehouse_stock.availableQuantity}), 0)` })
              .from(warehouse_stock)
              .where(eq(warehouse_stock.materialCardId, String(materialRow.id)));
            available = stockAgg ? safeNum(stockAgg.available) : 0;
            itemName = materialRow.xomAshyo || bomItem.name;
          }

          const needed = (Number(bomItem.quantity) || 0) * (Number(order.quantity) || 0);
          const shortfall = Math.max(0, needed - available);

          if (shortfall > 0) {
            shortage.push({
              productionOrderId: order.id,
              productionOrderNumber: order.orderNumber,
              bom: bom.product_name,
              bomItem: bomItem.sku || bomItem.name,
              itemName,
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
