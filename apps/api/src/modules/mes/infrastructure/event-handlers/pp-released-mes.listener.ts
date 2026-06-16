/**
 * @module pp-released-mes.listener
 * @description #03 golden-thread HOP-2: the missing PP→MES link. On PpReleasedEvent (PP order released),
 *   open ONE MES production session for that production order — turning a released PO into shop-floor work
 *   automatically (was manual-only, no trigger). Mirrors the MM PpReleasedListener (Trigger 8) CQRS form.
 *   Canonical session table = `production_sessions` (mes_production_sessions is an auto-updatable VIEW over
 *   it — verified live). equipment_id/worker_id are NOT NULL with no FK, so a freshly-released PO opens a
 *   PENDING session with equipment_id=0/worker_id=0 (= "unassigned"); the operator sets real values +
 *   status 'in_progress' when they start on the IoT tablet. Idempotent: skips if an open session exists.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { PpReleasedEvent } from '@modules/pp/domain/events/pp-released.event';

@Injectable()
@EventsHandler(PpReleasedEvent)
export class PpReleasedMesListener implements IEventHandler<PpReleasedEvent> {
  private readonly logger = new Logger(PpReleasedMesListener.name);

  async handle(event: PpReleasedEvent): Promise<void> {
    try {
      // Open a session keyed to the production order; carry the sales order id (order_id) + planned qty
      // from production_orders. NOT EXISTS guard = idempotent (no duplicate open session per PO, Trigger 9).
      await db.execute(sql`
        INSERT INTO production_sessions
          (session_number, production_order_id, order_id, equipment_id, worker_id, status, target_quantity, started_at, created_at)
        SELECT ${`MES-PO${event.poId}`}, po.id, po.sales_order_id, 0, 0, 'created',
               COALESCE(po.planned_quantity, 0)::int, NOW(), NOW()
        FROM production_orders po
        WHERE po.id = ${event.poId}
          AND NOT EXISTS (
            SELECT 1 FROM production_sessions s
            WHERE s.production_order_id = ${event.poId} AND s.status IN ('created', 'in_progress')
          )
      `);
      this.logger.log({ poId: event.poId }, 'HOP-2 ✅ PP released → MES session opened (mes_production_sessions)');
    } catch (err: unknown) {
      this.logger.error({ poId: event.poId, err: String(err) }, 'HOP-2: MES session open failed');
    }
  }
}
