/**
 * @module so-design-requested.listener
 * @description Source module. See exports for details.
 */

import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
export class SoDesignRequestedEvent {
  private readonly logger = new Logger(SoDesignRequestedEvent.name);

  constructor(readonly salesOrderId: number,
    readonly productId: number,
    readonly customerId: number) {}
}

@Injectable()
@EventsHandler(SoDesignRequestedEvent)
export class SoDesignRequestedListener implements IEventHandler<SoDesignRequestedEvent> {
  private readonly logger = new Logger(SoDesignRequestedListener.name);
  constructor() {}

  async handle(event: SoDesignRequestedEvent): Promise<void> {
    try {
      this.logger.log(
        { salesOrderId: event.salesOrderId, productId: event.productId },
        'SO design requested - Trigger 3: Design task created + Telegram');
    } catch (error: unknown) {
      this.logger.error(
        { error, salesOrderId: event.salesOrderId },
        'SO design requested listener error');
    }
  }
}
