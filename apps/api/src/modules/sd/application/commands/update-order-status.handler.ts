/**
 * @module update-order-status.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Result, Ok, Err, AppErr } from '@common/result';
import { Inject, Logger } from '@nestjs/common';
import { ISalesOrderRepository, SALES_ORDER_REPO } from '../../domain/repositories/i-sales-order.repo';
import { OrderStatusChangedEvent } from '../../domain/events/order-status-changed.event';
import { AdvanceCheckFailedEvent } from '../../domain/events/advance-check-failed.event';

export class UpdateOrderStatusCommand {
  constructor(public readonly orderId: number,
    public readonly newStatus: string) {}
}

@CommandHandler(UpdateOrderStatusCommand)
export class UpdateOrderStatusHandler implements ICommandHandler<UpdateOrderStatusCommand> {
  private readonly logger = new Logger(UpdateOrderStatusHandler.name);
  constructor(
    @Inject(SALES_ORDER_REPO) private readonly orderRepo: ISalesOrderRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UpdateOrderStatusCommand): Promise<Result<void>> {
    const orderResult = await this.orderRepo.findById(command.orderId);
    if (!orderResult.ok || !orderResult.data) {
      return Err(AppErr('BAD_REQUEST', 'Order not found'));
    }

    const order = orderResult.data;

    // §8.1: Advance check fires BEFORE the transition so we can still surface
    // the original status to the AdvanceCheckFailedEvent payload.
    if (command.newStatus === 'ready_for_planning') {
      const advanceCheck = order.checkAdvanceAndBlock();
      if (advanceCheck.blocked) {
        const event = new AdvanceCheckFailedEvent(
          order.getId(),
          order.getAdvanceRequired(),
          order.getAdvancePaid(),
          advanceCheck.reason ?? '',
        );
        this.eventBus.publish(event);
        return Err(AppErr('FORBIDDEN', advanceCheck.reason ?? 'Avans tasdiqlanmagan'));
      }
    }

    // Aggregate guards the transition graph (§12) and applies the new status.
    const transition = order.transitionStatus(command.newStatus);
    if (!transition.ok) {
      const message = transition.error?.message ?? 'Invalid status transition';
      const code = message.startsWith('Cannot transition') ? 'FORBIDDEN' : 'BAD_REQUEST';
      return Err(AppErr(code, message));
    }

    const previousStatus = transition.data.previousStatus;

    const updateResult = await this.orderRepo.update(order);
    if (!updateResult.ok) {
      return Err(AppErr('INTERNAL', 'Failed to update order'));
    }

    const statusEvent = new OrderStatusChangedEvent(order.getId(), previousStatus, command.newStatus);
    this.eventBus.publish(statusEvent);

    this.logger.log({
      msg: 'Order status updated',
      orderId: command.orderId,
      from: previousStatus,
      to: command.newStatus,
    });

    return Ok(undefined);
  }
}
