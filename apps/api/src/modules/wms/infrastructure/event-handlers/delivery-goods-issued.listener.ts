/**
 * @module delivery-goods-issued.listener
 * @description Golden-thread SD→WMS EXTERNAL_OUT hop (VISION-3340 #51, "06-sd / 10-warehouse").
 *
 *   BEFORE this listener: when an SD delivery shipped, NOTHING linked the delivery to WMS stock —
 *   the shipped finished-goods quantity left the building but left NO stock trace, so the
 *   finished-goods warehouse balance never went down. The mirror-image FG-receipt path
 *   ({@link QcPassedListener} / {@link MesCompletedFgListener}) already ADDS the produced quantity
 *   into canonical finished-goods stock; this listener is the INVERSE — it SUBTRACTS the shipped
 *   quantity when the delivery reaches a post-goods-issue status.
 *
 *   TRIGGER: {@link DeliveryGoodsIssuedEvent}, published by DeliveriesService.updateStatus when a
 *   delivery transitions to a "left-the-warehouse" status (in_transit = on the truck, delivered =
 *   handed over). That is the correct ERP post-goods-issue moment for stock to leave — not delivery
 *   CREATE (a pending delivery has not shipped). For each finished-goods line of the delivery it:
 *     • writes an 'OUT' `wms_transactions` ledger row out of the finished-goods warehouse (the
 *       auditable EXTERNAL_OUT movement, traced by notes `Delivery-<id> EXTERNAL_OUT`, read by the
 *       dashboard movement KPIs) — the SAME canonical 'OUT' type the goods-issue path uses; and
 *     • decrements `warehouse_stock` for the shipped quantity, GUARDED so it can NEVER go below zero
 *       (mirrors the canonical `execIssueFromWarehouseStock` decrement — `available_quantity >= qty`;
 *       if stock is insufficient the UPDATE touches 0 rows, never writing a negative balance).
 *
 *   PARTIAL-QUANTITY (implemented): the shipped quantity per line is
 *   `picked_quantity` when > 0, else `delivery_quantity`, else 0 (= COALESCE(NULLIF(picked,0),
 *   delivery,0)). Lines whose shipped qty resolves to <= 0 or whose material_id is null are SKIPPED
 *   (no fabrication, Q-40). Empty delivery_items (build-phase: 0 rows) → clean no-op.
 *
 *   IDEMPOTENCY (no double-decrement): DeliveryGoodsIssuedEvent can fire more than once for the same
 *   delivery (a delivery re-transitioned pending→in_transit→delivered, an EventBridge re-emit, an
 *   at-least-once retry). A NOT-EXISTS guard on the finished-goods 'OUT' `wms_transactions` ledger
 *   keyed by (reference_id=deliveryId, material_id, warehouse_id, type='OUT') makes a second fire a
 *   no-op. The ledger row is written FIRST so a partial failure degrades to an under-count rather
 *   than a phantom double-out (no-double-decrement priority).
 *
 *   BEST-EFFORT / NON-FATAL (#22 listener resilience): the delivery status write already committed
 *   upstream; a failure to route the stock-out must NOT throw back to the event bus (which would
 *   abort sibling listeners + surface an unhandled rejection). All failures are caught + logged here.
 *
 * @layer Event Handler (WMS)
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { DeliveryGoodsIssuedEvent } from '../../../sd/domain/events/delivery-goods-issued.event';

/**
 * GATE 4/5 CUTOVER: this #51 delivery-based FG stock-out is DISABLED. Finished-goods stock now decrements
 * via the POS zayavka-fulfillment path (DeliveryRequestFulfillmentService.fulfillReal → warehouse_stock_fg).
 * The listener code is KEPT (not deleted) so the cutover is ONE-LINE reversible: flip this flag to false.
 * Gate 5 leaves it disabled.
 */
const DELIVERY_51_DISABLED = true;

/** One finished-goods line of the delivery — the shipped material + partial-qty inputs. */
interface DeliveryLineRow {
  /** finished-goods material shipped (delivery_items.material_id). */
  material_id: number | null;
  /** actually-picked quantity (preferred when > 0). */
  picked_quantity: number | string | null;
  /** planned delivery quantity (fallback when nothing picked). */
  delivery_quantity: number | string | null;
}

@Injectable()
@EventsHandler(DeliveryGoodsIssuedEvent)
export class DeliveryGoodsIssuedListener implements IEventHandler<DeliveryGoodsIssuedEvent> {
  private readonly logger = new Logger(DeliveryGoodsIssuedListener.name);

  async handle(event: DeliveryGoodsIssuedEvent): Promise<void> {
    // GATE 4/5 CUTOVER: FG stock-out is now handled by the POS zayavka-fulfillment path; this #51 listener
    // is disabled (kept for one-line reversibility — see DELIVERY_51_DISABLED). No-op + log, no decrement.
    if (DELIVERY_51_DISABLED) {
      this.logger.log(
        { deliveryId: event.deliveryId, salesOrderId: event.salesOrderId },
        'DeliveryGoodsIssuedListener DISABLED (Gate 4 cutover) — FG stock-out handled by zayavka fulfillment (warehouse_stock_fg)',
      );
      return;
    }

    this.logger.log(
      { deliveryId: event.deliveryId, salesOrderId: event.salesOrderId },
      'Delivery goods-issued - routing shipped quantity OUT of finished-goods warehouse',
    );

    // #22 listener resilience: the whole EXTERNAL_OUT flow is best-effort. The delivery status
    // write already committed upstream; a failure here must NOT throw back to the event bus.
    try {
      await this._issueDeliveryStock(event);
    } catch (error: unknown) {
      this.logger.error(
        {
          deliveryId: event.deliveryId,
          salesOrderId: event.salesOrderId,
          error: (error as Error)?.message ?? String(error),
        },
        'DeliveryGoodsIssuedListener: stock-out flow failed (golden-thread step SD delivery → WMS)',
      );
    }
  }

  private async _issueDeliveryStock(event: DeliveryGoodsIssuedEvent): Promise<void> {
    const deliveryId = Number(event.deliveryId);

    // Resolve the finished-goods warehouse — the ONLY place FG stock leaves from. NO fallback to a
    // default warehouse (Q-40): the stock-out lands against a real finished-goods warehouse or not
    // at all. Same resolution the FG-receipt siblings use.
    const whRows = await runQuery<{ id: number | null }>(sql`
      SELECT w.id FROM warehouses w
       WHERE w.type = 'finished_goods'
       ORDER BY w.id LIMIT 1
    `);
    const fgWarehouseId =
      Array.isArray(whRows.rows) && whRows.rows[0]?.id != null ? Number(whRows.rows[0].id) : 0;
    if (fgWarehouseId <= 0) {
      this.logger.warn(
        { deliveryId },
        'DeliveryGoodsIssuedListener: no finished-goods warehouse configured, skipping stock-out',
      );
      return;
    }

    // The shipped material(s) + partial-qty inputs come from the real delivery_items lines (raw SQL,
    // no Drizzle mapping — mirrors the sibling listeners). picked/delivery are read raw so the
    // partial rule (picked over delivery) is applied per line below.
    const lineRows = await runQuery<DeliveryLineRow>(sql`
      SELECT
        di.material_id       AS material_id,
        di.picked_quantity   AS picked_quantity,
        di.delivery_quantity AS delivery_quantity
      FROM delivery_items di
      WHERE di.delivery_id = ${deliveryId}
        AND di.material_id IS NOT NULL
    `);

    const lines = Array.isArray(lineRows.rows) ? lineRows.rows : [];
    if (lines.length === 0) {
      // Build-phase (0 rows) or a delivery with no FG lines → clean no-op (nothing shipped to route).
      this.logger.warn(
        { deliveryId },
        'DeliveryGoodsIssuedListener: no delivery_items lines for delivery, skipping stock-out',
      );
      return;
    }

    for (const line of lines) {
      const materialId = Number(line.material_id) || 0;
      if (materialId <= 0) continue;

      // Partial-qty rule: picked_quantity when > 0, else delivery_quantity, else 0
      // (= COALESCE(NULLIF(picked,0), delivery, 0)). NO fabrication (Q-40): a line that resolves to
      // <= 0 is skipped — never invented.
      const picked = line.picked_quantity != null ? Number(line.picked_quantity) : 0;
      const planned = line.delivery_quantity != null ? Number(line.delivery_quantity) : 0;
      const shippedQty =
        Number.isFinite(picked) && picked > 0
          ? picked
          : Number.isFinite(planned) && planned > 0
            ? planned
            : 0;
      if (shippedQty <= 0) continue;

      // Idempotency guard (no double-decrement): a finished-goods 'OUT' ledger row for this
      // delivery+material already exists → this fire is a re-emit/retry, no-op. Mirrors the
      // QcFailedFgListener dedup guard, narrowed to the finished-goods warehouse + 'OUT'.
      const dup = await runQuery<{ cnt: number }>(sql`
        SELECT COUNT(*)::int AS cnt
        FROM wms_transactions
        WHERE type = 'OUT'
          AND warehouse_id = ${fgWarehouseId}
          AND reference_id = ${deliveryId}
          AND material_id = ${materialId}
          AND deleted_at IS NULL
      `);
      const cnt = Array.isArray(dup.rows) && dup.rows[0] ? Number(dup.rows[0].cnt) : 0;
      if (cnt > 0) {
        this.logger.log(
          { deliveryId, materialId, warehouseId: fgWarehouseId },
          'DeliveryGoodsIssuedListener: stock-out already exists for this delivery+material (idempotent skip)',
        );
        continue;
      }

      // Ledger row FIRST: the idempotency guard above reads this row, so writing it first makes a
      // re-fire after a full success a clean no-op, and a partial failure (ledger ok, stock UPDATE
      // fails) degrades to an under-count rather than a phantom double-out. type='OUT' is the proven
      // canonical outbound ledger value (same as GoodsIssueHandler); the EXTERNAL_OUT semantics come
      // from the finished-goods warehouse_id + the `Delivery-<id> EXTERNAL_OUT` notes, not a new type.
      const notes = `Delivery-${deliveryId} EXTERNAL_OUT`;
      await runQuery(sql`
        INSERT INTO wms_transactions
          (warehouse_id, material_id, type, quantity, unit_cost, reference_id, created_by, notes, created_at)
        VALUES
          (${fgWarehouseId}, ${materialId}, 'OUT', ${shippedQty}, NULL, ${deliveryId}, NULL, ${notes}, NOW())
      `);

      // Guarded decrement — NEVER below zero. The `available_quantity >= ${shippedQty}` guard is the
      // inverse of the FG-receipt UPSERT: when stock is insufficient the UPDATE touches 0 rows (skip,
      // no negative), never fabricating a phantom negative balance.
      // Batch 3 Variant-2 split: finished-goods deliveries decrement warehouse_stock_fg (products.id-keyed),
      // NOT the raw warehouse_stock (material_cards.id). `materialId` here = delivery_items.material_id,
      // which lives in the products.id space (delivery_items.material_id -> products.id), so it maps to
      // warehouse_stock_fg.product_id directly. A non-FG id simply matches 0 rows (safe no-op).
      await runQuery(sql`
        UPDATE warehouse_stock_fg
        SET quantity           = quantity - ${shippedQty},
            available_quantity = available_quantity - ${shippedQty},
            last_movement_at   = NOW(),
            last_updated_at    = NOW()
        WHERE warehouse_id = ${fgWarehouseId}
          AND product_id = ${materialId}
          AND available_quantity >= ${shippedQty}
      `);

      this.logger.log(
        { deliveryId, materialId, qty: shippedQty, warehouseId: fgWarehouseId },
        'SD delivery → WMS: shipped quantity routed OUT of finished-goods stock (wms_transactions OUT + warehouse_stock decrement)',
      );
    }
  }
}
