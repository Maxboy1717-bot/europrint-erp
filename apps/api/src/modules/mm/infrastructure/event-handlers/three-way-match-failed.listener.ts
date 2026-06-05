/**
 * @module three-way-match-failed.listener
 * @description Handles ThreeWayMatchFailedEvent — records the 3-way-match failure to hitl_approvals
 * (entity_type='three_way_match') so the Director/Purchase-manager dashboard surfaces the PO for review.
 */
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { ThreeWayMatchFailedEvent } from '../../domain/events/three-way-match-failed.event';

@EventsHandler(ThreeWayMatchFailedEvent)
export class ThreeWayMatchFailedListener implements IEventHandler<ThreeWayMatchFailedEvent> {
  private readonly logger = new Logger(ThreeWayMatchFailedListener.name);

  async handle(event: ThreeWayMatchFailedEvent): Promise<void> {
    try {
      const note = `3-tomonlama moslik buzildi — farq: ${event.difference}. Xarid menejer tasdig'i kerak.`;
      await db.execute(sql`
        INSERT INTO hitl_approvals (entity_type, entity_id, status, requested_by, notes, created_at, updated_at)
        VALUES ('three_way_match', ${String(event.poId)}, 'pending', NULL, ${note}, NOW(), NOW())`);
      this.logger.log(`3-way-match HITL recorded for PO ${event.poId} (diff ${event.difference})`);
    } catch (e) {
      this.logger.error(`3-way-match HITL insert failed for PO ${event.poId}: ${(e as Error).message}`);
    }
  }
}
