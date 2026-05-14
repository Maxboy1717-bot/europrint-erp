/**
 * @module update-order-status.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Result, Ok, Err } from '@common/result';
import { Inject, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { SalesOrder } from '../../domain/aggregates/sales-order.aggregate';
import { ISalesOrderRepository } from '../../domain/repositories/i-sales-order.repo';
import { OrderStatusChangedEvent } from '../../domain/events/order-status-changed.event';
import { AdvanceCheckFailedEvent } from '../../domain/events/advance-check-failed.event';

// Valid state transitions (§12)
const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['pending_approval', 'cancelled'],
  pending_approval: ['approved', 'rejected', 'cancelled'],
  approved: ['pending_advance', 'on_hold', 'cancelled'],
  pending_advance: ['ready_for_planning', 'on_hold', 'cancelled'],
  ready_for_planning: ['in_planning', 'on_hold', 'cancelled'],
  in_planning: ['completed_planning', 'on_hold', 'cancelled'],
  completed_planning: ['ready_for_production', 'on_hold', 'cancelled'],
  ready_for_production: ['in_production', 'on_hold', 'cancelled'],
  in_production: ['ready_for_shipment', 'on_hold', 'cancelled'],
  ready_for_shipment: ['shipped', 'on_hold', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: ['closed', 'cancelled'],
  closed: [],
  cancelled: [],
  on_hold: ['pending_approval', 'pending_advance', 'ready_for_planning', 'cancelled'],
};

export class UpdateOrderStatusCommand {
  constructor(public readonly orderId: number,
    public readonly newStatus: string) {}
}

@CommandHandler(UpdateOrderStatusCommand)
export class UpdateOrderStatusHandler implements ICommandHandler<UpdateOrderStatusCommand> {
  private readonly logger = new Logger(UpdateOrderStatusHandler.name);
  constructor(
    @Inject('ISalesOrderRepository') private readonly orderRepo: ISalesOrderRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UpdateOrderStatusCommand): Promise<Result<void>> {
    const orderResult = await this.orderRepo.findById(command.orderId);
    if (!orderResult.ok || !(orderResult).data) {
      throw new BadRequestException('Order not found');
    }

    const order = (orderResult).data as SalesOrder & Record<string, unknown>;
    const currentStatus = order.getStatus();

    // Check valid transition
    if (!VALID_TRANSITIONS[currentStatus]?.includes(command.newStatus)) {
      throw new ForbiddenException(`Cannot transition from ${currentStatus} to ${command.newStatus}`);
    }

    // §8.1: If transitioning to ready_for_planning, check advance
    if (command.newStatus === 'ready_for_planning') {
      const advanceCheck = order.checkAdvanceAndBlock();
      if (advanceCheck.blocked) {
        const event = new AdvanceCheckFailedEvent(
          order.getId(),
          order['advanceRequired'],
          order['advancePaid'],
          advanceCheck.reason ?? '',
        );
        this.eventBus.publish(event);
        throw new ForbiddenException(advanceCheck.reason);
      }
    }

    const statusResult = order.updateStatus(command.newStatus);
    if (!statusResult.ok) {
      throw new BadRequestException(statusResult.error);
    }

    const updateResult = await this.orderRepo.update(order);
    if (!updateResult.ok) {
      return Err('Failed to update order');
    }

    const statusEvent = new OrderStatusChangedEvent(order.getId(), currentStatus, command.newStatus);
    this.eventBus.publish(statusEvent);

    this.logger.log({
      msg: 'Order status updated',
      orderId: command.orderId,
      from: currentStatus,
      to: command.newStatus,
    });

    return Ok(undefined);
  }
}
