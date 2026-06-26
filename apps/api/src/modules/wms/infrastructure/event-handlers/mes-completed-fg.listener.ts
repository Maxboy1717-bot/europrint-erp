/**
 * @module mes-completed-fg.listener
 * @description Golden-thread MES→WMS FG hop (T7-14, EP-WMS-034 / EP-WMS-023).
 *
 *   VIZYON: "MES FG chiqarganda avtomatik FINISHED_GOODS ombori kirim" — a completed MES
 *   production session must land its produced quantity in the canonical finished-goods stock
 *   automatically, via a domain event (no manual step). Before this listener the ONLY path that
 *   produced an FG receipt was the QC-passed path (QcPassedListener → ReceiveFgCommand), which
 *   requires a MANUAL QC-inspector "pass" action — so in practice `wms_transactions` had ZERO
 *   'IN' rows (`wt_in = 0`) and the golden thread broke at the MES→WMS hop for every order.
 *
 *   This listener subscribes to {@link MesCompletedEvent} (Trigger 10, published by
 *   CompleteSessionHandler after commit) and auto-creates the FG receipt for the session's
 *   produced quantity by dispatching the SAME canonical {@link ReceiveFgCommand} the QC path uses
 *   (warehouse_stock UPSERT + atomic 'IN' wms_transactions ledger row + WmsFgReceivedEvent for the
 *   Trigger-12 rental timer). It does NOT bypass or duplicate the QC path — it fills the MES→WMS
 *   leg that had no listener at all.
 *
 *   IDEMPOTENCY (golden-thread requirement, no double-stocking): MesCompletedEvent can fire more
 *   than once for the same session (eventBus.publish + EventBridge re-emit to legacy @OnEvent, a
 *   session re-completed, an at-least-once delivery retry). The receipt is keyed by a
 *   session-traceable batch number `MES-<sessionId>`; a NOT-EXISTS guard on `wms_transactions`
 *   (batch_number) makes a second fire a no-op. Proven idempotent via rollback-tx DB-proof.
 *
 *   NO FABRICATION (Q-40): the FG material is resolved from the real production order
 *   (production_orders.product_id) and the produced quantity from the real session
 *   (actual_quantity / produced_qty). If the FG material is not yet a real warehouse material, the
 *   produced quantity is 0/missing, or no finished-goods warehouse exists, the receipt is SKIPPED
 *   with a warning — never invented. This mirrors QcPassedListener's skip-on-missing-data policy.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler, CommandBus } from '@nestjs/cqrs';
import { Result } from '@common/result';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { MesCompletedEvent } from '../../../mes/domain/events/mes-completed.event';
import { ReceiveFgCommand } from '../../application/commands/receive-fg.handler';

/** FG receipt inputs resolved from the completed session + its production order. */
interface FgReceiptLookupRow {
  /** finished-goods material (production_orders.product_id) — the produced item. */
  material_id: number | null;
  /** produced quantity (session actual_quantity / produced_qty). */
  produced_qty: number | null;
  /** finished-goods warehouse id (warehouses.type='finished_goods'). */
  warehouse_id: number | null;
  /** sales order the production order belongs to (attributes the FG + enables rental timer). */
  sales_order_id: number | null;
  /** 1 when an FG receipt for this session already exists (idempotency guard). */
  already_received: number;
}

@Injectable()
@EventsHandler(MesCompletedEvent)
export class MesCompletedFgListener implements IEventHandler<MesCompletedEvent> {
  private readonly logger = new Logger(MesCompletedFgListener.name);

  constructor(private readonly commandBus: CommandBus) {}

  async handle(event: MesCompletedEvent): Promise<void> {
    const batchNumber = `MES-${event.sessionId}`;

    // Resolve EVERYTHING the FG receipt needs from real rows, in ONE query:
    //  - the produced material = production_orders.product_id (the FG item)
    //  - the produced quantity  = session actual_quantity (fall back to produced_qty)
    //  - the finished-goods warehouse (the only place FG may be stocked / EXTERNAL_OUT from)
    //  - the sales order (for FG attribution + Trigger-12 rental timer)
    //  - whether an FG receipt for THIS session already exists (batch_number = 'MES-<sessionId>')
    // event.ppId is the production_order_id; the session is matched by id (canonical link).
    let rows: FgReceiptLookupRow[];
    try {
      const result = await runQuery<FgReceiptLookupRow>(sql`
        SELECT
          po.product_id                                              AS material_id,
          COALESCE(ps.actual_quantity, ps.produced_qty, 0)::int      AS produced_qty,
          (SELECT w.id FROM warehouses w
             WHERE w.type = 'finished_goods'
             ORDER BY w.id LIMIT 1)                                  AS warehouse_id,
          po.sales_order_id                                          AS sales_order_id,
          (SELECT COUNT(*) FROM wms_transactions wt
             WHERE wt.type = 'IN' AND wt.batch_number = ${batchNumber})::int AS already_received
        FROM production_sessions ps
        JOIN production_orders po ON po.id = ps.production_order_id
        WHERE ps.id = ${event.sessionId}
        LIMIT 1
      `);
      rows = Array.isArray(result.rows) ? result.rows : [];
    } catch (error: unknown) {
      // Q-40: surface failures — a broken lookup silently breaks the MES→WMS golden-thread hop.
      this.logger.error(
        { sessionId: event.sessionId, ppId: event.ppId, err: error instanceof Error ? error.message : String(error) },
        'MES→WMS FG listener: lookup FAILED — golden thread broken for this session',
      );
      return;
    }

    const info = rows[0];
    if (!info) {
      this.logger.warn(
        { sessionId: event.sessionId, ppId: event.ppId },
        'MES→WMS FG: session/production-order not found, skipping FG receipt',
      );
      return;
    }

    // Idempotency: a receipt for this session already exists → no-op (no double-stocking).
    if (Number(info.already_received) > 0) {
      this.logger.log(
        { sessionId: event.sessionId, ppId: event.ppId, batchNumber },
        'MES→WMS FG: receipt already exists for this session (idempotent skip)',
      );
      return;
    }

    const materialId = Number(info.material_id) || 0;
    const producedQty = Number(info.produced_qty) || 0;
    const warehouseId = Number(info.warehouse_id) || 0;
    const orderId = info.sales_order_id != null ? Number(info.sales_order_id) : undefined;

    // NO FABRICATION (Q-40): skip — never invent — when the FG material, produced quantity, or the
    // finished-goods warehouse is missing. A 0-qty / no-material receipt would only spawn a
    // meaningless empty stock row + event.
    if (materialId <= 0) {
      this.logger.warn(
        { sessionId: event.sessionId, ppId: event.ppId },
        'MES→WMS FG: production order has no product_id (FG material unknown), skipping FG receipt',
      );
      return;
    }
    if (producedQty <= 0) {
      this.logger.warn(
        { sessionId: event.sessionId, ppId: event.ppId },
        'MES→WMS FG: session produced 0 (no actual_quantity), skipping FG receipt',
      );
      return;
    }
    if (warehouseId <= 0) {
      this.logger.warn(
        { sessionId: event.sessionId, ppId: event.ppId },
        'MES→WMS FG: no finished-goods warehouse configured, skipping FG receipt',
      );
      return;
    }

    // Dispatch the SAME canonical command the QC path uses — warehouse_stock UPSERT + atomic 'IN'
    // wms_transactions ledger row + WmsFgReceivedEvent (Trigger 12 rental timer). batchNumber
    // 'MES-<sessionId>' is the idempotency key + traces the receipt back to the MES session.
    const result = await this.commandBus.execute<ReceiveFgCommand, Result<void>>(
      new ReceiveFgCommand(
        materialId,
        warehouseId,
        producedQty,
        batchNumber,
        null, // expiryDate — FG has no expiry by default
        orderId, // attributes the FG to the sales order + enables Trigger-12 rental timer
        undefined, // areaM2 — resolved inside the handler from material_cards
        null, // unitCost — MES path does not grade-price
        true, // T23-A1: cross-listener dedup — skip if QC already received FG for this order+material
      ),
    );

    if (!result.ok) {
      this.logger.error(
        { sessionId: event.sessionId, ppId: event.ppId, materialId, error: String(result.error) },
        'MES→WMS FG: ReceiveFgCommand failed — golden thread broken for this session',
      );
      return;
    }

    this.logger.log(
      { sessionId: event.sessionId, ppId: event.ppId, materialId, warehouseId, qty: producedQty, orderId, batchNumber },
      'Trigger 10 → FG: MES session completed → FG receipt UPSERTed to finished-goods stock (golden thread connected)',
    );
  }
}
