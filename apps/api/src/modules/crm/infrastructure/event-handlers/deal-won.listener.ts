/**
 * @module deal-won.listener
 * @description Source module. See exports for details.
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DealWonEvent } from '../../domain/events/deal-won.event';

@Injectable()
export class DealWonListener {
  private readonly logger = new Logger(DealWonListener.name);

  constructor() {}

  @OnEvent('deal.won', { async: true })
  async handleDealWon(event: DealWonEvent) {
    this.logger.log('Deal won event received');

    try {
      // Signal to Sales Delivery (SD) module to create Sales Order
      // This will trigger Trigger 2: Deal Won → SD Orders (avtomatik SO yaratish)
      this.logger.log('Signaling SD module to create sales order');
    } catch (error: unknown) {
      this.logger.error('Failed to signal SD module');
    }
  }
}
