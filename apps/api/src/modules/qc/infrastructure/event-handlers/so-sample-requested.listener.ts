/**
 * @module so-sample-requested.listener
 * @description Source module. See exports for details.
 */

import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
export class SoSampleRequestedEvent {
  private readonly logger = new Logger(SoSampleRequestedEvent.name);

  constructor(readonly orderId: number,
    readonly sampleCode: string,
    readonly quantity: number) {}
}

@Injectable()
@EventsHandler(SoSampleRequestedEvent)
export class SoSampleRequestedListener implements IEventHandler<SoSampleRequestedEvent> {
  private readonly logger = new Logger(SoSampleRequestedListener.name);
  constructor() {}

  async handle(event: SoSampleRequestedEvent): Promise<void> {
    try {
      this.logger.log(
        { orderId: event.orderId, sampleCode: event.sampleCode },
        'SO sample requested - Trigger 4: Lab test created');
      // Lab test creation logic
    } catch (error: unknown) {
      this.logger.error(
        { error, orderId: event.orderId },
        'SO sample requested listener error');
    }
  }
}
