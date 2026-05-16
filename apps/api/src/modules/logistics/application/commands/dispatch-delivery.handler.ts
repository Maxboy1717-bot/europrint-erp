/**
 * @module dispatch-delivery.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Injectable, Logger, Inject } from '@nestjs/common';
import { Result, Ok } from '@common/result';
import { DispatchDeliveryCommand } from './dispatch-delivery.command';
import { DeliveryDispatchedEvent } from '../../domain/events';
import { ITelegramSender, TELEGRAM_SENDER } from '@modules/notifications/domain/ports/i-telegram-sender.port';

@Injectable()
@CommandHandler(DispatchDeliveryCommand)
export class DispatchDeliveryHandler implements ICommandHandler<DispatchDeliveryCommand> {
  private readonly logger = new Logger(DispatchDeliveryHandler.name);

  constructor(
    private readonly eventBus: EventBus,
    @Inject(TELEGRAM_SENDER) private readonly telegramService: ITelegramSender,
      ) {}

  async execute(command: DispatchDeliveryCommand): Promise<Result<string>> {
      // Send Telegram task to driver
      await this.telegramService.sendAlert(
        `driver_${command.driverId}`,
        `New delivery task for order #${command.orderId}. Check GPS for route.`,
      );

      this.eventBus.publish(
        new DeliveryDispatchedEvent(command.deliveryId, command.orderId, command.driverId),
      );

      this.logger.log(
        { deliveryId: command.deliveryId, orderId: command.orderId },
        'Delivery dispatched - Trigger 13',
      );
      return Ok(command.deliveryId);
    
  }
}
