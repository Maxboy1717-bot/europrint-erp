/**
 * @module qc-failed-fg.listener
 * @description Golden-thread QC→WMS reaction for a FAILED final/FG inspection
 *   (VISION-3340 #58, the "10-warehouse" row).
 *
 *   BEFORE this listener: when production/FG QC FAILED, the only reaction was a
 *   notification ({@link QcFailedNotificationListener} on the same {@link QcFailedEvent}).
 *   The WMS side did NOTHING — the failed (brak) quantity left no stock trace at all, while
 *   the mirror-image PASS path ({@link QcPassedListener}) already routes the passed quantity
 *   into canonical finished-goods stock. So a QC fail produced an alert but no stock action.
 *
 *   THIS listener closes that gap. It subscribes to the SAME canonical {@link QcFailedEvent}
 *   the notification listener uses and routes the FAILED quantity into the canonical SCRAP
 *   warehouse ("Brak Ombori", warehouses.type='scrap'), mirroring the PASS sibling's mechanism
 *   for the failed quantity:
 *     • an 'IN' `wms_transactions` ledger row into the scrap warehouse (the auditable movement,
 *       traced by notes `QC-FAIL-<inspectionId> brak`, read by the dashboard movement KPIs); and
 *     • a `warehouse_stock` UPSERT into the scrap warehouse so the brak is visible in Brak Ombori.
 *   These are the exact two writes the PASS path performs (execReceiveFg + execInsertWmsTransaction),
 *   mirrored onto the scrap warehouse and the failed quantity instead of the finished-goods
 *   warehouse and the passed quantity.
 *
 *   NO FABRICATION (Q-40 / Q-46): the failed quantity is read from the real inspection row
 *   (`qc_inspections.fail_count`, fall back to `items_failed` — the same COALESCE the PASS
 *   sibling uses for pass_count/items_passed), the FG material from the real
 *   `sales_order_items` lines, and the scrap warehouse from the real `warehouses` row. If the
 *   failed quantity is 0/missing, no scrap warehouse is configured, or the order has no FG
 *   lines, the reaction is SKIPPED with a warning — the quantity/warehouse are NEVER invented.
 *
 *   IDEMPOTENCY (no double-scrapping): QcFailedEvent can fire more than once for the same
 *   inspection (eventBus.publish + EventBridge re-emit to legacy string-topic consumers, an
 *   at-least-once delivery retry). A NOT-EXISTS guard on the scrap-warehouse 'IN'
 *   `wms_transactions` ledger keyed by (reference_id=orderId, material_id, warehouse_id=scrap)
 *   makes a second fire a no-op. The ledger row is written FIRST so a partial failure degrades
 *   to an under-count rather than a phantom double-stock (best-effort, no-double-stock priority).
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

/** Failed quantity + resolved scrap warehouse, read from the QC inspection row itself. */
interface InspectionFailRow {
  /** brak (failed) count — fail_count, fall back to items_failed (mirrors PASS sibling). */
  fail_count: number;
  /** scrap warehouse id (warehouses.type='scrap', SCRAP-MAIN "Brak Ombori") or NULL. */
  scrap_warehouse_id: number | null;
}

/** One finished-goods line item of the sales order — the brak material to route to scrap. */
interface FgLineRow {
  material_id: number;
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
      await this._routeFailedQtyToScrap(event);
    } catch (error: unknown) {
      this.logger.error(
        {
          inspectionId: event.inspectionId,
          orderId: event.orderId,
          error: (error as Error)?.message ?? String(error),
        },
        'QcFailedFgListener: scrap-routing flow failed (golden-thread step QC-fail → WMS)',
      );
    }
  }

  private async _routeFailedQtyToScrap(event: QcFailedEvent): Promise<void> {
    // The FAILED quantity lives on the QC inspection row (qc_inspections.fail_count — fall back
    // to items_failed, the same COALESCE shape the PASS sibling uses for pass_count/items_passed).
    // The scrap warehouse (warehouses.type='scrap') is resolved in the SAME query. NO fallback to
    // a default warehouse (Q-40): brak must land in a real scrap warehouse or not at all.
    const inspectionRows = await runQuery<InspectionFailRow>(sql`
      SELECT
        COALESCE(qi.fail_count, qi.items_failed, 0) AS fail_count,
        (SELECT w.id FROM warehouses w
           WHERE w.type = 'scrap'
           ORDER BY w.id LIMIT 1)                   AS scrap_warehouse_id
      FROM qc_inspections qi
      WHERE qi.id = ${Number(event.inspectionId)}
      LIMIT 1
    `);

    const inspection = Array.isArray(inspectionRows.rows) ? inspectionRows.rows[0] : undefined;
    if (!inspection) {
      this.logger.warn(
        { inspectionId: event.inspectionId, orderId: event.orderId },
        'QcFailedFgListener: inspection row not found, skipping scrap routing',
      );
      return;
    }

    const failQty = Number(inspection.fail_count) || 0;
    const scrapWarehouseId =
      inspection.scrap_warehouse_id != null ? Number(inspection.scrap_warehouse_id) : 0;

    // Nothing actually failed → no brak to route. A 0-qty scrap movement would only create an
    // empty ledger row + touch an empty scrap-stock row (no-op). Real fails with a zero/missing
    // fail_count skip the scrap routing entirely.
    if (failQty <= 0) {
      this.logger.warn(
        { inspectionId: event.inspectionId, orderId: event.orderId },
        'QcFailedFgListener: fail_count <= 0, skipping scrap routing (nothing to scrap)',
      );
      return;
    }

    // NO FABRICATION (Q-40): with no scrap warehouse configured, skip — never invent a warehouse
    // (mirrors MesCompletedFgListener skipping when no finished-goods warehouse exists).
    if (scrapWarehouseId <= 0) {
      this.logger.warn(
        { inspectionId: event.inspectionId, orderId: event.orderId },
        'QcFailedFgListener: no scrap warehouse configured (warehouses.type=scrap), skipping scrap routing',
      );
      return;
    }

    // Finished-goods material(s) come from the real line-item table — the SAME source the PASS
    // sibling uses. product_id is the FG material; it is nullable in live data, so fall back to
    // material_id. One scrap movement per finished-goods line item.
    const lineRows = await runQuery<FgLineRow>(sql`
      SELECT COALESCE(soi.product_id, soi.material_id) AS material_id
      FROM sales_order_items soi
      WHERE soi.sales_order_id = ${event.orderId}
        AND COALESCE(soi.product_id, soi.material_id) IS NOT NULL
    `);

    const lines = Array.isArray(lineRows.rows) ? lineRows.rows : [];
    if (lines.length === 0) {
      this.logger.warn(
        { orderId: event.orderId },
        'QcFailedFgListener: no sales_order_items lines for order, skipping scrap routing',
      );
      return;
    }

    for (const line of lines) {
      const materialId = Number(line.material_id) || 0;
      if (!materialId) continue;

      // Idempotency guard (no double-scrapping): a scrap-warehouse 'IN' ledger row for this
      // order+material already exists → this fire is a re-emit/retry, no-op. Mirrors the
      // ReceiveFgHandler dedup guard, narrowed to the scrap warehouse.
      const dup = await runQuery<{ cnt: number }>(sql`
        SELECT COUNT(*)::int AS cnt
        FROM wms_transactions
        WHERE type = 'IN'
          AND warehouse_id = ${scrapWarehouseId}
          AND reference_id = ${event.orderId}
          AND material_id = ${materialId}
          AND deleted_at IS NULL
      `);
      const cnt = Array.isArray(dup.rows) && dup.rows[0] ? Number(dup.rows[0].cnt) : 0;
      if (cnt > 0) {
        this.logger.log(
          { orderId: event.orderId, materialId, warehouseId: scrapWarehouseId },
          'QcFailedFgListener: scrap movement already exists for this order+material (idempotent skip)',
        );
        continue;
      }

      // Mirror of the PASS sibling's two writes (execInsertWmsTransaction + execReceiveFg),
      // routed onto the scrap warehouse and the failed quantity.
      //
      // Ledger row FIRST: the idempotency guard above reads this row, so writing it first makes a
      // re-fire after a full success a clean no-op, and a partial failure (ledger ok, stock write
      // fails) degrades to an under-count rather than a phantom double-stock (no-double-stock
      // priority). type='IN' is the proven ledger value (same as the receipt path); the SCRAP
      // semantics come from the scrap warehouse_id + the `QC-FAIL … brak` notes, not a novel type.
      const notes = `QC-FAIL-${event.inspectionId} brak${event.reason ? `: ${event.reason}` : ''}`;
      await runQuery(sql`
        INSERT INTO wms_transactions
          (warehouse_id, material_id, type, quantity, unit_cost, reference_id, created_by, notes, created_at)
        VALUES
          (${scrapWarehouseId}, ${materialId}, 'IN', ${failQty}, NULL, ${event.orderId}, NULL, ${notes}, NOW())
      `);

      // warehouse_stock UPSERT into the scrap warehouse — makes the brak visible in Brak Ombori.
      // Same idempotent ON CONFLICT (warehouse_id, material_id) UPSERT the PASS path uses
      // (execReceiveFg), mirrored onto the scrap warehouse.
      await runQuery(sql`
        INSERT INTO warehouse_stock
          (warehouse_id, material_id, quantity, reserved_quantity, available_quantity, last_updated_at, created_at, last_movement_at)
        VALUES
          (${scrapWarehouseId}, ${materialId}, ${failQty}, 0, ${failQty}, NOW(), NOW(), NOW())
        ON CONFLICT (warehouse_id, material_id)
        DO UPDATE SET
          quantity           = warehouse_stock.quantity + ${failQty},
          available_quantity = warehouse_stock.available_quantity + ${failQty},
          last_movement_at   = NOW(),
          last_updated_at    = NOW()
      `);

      this.logger.log(
        { orderId: event.orderId, materialId, qty: failQty, warehouseId: scrapWarehouseId },
        'QC failed → WMS: brak routed to scrap warehouse (wms_transactions IN + warehouse_stock UPSERT)',
      );
    }
  }
}
