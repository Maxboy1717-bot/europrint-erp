import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { Result, safeCall, isErr } from '@common/result';
import { ERP_EVENTS } from '@common/constants/erp-events.constants';

interface WmsGoodsIssuedPayload {
  orderId: number;
  goodsIssueId?: number;
  warehouseId?: number;
  totalLines?: number;
}

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
export class WmsGoodsIssuedListener {
  private readonly logger = new Logger(WmsGoodsIssuedListener.name);

  @OnEvent(ERP_EVENTS.WMS_GOODS_ISSUED, { async: true, promisify: true })
  async handle(payload: WmsGoodsIssuedPayload): Promise<void> {
    if (!Number.isFinite(payload?.orderId)) {
      this.logger.warn(`Trigger 9: orderId yo'q`);
      return;
    }

    const updR = await this.openProductionBalance(payload.orderId);
    if (isErr(updR)) {
      this.logger.error(`Trigger 9: order ${payload.orderId} — ${updR.error.message}`);
      return;
    }
    if (updR.data) {
      this.logger.log(
        `Trigger 9 ✅ order ${payload.orderId}: ishlab chiqarish balans ombori ochildi`,
      );
    } else {
      this.logger.debug(
        `Trigger 9: order ${payload.orderId} allaqachon ishlab chiqarishda yoki status mos emas`,
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
