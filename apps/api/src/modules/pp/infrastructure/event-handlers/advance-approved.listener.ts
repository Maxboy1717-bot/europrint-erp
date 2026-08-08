/**
 * @module advance-approved.listener
 * @description PA2-18 Wave 6: canonical CQRS @EventsHandler form. Reacts to
 *   `AdvanceApprovedEvent` (published by finance/tech-three-checkpoint.listener.ts)
 *   and unlocks PP planning for the order. Trigger 7.
 */

import { Injectable, Logger, Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { IPpRepository, PP_REPO } from '../../domain/repositories/pp.repository';
import { AdvanceApprovedEvent } from '@modules/finance/domain/events/advance-approved.event';

@Injectable()
@EventsHandler(AdvanceApprovedEvent)
export class AdvanceApprovedListener implements IEventHandler<AdvanceApprovedEvent> {
  private readonly logger = new Logger(AdvanceApprovedListener.name);

  constructor(@Inject(PP_REPO) private readonly ppRepo: IPpRepository) {}

  async handle(event: AdvanceApprovedEvent): Promise<void> {
    this.logger.log(
      { orderId: event.orderId, advancePct: event.advancePct },
      'Trigger 7: Advance approved — opening + unlocking PP planning',
    );

    // Golden-thread AUTO-path completion (buyurtma→ishlab-chiqarish). The advance-approval
    // path must first OPEN the production plan (idempotent — skips if one already exists),
    // THEN unlock it. Before this, Trigger 7 only ran unlockPlanning() which UPDATEs
    // production_orders by sales_order_id and matched 0 rows for a FRESH order (no PO yet)
    // → the order silently dead-ended. Only the MANUAL SalesOrderReadyPlanningListener
    // (OrderStatusChangedEvent) created the PO; the AUTOMATIC advance path did not. Now the
    // auto path opens the plan too — a confirmed+advance-paid order reaches production.
    const opened = await this.ppRepo.createPlanFromSalesOrder(event.orderId);
    if (!opened.ok) {
      this.logger.error(opened.error, 'Trigger 7: failed to open production plan from sales order');
    } else {
      this.logger.log(
        { orderId: event.orderId, opened: opened.data },
        'Trigger 7: production plan ensured (idempotent)',
      );
    }

    const result = await this.ppRepo.unlockPlanning(event.orderId);
    if (!result.ok) {
      this.logger.error(result.error, 'Failed to unlock planning');
    }
  }
}
