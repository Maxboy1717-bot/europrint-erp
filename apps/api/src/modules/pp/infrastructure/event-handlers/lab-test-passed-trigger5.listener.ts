/**
 * @module lab-test-passed-trigger5.listener
 * @description Wave 4 round-2 (PA2-18): canonical CQRS
 *   `@EventsHandler(LabTestPassedEvent)` form. Extracted from
 *   `design-lab-completed.listener.ts` so the Trigger 5 lab-side fan-in
 *   subscribes directly to the event class rather than the legacy
 *   `ERP_EVENTS.LAB_TEST_PASSED` string topic. The EventBridge still
 *   re-emits to the string topic for any non-migrated consumers — see
 *   EVENT_NAME_MAP entry in event-bridge.service.ts.
 *
 *   Trigger 5 — Design ✅ + Lab ✅ → PP (texnologga signal).
 *   ARCHITECTURE.md §10 #5
 *
 *   Note: today no command publishes `LabTestPassedEvent` on the CQRS bus;
 *   the listener is therefore a no-op at runtime until a publisher is
 *   wired — same dead-letter state as the legacy @OnEvent listener was
 *   previously in.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { LabTestPassedEvent } from '@modules/qc/domain/events';
import { DesignLabJoinService } from './design-lab-join.service';

@Injectable()
@EventsHandler(LabTestPassedEvent)
export class LabTestPassedTrigger5Listener
  implements IEventHandler<LabTestPassedEvent>
{
  private readonly logger = new Logger(LabTestPassedTrigger5Listener.name);

  constructor(private readonly join: DesignLabJoinService) {}

  async handle(event: LabTestPassedEvent): Promise<void> {
    const orderId = Number(event.orderId);
    if (!Number.isFinite(orderId)) {
      this.logger.warn(`Trigger 5 (lab): orderId yo'q (${String(event.orderId)})`);
      return;
    }
    await this.join.checkBothCompleted(orderId, 'lab');
  }
}
