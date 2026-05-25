/**
 * @module request-design.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Injectable, Logger, Inject } from '@nestjs/common';
import { Result, Ok } from '@common/result';
import { RequestDesignCommand } from './request-design.command';
import { DesignRequestedEvent } from '../../domain/events';
import { DesignOrder } from '../../domain/aggregates/design-order.aggregate';
import { ITelegramSender, TELEGRAM_SENDER } from '@modules/notifications/domain/ports/i-telegram-sender.port';

@Injectable()
@CommandHandler(RequestDesignCommand)
export class RequestDesignHandler implements ICommandHandler<RequestDesignCommand> {
  private readonly logger = new Logger(RequestDesignHandler.name);

  constructor(
    private readonly eventBus: EventBus,
    @Inject(TELEGRAM_SENDER) private readonly telegramService: ITelegramSender,
      ) {}

  async execute(command: RequestDesignCommand): Promise<Result<string>> {
      const design = DesignOrder.create(
        command.salesOrderId,
        command.productId,
        command.description,
        command.customerId,
      );

      // Send Telegram notification - Trigger 3
      await this.telegramService.sendAlert(
        'design_team',
        `New design task for order #${command.salesOrderId}. Product: ${command.productId}`,
      );

      this.eventBus.publish(
        new DesignRequestedEvent(design.id, design.salesOrderId, command.customerId),
      );

      this.logger.log(
        { designOrderId: design.id, salesOrderId: command.salesOrderId },
        'Design requested - Trigger 3: Telegram notification sent',
      );
      return Ok(design.id);
  }
}
