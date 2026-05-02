import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { Result, Ok } from '@common/result';
import { CompleteDeliveryCommand } from './dispatch-delivery.command';
import { DeliveryCompletedEvent } from '../../domain/events';

@Injectable()
@CommandHandler(CompleteDeliveryCommand)
export class CompleteDeliveryHandler implements ICommandHandler<CompleteDeliveryCommand> {
  private readonly logger = new Logger(CompleteDeliveryHandler.name);

  constructor(
    private readonly eventBus: EventBus,
      ) {}

  async execute(command: CompleteDeliveryCommand): Promise<Result<string>> {
      this.eventBus.publish(new DeliveryCompletedEvent(command.deliveryId, command.orderId));

      this.logger.log(
        { deliveryId: command.deliveryId, orderId: command.orderId },
        'Delivery completed - Trigger 14: Signal to FI',
      );
      return Ok(command.deliveryId);
    
  }
}
