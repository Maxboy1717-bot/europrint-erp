/**
 * @module approve-advance-bypass.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { AppErr, Err, Ok, Result } from '@common/result';
import { ISalesOrderRepository } from '../../domain/repositories/i-sales-order.repo';

export class ApproveAdvanceBypassCommand {
  private readonly logger = new Logger(ApproveAdvanceBypassCommand.name);
  constructor(public readonly orderId: number,
    public readonly bypassBy: number,
    public readonly reason: string) {}
}

@CommandHandler(ApproveAdvanceBypassCommand)
export class ApproveAdvanceBypassHandler implements ICommandHandler<ApproveAdvanceBypassCommand> {
  private readonly logger = new Logger(ApproveAdvanceBypassHandler.name);

  constructor(
    @Inject('ISalesOrderRepository') private readonly orderRepo: ISalesOrderRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ApproveAdvanceBypassCommand): Promise<Result<void>> {
    // §20: Reason is MANDATORY
    if (!command.reason || command.reason.trim().length === 0) {
      return Err(AppErr('VALIDATION', 'Bypass reason is mandatory'));
    }

    const orderResult = await this.orderRepo.findById(command.orderId);
    if (!orderResult.ok || !orderResult.data) {
      return Err(AppErr('NOT_FOUND', 'Order not found'));
    }

    const order = orderResult.data;

    // §8.1: Bypass advance
    const bypassResult = order.bypassAdvance(command.bypassBy, command.reason);
    if (!bypassResult.ok) {
      return Err(AppErr('VALIDATION', bypassResult.error?.message ?? 'Bypass advance failed'));
    }

    const updateResult = await this.orderRepo.update(order);
    if (!updateResult.ok) {
      return Err(AppErr('INTERNAL', 'Failed to update order'));
    }

    this.eventBus.publish({
      aggregateId: order.getId(),
      eventName: 'AdvanceBypassApproved',
      timestamp: _time.now(),
      data: {
        orderId: order.getId(),
        bypassBy: command.bypassBy,
        reason: command.reason,
      },
    });

    // §20: Audit log
    this.logger.log({
      msg: 'Advance bypass approved',
      orderId: command.orderId,
      bypassBy: command.bypassBy,
      reason: command.reason,
      timestamp: _time.now().toISOString(),
    });

    return Ok(undefined);
  }
}
