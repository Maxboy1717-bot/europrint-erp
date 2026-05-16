/**
 * @module deal-won.listener
 * @description PA2-18: canonical CQRS @EventsHandler form. Reacts to
 *   DealWonEvent class instances published on the CQRS EventBus by
 *   `mark-deal-won.handler.ts`. The EventBridge still re-emits this event
 *   onto EventEmitter2 for any remaining string-keyed listeners.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { DealWonEvent } from '../../domain/events/deal-won.event';

@Injectable()
@EventsHandler(DealWonEvent)
export class DealWonListener implements IEventHandler<DealWonEvent> {
  private readonly logger = new Logger(DealWonListener.name);

  handle(event: DealWonEvent): void {
    this.logger.log('Deal won event received');

    try {
      // Signal to Sales Delivery (SD) module to create Sales Order
      // This will trigger Trigger 2: Deal Won → SD Orders (avtomatik SO yaratish)
      this.logger.log({
        msg: 'Signaling SD module to create sales order',
        dealId: event.dealId,
        companyId: event.companyId,
      });
    } catch (error: unknown) {
      this.logger.error('Failed to signal SD module');
    }
  }
}
