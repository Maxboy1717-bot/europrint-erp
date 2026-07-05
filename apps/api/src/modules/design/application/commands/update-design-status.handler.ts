/**
 * @module update-design-status.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { AppErr, Err, Ok, Result } from '@common/result';
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { UpdateDesignStatusCommand } from './update-design-status.command';
import { DesignOrder } from '../../domain/aggregates/design-order.aggregate';
import { IDesignRepo, DESIGN_REPO } from '../../domain/repositories/i-design.repo';
import { isTransitionAllowed, DESIGN_TRANSITIONS } from '@common/constants/status-machines.constants';
import { DesignStatus } from '../../domain/enums/design-status.enum';
import { DesignApprovedEvent } from '../../domain/events';

@Injectable()
@CommandHandler(UpdateDesignStatusCommand)
export class UpdateDesignStatusHandler implements ICommandHandler<UpdateDesignStatusCommand> {
  private readonly logger = new Logger(UpdateDesignStatusHandler.name);

  constructor(
    @Inject(DESIGN_REPO) private readonly designRepo: IDesignRepo,
    private readonly eventBus: EventBus,
      ) {}

  async execute(command: UpdateDesignStatusCommand): Promise<Result<DesignOrder>> {
    const existing = await this.designRepo.findById(command.id);
    if (!existing.ok || !existing.data) {
      this.logger.error('Design order not found');
      return Err(AppErr('NOT_FOUND', 'Design order not found'));
    }
    const designOrder = existing.data;
    if (!isTransitionAllowed(DESIGN_TRANSITIONS, designOrder.status, command.status)) {
      this.logger.error({ from: designOrder.status, to: command.status }, 'Invalid status transition');
      return Err(`Cannot transition from ${designOrder.status} to ${command.status}`);
    }
    this.applyStatusChanges(designOrder, command);
    const result = await this.persistUpdate(command, designOrder);
    // Trigger 5: design approved → publish the typed DesignApprovedEvent so the PP
    // DesignApprovedTrigger5Listener fires (design+lab join → sales_orders.master_status=
    // 'pending_technology' once design is approved and the order needs no lab sample).
    // Was never published, so Trigger 5 (design side) was a dead listener.
    if (result.ok && command.status === DesignStatus.APPROVED) {
      this.eventBus.publish(new DesignApprovedEvent(designOrder.id, designOrder.salesOrderId));
    }
    return result;
  }

  private applyStatusChanges(designOrder: DesignOrder, command: UpdateDesignStatusCommand): void {
    designOrder.status = command.status as typeof designOrder.status;
    designOrder.updatedAt = _time.now();
    if (command.files && command.files.length > 0) {
      designOrder.aiGeneratedDesign = command.files.join(',');
    }
    // A8 fix (2026-07-05): was checking the OLD status vocabulary's terminal state
    // ('completed'), which no longer exists in DesignStatus/DESIGN_TRANSITIONS
    // (terminal state is now 'approved') -- approvedAt was silently never stamped.
    if (command.status === DesignStatus.APPROVED) {
      designOrder.approvedAt = _time.now();
    }
  }

  private async persistUpdate(command: UpdateDesignStatusCommand, designOrder: DesignOrder): Promise<Result<DesignOrder>> {
    const result = await this.designRepo.update(command.id, designOrder);
    if (!result.ok) {
      this.logger.error('Failed to update design order');
      return Err(result.error ?? 'Failed to update design order');
    }
    this.logger.log({ id: command.id, status: command.status }, 'Design order status updated');
    return Ok(result.data);
  }
}
