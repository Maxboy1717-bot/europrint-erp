/**
 * @module approve-tech-checkpoint.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { AppErr, Err, Ok, Result } from '@common/result';
import { ISalesOrderRepository, SALES_ORDER_REPO } from '../../domain/repositories/i-sales-order.repo';
import { TechThreeCheckpointEvent } from '../../../finance/domain/events/tech-three-checkpoint.event';

export class ApproveTechCheckpointCommand {
  private readonly logger = new Logger(ApproveTechCheckpointCommand.name);
  constructor(public readonly orderId: number,
    public readonly type: 'bom' | 'routing' | 'card') {}
}

@CommandHandler(ApproveTechCheckpointCommand)
export class ApproveTechCheckpointHandler implements ICommandHandler<ApproveTechCheckpointCommand> {
  private readonly logger = new Logger(ApproveTechCheckpointHandler.name);

  constructor(
    @Inject(SALES_ORDER_REPO) private readonly orderRepo: ISalesOrderRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ApproveTechCheckpointCommand): Promise<Result<void>> {
    const orderResult = await this.orderRepo.findById(command.orderId);
    if (!orderResult.ok || !orderResult.data) {
      return Err(AppErr('NOT_FOUND', 'Order not found'));
    }

    const order = orderResult.data;

    // §8.2: Approve individual checkpoints (BOM, Routing, TechCard)
    const checkpointResult = order.approveTechCheckpoint(command.type);
    if (!checkpointResult.ok) {
      return Err(AppErr('VALIDATION', checkpointResult.error?.message ?? 'Checkpoint approval failed'));
    }

    const updateResult = await this.orderRepo.update(order);
    if (!updateResult.ok) {
      return Err(AppErr('INTERNAL', 'Failed to update order'));
    }

    this.eventBus.publish({
      aggregateId: order.getId(),
      eventName: `TechCheckpoint${command.type.toUpperCase()}Approved`,
      timestamp: _time.now(),
    });

    // Trigger 6→7: all 3 tech checkpoints (BOM+Routing+Card) passed → publish the TYPED
    // TechThreeCheckpointEvent so the finance @EventsHandler(TechThreeCheckpointEvent) fires
    // (advance check → master_status='ready_for_planning' → AdvanceApprovedEvent → PP unlock).
    // Was a plain {eventName:'DesignAndLabCompleted'} object that the CQRS bus could not route
    // to any handler (no listener consumed that name) — the tech→advance→PP chain was dead.
    if (order.isThreeCheckpointPassed()) {
      this.eventBus.publish(new TechThreeCheckpointEvent({ orderId: order.getId() }));

      this.logger.log({
        msg: '3-checkpoint completed → TechThreeCheckpointEvent published (Trigger 6→7)',
        orderId: order.getId(),
      });
    }

    this.logger.log({
      msg: 'Tech checkpoint approved',
      orderId: command.orderId,
      type: command.type,
    });

    return Ok(undefined);
  }
}
