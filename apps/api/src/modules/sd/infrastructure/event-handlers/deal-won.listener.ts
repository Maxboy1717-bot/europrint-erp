import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CommandBus } from '@nestjs/cqrs';
import { DealWonEvent } from '@modules/crm/domain/events/deal-won.event';
import { CreateOrderCommand } from '../../application/commands/create-order.handler';

@Injectable()
export class DealWonListener {
  private readonly logger = new Logger(DealWonListener.name);
  constructor(private readonly commandBus: CommandBus) {}

  @OnEvent('deal.won', { async: true })
  async handleDealWon(event: DealWonEvent) {
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
        'USD',
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
