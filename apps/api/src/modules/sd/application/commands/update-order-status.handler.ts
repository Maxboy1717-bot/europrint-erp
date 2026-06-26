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
import { OutboxRepository } from '../../../shared/outbox/outbox.repository';
import { ERP_EVENTS } from '@common/constants/erp-events.constants';
import { db } from '@shared/db';

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
    private readonly outboxRepo: OutboxRepository,
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

    // A43 — golden-thread durability. The status UPDATE and the
    // `sd.order.status_changed` outbox row commit in ONE transaction (mirrors
    // create-order.handler PA0-6). Before this, the status change reached
    // `domain_events` only via the in-memory EventBus, so a crash after the DB
    // commit lost the SD→PP trigger entirely and downstream replay keyed on the
    // canonical `sd.order.status_changed` name saw nothing. With the atomic
    // insert, every real order that transitions to `ready_for_planning` durably
    // drives the PP listener (outbox publisher re-emits on its tick).
    try {
      await db.transaction(async (tx) => {
        const updateResult = await this.orderRepo.update(order, tx);
        if (!updateResult.ok) {
          // Throw to roll back: status write and outbox insert are all-or-nothing.
          throw new Error(updateResult.error?.message ?? 'Failed to update order');
        }

        const outboxInsert = await this.outboxRepo.insertBatch(
          [
            {
              aggregate_type: 'SalesOrder',
              aggregate_id: String(order.getId()),
              event_name: ERP_EVENTS.ORDER_STATUS_CHANGED,
              payload: {
                orderId: order.getId(),
                previousStatus,
                newStatus: command.newStatus,
              },
            },
          ],
          tx,
        );
        if (!outboxInsert.ok) {
          throw new Error(outboxInsert.error.message);
        }
      });
    } catch (err) {
      const message = (err as Error)?.message ?? 'Transaction failed';
      this.logger.error({ msg: 'Order status update transaction rolled back', orderId: command.orderId, error: message });
      return Err(AppErr('INTERNAL', 'Failed to update order'));
    }

    // Direct in-process publish (Q-46): in-memory @OnEvent / CQRS listeners fire
    // immediately. The durable row above guarantees the outbox publisher re-emits
    // on its tick too; downstream handlers are idempotent (PP skips if a PO
    // already references the sales order).
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
