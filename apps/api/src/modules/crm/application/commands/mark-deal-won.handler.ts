/**
 * @module mark-deal-won.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, BadRequestException, Logger } from '@nestjs/common';
import { Result, Ok, Err } from '@common/types/result.type';
import { IDealRepository } from '../../domain/repositories/i-deal.repo';
import { DealWonEvent } from '../../domain/events/deal-won.event';

export class MarkDealWonCommand {
  constructor(public readonly dealId: number) {}
}

@CommandHandler(MarkDealWonCommand)
export class MarkDealWonHandler implements ICommandHandler<MarkDealWonCommand> {
  private readonly logger = new Logger(MarkDealWonHandler.name);

  constructor(
    @Inject('IDealRepository') private readonly dealRepo: IDealRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: MarkDealWonCommand): Promise<Result<void>> {
    const dealResult = await this.dealRepo.findById(command.dealId);
    if (!dealResult.ok || !dealResult.data) {
      throw new BadRequestException('Deal not found');
    }

    const deal = dealResult.data;
    const winSuccess = deal.markAsWon();
    if (!winSuccess) {
      throw new BadRequestException('Failed to mark deal as won');
    }

    const updateResult = await this.dealRepo.update(deal);
    if (!updateResult.ok) {
      return Err('Failed to update deal');
    }

    const domainEvent = new DealWonEvent(
      deal.getId(),
      deal.getCompanyId(),
      deal.getTotalAmount(),
      deal.getAssignedTo(),
    );

    this.eventBus.publish(domainEvent);
    this.logger.log({ msg: 'Deal marked as won', dealId: command.dealId, amount: deal.getTotalAmount() });

    return Ok();
  }
}
