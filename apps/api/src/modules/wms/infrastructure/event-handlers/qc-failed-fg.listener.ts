/**
 * @module qc-failed-fg.listener
 * @description Golden-thread QC→WMS reaction for a FAILED final/FG inspection
 *   (VISION-3340 #58, the "10-warehouse" row).
 *
 *   BEFORE this listener: when production/FG QC FAILED, the only reaction was a
 *   notification ({@link QcFailedNotificationListener} on the same {@link QcFailedEvent}).
 *   The WMS side did NOTHING — the failed (brak) quantity left no trace at all.
 *
 *   Batch 3 Variant-2 split (owner decision #1): FG-brak is NOT a physical stock balance. It is
 *   recorded in the pure REGISTER table `fg_scrap_log` (product_id, quantity, reason, source
 *   order, timestamp) — NO warehouse, NO stock balance, NO scrap-warehouse `warehouse_stock`
 *   row, and NO scrap `wms_transactions` movement. Rationale: raw material and finished goods are
 *   separate stock domains, and brak is a record-keeping event, not a warehouse balance. (This
 *   supersedes the earlier scrap-warehouse routing, which never ran on live data.)
 *
 *   NO FABRICATION (Q-40 / Q-46): the failed quantity is read from the real inspection row
 *   (`qc_inspections.fail_count`, fall back to `items_failed`) and the FG product from the real
 *   `sales_order_items` lines. Contamination guard (decision 5): the brak is keyed by
 *   `soi.product_id` ONLY — NO COALESCE fallback to `soi.material_id` (material_cards id space);
 *   a line without a product_id is SKIPPED + flagged, never fabricated from a material_cards id.
 *   If the failed quantity is 0/missing or the order has no FG product lines, the reaction is
 *   SKIPPED with a warning.
 *
 *   IDEMPOTENCY (no double-registering): QcFailedEvent can fire more than once for the same
 *   inspection (eventBus.publish + EventBridge re-emit, an at-least-once delivery retry). A
 *   NOT-EXISTS guard on `fg_scrap_log` keyed by (source_order_id=orderId, product_id,
 *   source_type='qc_failed') makes a second fire a no-op.
 *
 *   BEST-EFFORT / NON-FATAL (#22 listener resilience): the QC inspection already committed
 *   upstream; a failure to route the brak to scrap must NOT throw back to the event bus (which
 *   would abort sibling listeners — e.g. the notification — and surface an unhandled rejection).
 *   All failures are caught + structured-logged here.
 *
 * @layer Event Handler (WMS)
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { QcFailedEvent } from '../../../qc/domain/events';

/** Failed quantity, read from the QC inspection row itself. */
interface InspectionFailRow {
  /** brak (failed) count — fail_count, fall back to items_failed (mirrors PASS sibling). */
  fail_count: number;
}

/** One finished-goods line item of the sales order — the brak PRODUCT to register. */
interface FgLineRow {
  /** finished-goods product (sales_order_items.product_id). Contamination guard: NO material_id fallback. */
  product_id: number | null;
  /** kept ONLY to log a skipped line (has a material_cards id but no product_id). */
  material_id: number | null;
}

@Injectable()
@EventsHandler(QcFailedEvent)
export class QcFailedFgListener implements IEventHandler<QcFailedEvent> {
  private readonly logger = new Logger(QcFailedFgListener.name);

  async handle(event: QcFailedEvent): Promise<void> {
    this.logger.log(
      { inspectionId: event.inspectionId, orderId: event.orderId },
      'QC failed - routing brak (failed quantity) to scrap warehouse',
    );

    // #22 listener resilience: the whole brak-to-scrap flow is best-effort. The QC inspection
    // already committed upstream; a failure here must NOT throw back to the event bus (which
    // would abort sibling listeners like the QC-failed notification). All failures are caught +
    // structured-logged here.
    try {
      await this._registerFailedQtyAsBrak(event);
    } catch (error: unknown) {
      this.logger.error(
        {
          inspectionId: event.inspectionId,
          orderId: event.orderId,
          error: (error as Error)?.message ?? String(error),
        },
        'QcFailedFgListener: brak-register flow failed (golden-thread step QC-fail → WMS)',
      );
    }
  }

  private async _registerFailedQtyAsBrak(event: QcFailedEvent): Promise<void> {
    // The FAILED quantity lives on the QC inspection row (qc_inspections.fail_count — fall back
    // to items_failed). NO fabrication (Q-40): if fail_count is 0/missing the brak is not invented.
    const inspectionRows = await runQuery<InspectionFailRow>(sql`
      SELECT COALESCE(qi.fail_count, qi.items_failed, 0) AS fail_count
      FROM qc_inspections qi
      WHERE qi.id = ${Number(event.inspectionId)}
      LIMIT 1
    `);

    const inspection = Array.isArray(inspectionRows.rows) ? inspectionRows.rows[0] : undefined;
    if (!inspection) {
      this.logger.warn(
        { inspectionId: event.inspectionId, orderId: event.orderId },
        'QcFailedFgListener: inspection row not found, skipping brak register',
      );
      return;
    }

    const failQty = Number(inspection.fail_count) || 0;

    // Nothing actually failed → no brak to record. Real fails with a zero/missing fail_count skip.
    if (failQty <= 0) {
      this.logger.warn(
        { inspectionId: event.inspectionId, orderId: event.orderId },
        'QcFailedFgListener: fail_count <= 0, skipping brak register (nothing to record)',
      );
      return;
    }

    // Finished-goods product(s) come from the real line-item table. Contamination guard (decision 5):
    // product_id ONLY — no COALESCE fallback to material_id (material_cards id space).
    const lineRows = await runQuery<FgLineRow>(sql`
      SELECT soi.product_id AS product_id, soi.material_id AS material_id
      FROM sales_order_items soi
      WHERE soi.sales_order_id = ${event.orderId}
    `);

    const lines = Array.isArray(lineRows.rows) ? lineRows.rows : [];
    if (lines.length === 0) {
      this.logger.warn(
        { orderId: event.orderId },
        'QcFailedFgListener: no sales_order_items lines for order, skipping brak register',
      );
      return;
    }

    const reason = `QC-FAIL-${event.inspectionId}${event.reason ? `: ${event.reason}` : ''}`;

    for (const line of lines) {
      // Contamination guard (decision 5): use product_id ONLY. A line without a product_id (e.g. only
      // a material_cards id) is SKIPPED + flagged — never fabricate a product id from a material_cards id.
      const productId = line.product_id != null ? Number(line.product_id) : 0;
      if (!productId) {
        this.logger.warn(
          { orderId: event.orderId, materialCardsId: line.material_id },
          'QcFailedFgListener: brak register SKIPPED — sales_order_item has no product_id (contamination guard, decision 5)',
        );
        continue;
      }

      // Idempotency (no double-registering): a fg_scrap_log row for this order+product already exists
      // → this fire is a re-emit/retry, no-op.
      const dup = await runQuery<{ cnt: number }>(sql`
        SELECT COUNT(*)::int AS cnt
        FROM fg_scrap_log
        WHERE source_type = 'qc_failed'
          AND source_order_id = ${event.orderId}
          AND product_id = ${productId}
      `);
      const cnt = Array.isArray(dup.rows) && dup.rows[0] ? Number(dup.rows[0].cnt) : 0;
      if (cnt > 0) {
        this.logger.log(
          { orderId: event.orderId, productId },
          'QcFailedFgListener: brak already registered for this order+product (idempotent skip)',
        );
        continue;
      }

      // Batch 3 Variant-2 split (decision #1): FG-brak is a PURE REGISTER — no warehouse, no stock
      // balance, no wms_transactions movement. Record product + quantity + reason + source order only.
      await runQuery(sql`
        INSERT INTO fg_scrap_log
          (product_id, quantity, reason, source_order_id, source_type, created_by, created_at)
        VALUES
          (${productId}, ${failQty}, ${reason}, ${event.orderId}, 'qc_failed', NULL, NOW())
      `);

      this.logger.log(
        { orderId: event.orderId, productId, qty: failQty },
        'QC failed → WMS: brak registered in fg_scrap_log (pure register, no warehouse stock)',
      );
    }
  }
}
