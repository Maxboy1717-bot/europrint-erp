/**
 * @module mes-completed.listener
 * @description CQRS @EventsHandler for MesCompletedEvent (Trigger 10): opens a PENDING QC inspection
 *   for the completed MES session. Was a NO-OP (it injected qcRepository but only logged + a "QC will be
 *   opened by PP callback" comment — nothing happened). Now it inserts a real qc_inspection.
 *
 *   NOTE: a direct insert (not qcRepository.save) is used on purpose — the aggregate save writes the
 *   aggregate's STRING id into qc_inspections.id, which is an INTEGER sequence (drift) and would fail.
 *   Here the sequence assigns the id; order_id + reference_type='production_order' link the inspection to
 *   the real production order (event.ppId) so the QC work-list queries pick it up.
 */

import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { MesCompletedEvent } from '../../../mes/domain/events/mes-completed.event';

@Injectable()
@EventsHandler(MesCompletedEvent)
export class MesCompletedListener implements IEventHandler<MesCompletedEvent> {
  private readonly logger = new Logger(MesCompletedListener.name);

  async handle(event: MesCompletedEvent): Promise<void> {
    try {
      // GOLDEN-THREAD FIX (2026-06-19): link the inspection to the PRODUCTION ORDER (event.ppId), and
      // use reference_type='production_order' so the QC work-list queries actually pick it up
      // (drizzle-qc.repo.ts: `reference_type IN ('print_job','production_order')`). Previously this wrote
      // order_id=sessionId + reference_type='mes_session', so MES-originated inspections were created but
      // were INVISIBLE to every QC query — the chain broke silently here. inspector_id stays NULL
      // (assigned later by a QC operator).
      await db.execute(sql`
        INSERT INTO qc_inspections (order_id, reference_type, status, items_checked, items_passed, items_failed, created_at, updated_at)
        VALUES (${event.ppId}, 'production_order', 'pending', 0, 0, 0, NOW(), NOW())`);
      this.logger.log(
        { sessionId: event.sessionId, ppId: event.ppId, timestamp: event.timestamp },
        'MES completed - Trigger 10: PENDING QC inspection opened (linked to production order)',
      );
    } catch (error: unknown) {
      // Q-40: never swallow silently — a failed insert breaks the golden thread invisibly.
      this.logger.error(
        { sessionId: event.sessionId, ppId: event.ppId, err: error instanceof Error ? error.message : String(error) },
        'MES completed listener FAILED to open QC inspection — golden thread broken for this session',
      );
    }
  }
}
