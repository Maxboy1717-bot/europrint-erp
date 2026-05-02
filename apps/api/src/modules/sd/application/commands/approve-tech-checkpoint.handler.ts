import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { AppErr, Err, Ok, Result } from '@common/result';
import { ISalesOrderRepository } from '../../domain/repositories/i-sales-order.repo';

export class ApproveTechCheckpointCommand {
  private readonly logger = new Logger(ApproveTechCheckpointCommand.name);
  constructor(public readonly orderId: number,
    public readonly type: 'bom' | 'routing' | 'card') {}
}

@CommandHandler(ApproveTechCheckpointCommand)
export class ApproveTechCheckpointHandler implements ICommandHandler<ApproveTechCheckpointCommand> {
  private readonly logger = new Logger(ApproveTechCheckpointHandler.name);

  constructor(
    @Inject('ISalesOrderRepository') private readonly orderRepo: ISalesOrderRepository,
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

    // If all 3 checkpoints passed → Trigger 5: emit DesignAndLabCompleted → PP signal
    if (order.isThreeCheckpointPassed()) {
      this.eventBus.publish({
        aggregateId: order.getId(),
        eventName: 'DesignAndLabCompleted',
        timestamp: _time.now(),
        data: { orderId: order.getId() },
      });

      this.logger.log({
        msg: '3-checkpoint completed, signaling PP module',
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
