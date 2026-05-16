/**
 * @module mark-deal-won.handler
 * @description CQRS handler — transitions a Deal to 'won'. The business invariants
 * (only proposal/negotiation can convert; closedAt set; event emitted) live in
 * Deal.markAsWon(); this handler only orchestrates load → mutate → save → publish.
 */

import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { AppErr, Err, Ok, Result, isErr } from '@common/result';
import { IDealRepository } from '../../domain/repositories/i-deal.repo';
import { DealWonEvent } from '../../domain/events/deal-won.event';

export class MarkDealWonCommand {
  constructor(
    public readonly dealId: number,
    public readonly actualAmount?: number,
  ) {}
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
    if (isErr(dealResult) || !dealResult.data) {
      return Err(AppErr('NOT_FOUND', 'Deal not found'));
    }
    const deal = dealResult.data;

    const winResult = deal.markAsWon(command.actualAmount);
    if (!winResult.ok) {
      return Err(AppErr('VALIDATION', winResult.error?.message ?? 'Cannot mark deal as won'));
    }

    const updateResult = await this.dealRepo.update(deal);
    if (isErr(updateResult)) {
      return Err(AppErr('INTERNAL', 'Failed to persist deal'));
    }

    this.eventBus.publish(new DealWonEvent(
      deal.getId(), deal.getCompanyId(), deal.getTotalAmount(), deal.getAssignedTo(),
    ));
    this.logger.log({ msg: 'Deal marked as won', dealId: command.dealId, amount: deal.getTotalAmount() });
    return Ok();
  }
}
