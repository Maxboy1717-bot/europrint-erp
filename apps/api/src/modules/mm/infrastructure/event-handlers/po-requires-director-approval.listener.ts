/**
 * @module po-requires-director-approval.listener
 * @description Handles PoRequiresDirectorApprovalEvent — records the HITL requirement to hitl_approvals
 * so the Director dashboard (drizzle-dashboard-svc.repo reads hitl_approvals) surfaces the pending PO.
 */
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { PoRequiresDirectorApprovalEvent } from '../../domain/events/po-requires-director-approval.event';

@EventsHandler(PoRequiresDirectorApprovalEvent)
export class PoRequiresDirectorApprovalListener implements IEventHandler<PoRequiresDirectorApprovalEvent> {
  private readonly logger = new Logger(PoRequiresDirectorApprovalListener.name);

  async handle(event: PoRequiresDirectorApprovalEvent): Promise<void> {
    try {
      // Real action (not a no-op): persist the HITL approval request. entity_type/entity_id let the
      // director dashboard join back to the PO; status='pending' until approved.
      const note = `PO > 50M UZS (${event.totalAmount}) — direktor tasdig'i kerak`;
      await db.execute(sql`
        INSERT INTO hitl_approvals (entity_type, entity_id, status, requested_by, notes, created_at, updated_at)
        VALUES ('purchase_order', ${String(event.poId)}, 'pending', ${String(event.requestedBy)}, ${note}, NOW(), NOW())`);
      this.logger.log(`HITL approval recorded for PO ${event.poId} (${event.totalAmount} UZS)`);
    } catch (e) {
      this.logger.error(`HITL approval insert failed for PO ${event.poId}: ${(e as Error).message}`);
    }
  }
}
