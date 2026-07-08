/**
 * @module mark-deal-lost.handler
 * @description CQRS handler — transitions a Deal to 'lost' with required reason.
 * Business invariants enforced inside Deal.markAsLost(); handler orchestrates only.
 */

import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { AppErr, Err, Ok, Result, isErr } from '@common/result';
import { IDealRepository, DEAL_REPO } from '../../domain/repositories/i-deal.repo';
import { DealLostEvent } from '../../domain/events/deal-lost.event';

export class MarkDealLostCommand {
  constructor(
    public readonly dealId: number,
    public readonly reason: string,
    // VISION-3340 #31 — optional structured loss-reason taxonomy id. When supplied it is
    // persisted to crm_deals.lost_reason_id (rollup/analytics); the free-text `reason`
    // above is unchanged (kept as a supplementary note + carried on DealLostEvent).
    public readonly lostReasonId?: number | null,
  ) {}
}

@CommandHandler(MarkDealLostCommand)
export class MarkDealLostHandler implements ICommandHandler<MarkDealLostCommand> {
  private readonly logger = new Logger(MarkDealLostHandler.name);

  constructor(
    @Inject(DEAL_REPO) private readonly dealRepo: IDealRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: MarkDealLostCommand): Promise<Result<void>> {
    const dealResult = await this.dealRepo.findById(command.dealId);
    if (isErr(dealResult) || !dealResult.data) {
      return Err(AppErr('NOT_FOUND', 'Deal not found'));
    }
    const deal = dealResult.data;

    const lostResult = deal.markAsLost(command.reason);
    if (!lostResult.ok) {
      return Err(AppErr('VALIDATION', lostResult.error?.message ?? 'Cannot mark deal as lost'));
    }

    const updateResult = await this.dealRepo.update(deal);
    if (isErr(updateResult)) {
      return Err(AppErr('INTERNAL', 'Failed to persist deal'));
    }

    // VISION-3340 #31: when a structured loss-reason is supplied, tag the deal with the
    // taxonomy FK (crm_deals.lost_reason_id). Omitted → column left untouched (NULL). The
    // won/lost transition above is unchanged; this is a supplementary, additive write.
    if (command.lostReasonId != null) {
      const reasonResult = await this.dealRepo.updateLostReasonId(command.dealId, command.lostReasonId);
      if (isErr(reasonResult)) {
        return Err(AppErr('INTERNAL', 'Failed to persist loss reason'));
      }
    }

    this.eventBus.publish(new DealLostEvent(
      deal.getId(), deal.getCompanyId(), deal.getTotalAmount(), deal.getAssignedTo(), command.reason,
    ));
    this.logger.log({ msg: 'Deal marked as lost', dealId: command.dealId, reason: command.reason });
    return Ok();
  }
}
