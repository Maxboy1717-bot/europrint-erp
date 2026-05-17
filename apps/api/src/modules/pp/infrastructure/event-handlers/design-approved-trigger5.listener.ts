/**
 * @module design-approved-trigger5.listener
 * @description Wave 4 round-2 (PA2-18): canonical CQRS
 *   `@EventsHandler(DesignApprovedEvent)` form. Extracted from
 *   `design-lab-completed.listener.ts` so the Trigger 5 design-side fan-in
 *   subscribes directly to the event class rather than the legacy
 *   `ERP_EVENTS.DESIGN_APPROVED` string topic. The EventBridge still
 *   re-emits to the string topic for any non-migrated consumers — see
 *   EVENT_NAME_MAP entry in event-bridge.service.ts.
 *
 *   Trigger 5 — Design ✅ + Lab ✅ → PP (texnologga signal).
 *   ARCHITECTURE.md §10 #5
 *
 *   Note: today no command publishes `DesignApprovedEvent` on the CQRS bus;
 *   the listener is therefore a no-op at runtime until a publisher is
 *   wired — same dead-letter state as the legacy @OnEvent listener was
 *   previously in.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { DesignApprovedEvent } from '@modules/design/domain/events';
import { DesignLabJoinService } from './design-lab-join.service';

@Injectable()
@EventsHandler(DesignApprovedEvent)
export class DesignApprovedTrigger5Listener
  implements IEventHandler<DesignApprovedEvent>
{
  private readonly logger = new Logger(DesignApprovedTrigger5Listener.name);

  constructor(private readonly join: DesignLabJoinService) {}

  async handle(event: DesignApprovedEvent): Promise<void> {
    const orderId = Number(event.salesOrderId);
    if (!Number.isFinite(orderId)) {
      this.logger.warn(`Trigger 5 (design): salesOrderId yo'q (${String(event.salesOrderId)})`);
      return;
    }
    await this.join.checkBothCompleted(orderId, 'design');
  }
}
