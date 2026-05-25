/**
 * @module advance-bypass-approved.listener
 * @description PA2-18: canonical CQRS @EventsHandler form. Trigger 20 —
 *   director-side audit listener.
 *
 * When the SD module approves an advance-payment bypass
 * (approve-advance-bypass.handler.ts publishes AdvanceBypassApprovedEvent
 * via the CQRS event bus), record an audit entry. Today this is
 * structured-log only because the director module does not yet expose a
 * generic audit-write repository; once one exists, replace the Logger call
 * with a persisted audit-trail write.
 *
 * TODO PA0: Replace Logger-only audit with a persisted entry in
 *           director_audit (or shared audit_trail) once the repo lands.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { AdvanceBypassApprovedEvent } from '@modules/sd/domain/events/advance-bypass-approved.event';

@Injectable()
@EventsHandler(AdvanceBypassApprovedEvent)
export class AdvanceBypassApprovedListener implements IEventHandler<AdvanceBypassApprovedEvent> {
  private readonly logger = new Logger(AdvanceBypassApprovedListener.name);

  async handle(event: AdvanceBypassApprovedEvent): Promise<void> {
    this.logger.warn({
      msg: 'Trigger 20: advance bypass approved — director audit',
      orderId: event.orderId,
      bypassBy: event.bypassBy,
      reason: event.reason,
      timestamp: event.occurredAt.toISOString(),
    });
  }
}
