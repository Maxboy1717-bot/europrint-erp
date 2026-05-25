/**
 * @module wms-goods-issued.listener
 * @description PA2-18: canonical CQRS @EventsHandler form. Listens for
 *   WmsGoodsIssuedEvent (published by wms/goods-issue.handler) and opens
 *   the production-balance state on the sales order. Trigger 9.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { Result, safeCall, isErr } from '@common/result';
import { WmsGoodsIssuedEvent } from '@modules/wms/application/events/wms-goods-issued.event';

type Row = Record<string, unknown>;

/**
 * Trigger 9 — WMS Goods Issue tugadi → PP "ishlab chiqarish balans ombori" ochiladi.
 *
 * Mantiq: barcha materiallar omborga berildi → production_consumption
 * jadvalida balance entry ochiladi va master_status = 'in_production'.
 *
 * ARCHITECTURE.md §10 #9
 */
@Injectable()
@EventsHandler(WmsGoodsIssuedEvent)
export class WmsGoodsIssuedListener implements IEventHandler<WmsGoodsIssuedEvent> {
  private readonly logger = new Logger(WmsGoodsIssuedListener.name);

  async handle(event: WmsGoodsIssuedEvent): Promise<void> {
    // WmsGoodsIssuedEvent.payload carries the legacy shape {materialId, amount, ppId, timestamp}.
    // The PP listener still keys on orderId for `master_status` transitions, so accept either
    // a future orderId field or fall back to ppId (which historically maps 1:1 to sales-order id).
    const payload = event.payload ?? {};
    const orderIdRaw = payload['orderId'] ?? payload['ppId'];
    const orderId = Number(orderIdRaw);

    if (!Number.isFinite(orderId)) {
      this.logger.warn({ payload }, `Trigger 9: orderId yo'q`);
      return;
    }

    const updR = await this.openProductionBalance(orderId);
    if (isErr(updR)) {
      this.logger.error(`Trigger 9: order ${orderId} — ${updR.error.message}`);
      return;
    }
    if (updR.data) {
      this.logger.log(
        `Trigger 9 ✅ order ${orderId}: ishlab chiqarish balans ombori ochildi`,
      );
    } else {
      this.logger.debug(
        `Trigger 9: order ${orderId} allaqachon ishlab chiqarishda yoki status mos emas`,
      );
    }
  }

  /**
   * Sales order'ni `in_production` ga o'tkazadi.
   * Production balance opening — alohida service'da bo'lishi kerak,
   * bu yerda faqat status transition (idempotent).
   */
  private async openProductionBalance(orderId: number): Promise<Result<boolean>> {
    return safeCall(async () => {
      const upd = await db.execute<Row>(sql`
        UPDATE sales_orders
        SET master_status = 'in_production',
            updated_at = NOW(),
            pp_released_at = COALESCE(pp_released_at, NOW())
        WHERE id = ${orderId}
          AND master_status IN ('released_to_production', 'ready_for_planning', 'planned')
        RETURNING id
      `);
      const list = Array.isArray((upd as { rows?: Row[] }).rows)
        ? ((upd as { rows: Row[] }).rows)
        : (Array.isArray(upd) ? (upd as Row[]) : []);
      return list.length > 0;
    }, 'DB_ERROR');
  }
}
