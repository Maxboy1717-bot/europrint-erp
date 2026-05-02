import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { AppErr, Err, Ok, Result } from '@common/result';
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { UpdateDesignStatusCommand } from './update-design-status.command';
import { DesignOrder } from '../../domain/aggregates/design-order.aggregate';
import { IDesignRepo, DESIGN_REPO } from '../../domain/repositories/i-design.repo';
import { isTransitionAllowed, DESIGN_TRANSITIONS } from '@common/constants/status-machines.constants';

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
      this.logger.error(
        { from: designOrder.status, to: command.status },
        'Invalid status transition',
      );
      return Err(`Cannot transition from ${designOrder.status} to ${command.status}`);
    }

    designOrder.status = command.status as typeof designOrder.status;
    designOrder.updatedAt = _time.now();

    if (command.files && command.files.length > 0) {
      designOrder.aiGeneratedDesign = command.files.join(',');
    }

    if (command.status === 'completed') {
      designOrder.approvedAt = _time.now();
    }

    const result = await this.designRepo.update(command.id, designOrder);

    if (!result.ok) {
      this.logger.error('Failed to update design order');
      return Err(result.error ?? 'Failed to update design order');
    }

    this.logger.log(
      { id: command.id, status: command.status },
      'Design order status updated',
    );

    return Ok(result.data);
  }
}
