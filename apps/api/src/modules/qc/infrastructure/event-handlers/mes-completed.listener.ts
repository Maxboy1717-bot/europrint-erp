/**
 * @module mes-completed.listener
 * @description CQRS @EventsHandler for MesCompletedEvent (Trigger 10): opens a PENDING QC inspection
 *   for the completed MES session. Was a NO-OP (it injected qcRepository but only logged + a "QC will be
 *   opened by PP callback" comment — nothing happened). Now it inserts a real qc_inspection.
 *
 *   NOTE: a direct insert (not qcRepository.save) is used on purpose — the aggregate save writes the
 *   aggregate's STRING id into qc_inspections.id, which is an INTEGER sequence (drift) and would fail.
 *   Here the sequence assigns the id and reference_id/reference_type link the inspection to the MES session.
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
      // order_id (integer) holds the completed MES session id — reference_id is a uuid column so the
      // numeric session id can't go there; reference_type='mes_session' clarifies the link.
      // inspector_id (integer) is left NULL — assigned later by a QC operator.
      await db.execute(sql`
        INSERT INTO qc_inspections (order_id, reference_type, status, items_checked, items_passed, items_failed, created_at, updated_at)
        VALUES (${event.sessionId}, 'mes_session', 'pending', 0, 0, 0, NOW(), NOW())`);
      this.logger.log(
        { sessionId: event.sessionId, timestamp: event.timestamp },
        'MES completed - Trigger 10: PENDING QC inspection opened',
      );
    } catch (error: unknown) {
      this.logger.error('MES completed listener error');
    }
  }
}
