/**
 * @module pp-released-mes.listener
 * @description #03 golden-thread HOP-2: the missing PP→MES link. On PpReleasedEvent (PP order released),
 *   open ONE MES production session for that production order — turning a released PO into shop-floor work
 *   automatically (was manual-only, no trigger). Mirrors the MM PpReleasedListener (Trigger 8) CQRS form.
 *   Canonical session table = `production_sessions` (mes_production_sessions is an auto-updatable VIEW over
 *   it — verified live). equipment_id/worker_id are NOT NULL with no FK, so a freshly-released PO opens a
 *   `pending` session with equipment_id=0/worker_id=0 (= "unassigned"); the operator sets real values +
 *   status 'in_progress' when they start on the IoT tablet. `pending` is the CANONICAL open-session status
 *   (matches the manual create path in mes-production-sessions.repo.ts + the GetSessionsDto enum + the
 *   production_sessions.status DB default) — so a PP-released session is identical to a manually-opened one
 *   and shows up in the standard MES session list. Idempotent: skips if an open session exists.
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
      // RULE4_EXCEPTION (Qoida 4): kept as raw SQL, not converted to Drizzle ORM. Two independent reasons:
      // 1) GENUINE COMPLEXITY — this is an atomic INSERT ... SELECT ... WHERE NOT EXISTS: it reads
      //    order_id (sales_order_id) + planned_quantity from production_orders AND, in the SAME statement,
      //    guards against a duplicate open session via a correlated NOT EXISTS subquery against
      //    production_sessions itself. Splitting this into two ORM calls (SELECT-check then INSERT) would
      //    reopen the TOCTOU race this NOT EXISTS guard exists to close (two concurrent PpReleasedEvent
      //    deliveries could both pass the check and both insert) — the exact idempotency property Trigger 9
      //    depends on (see module JSDoc). This mirrors the MM PpReleasedListener's documented Rule 4
      //    exemption for the same class of conditional-idempotent-insert problem.
      // 2) NO CLEAN SCHEMA MAPPING — the only Drizzle definition for this table
      //    (`productionSessions` in apps/api/src/shared/db/schema-compat-4.ts:140) is a stale/partial stub:
      //    it declares only id/productionOrderId(text)/sessionId/workCenterId/status/startedAt/endedAt/
      //    createdAt/operatorCardId and has NO `session_number`, `order_id`, `equipment_id`, `worker_id`, or
      //    `target_quantity` columns at all (the 5 fields this INSERT writes). Forcing an ORM rewrite would
      //    require inventing schema fields not declared anywhere — explicitly avoided per instructions.
      await db.execute(sql`
        INSERT INTO production_sessions
          (session_number, production_order_id, order_id, equipment_id, worker_id, status, target_quantity, started_at, created_at)
        SELECT ${`MES-PO${event.poId}`}, po.id, po.sales_order_id, 0, 0, 'pending',
               COALESCE(po.planned_quantity, 0)::int, NOW(), NOW()
        FROM production_orders po
        WHERE po.id = ${event.poId}
          AND NOT EXISTS (
            SELECT 1 FROM production_sessions s
            WHERE s.production_order_id = ${event.poId}
              AND s.status IN ('pending', 'in_progress', 'running', 'paused')
          )
      `);
      this.logger.log({ poId: event.poId }, 'HOP-2 ✅ PP released → MES session opened (mes_production_sessions)');
    } catch (err: unknown) {
      this.logger.error({ poId: event.poId, err: String(err) }, 'HOP-2: MES session open failed');
    }
  }
}
