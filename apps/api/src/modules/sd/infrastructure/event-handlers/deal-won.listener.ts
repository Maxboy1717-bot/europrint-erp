/**
 * @module deal-won.listener
 * @description PA2-18: canonical CQRS @EventsHandler form. When CRM publishes
 *   DealWonEvent (Trigger 2), the SD module dispatches CreateOrderCommand to
 *   auto-create a sales order. Published via `eventBus.publish` in
 *   `mark-deal-won.handler.ts`.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler, CommandBus } from '@nestjs/cqrs';
import { DealWonEvent } from '@modules/crm/domain/events/deal-won.event';
import { CreateOrderCommand } from '../../application/commands/create-order.handler';

@Injectable()
@EventsHandler(DealWonEvent)
export class DealWonListener implements IEventHandler<DealWonEvent> {
  private readonly logger = new Logger(DealWonListener.name);
  constructor(private readonly commandBus: CommandBus) {}

  async handle(event: DealWonEvent): Promise<void> {
    this.logger.log({
      msg: 'Deal won event received in SD module - Trigger 2',
      dealId: event.dealId,
      companyId: event.companyId,
      totalAmount: event.totalAmount,
    });

    try {
      // Avtomatik SO yaratish
      const command = new CreateOrderCommand(
        event.companyId,
        event.totalAmount,
        event.currency ?? 'UZS',
        false,
        false,
        event.assignedTo,
        event.dealId,
      );

      const result = await this.commandBus.execute(command);

      if (result.ok) {
        this.logger.log({
          msg: 'Sales order automatically created from deal',
          dealId: event.dealId,
          orderId: (result).data?.getId(),
        });
      } else {
        this.logger.error({
          msg: 'Failed to create sales order from deal',
          dealId: event.dealId,
          error: result.error,
        });
      }
    } catch (error: unknown) {
      this.logger.error({
        msg: 'Exception while handling deal won event',
        dealId: event.dealId,
        error: (error as Error).message,
      });
    }
  }
}
