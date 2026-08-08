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
    // T18-C3 (mirror of MarkDealWonCommand): live `crm_deals.id` is a uuid string.
    // dealId was `number` — Number(uuid)=NaN, so findById/update never matched a live
    // row and the deal could never transition to 'lost'. Threaded as a string end-to-end.
    public readonly dealId: string,
    public readonly reason: string,
    // VISION-3340 #31 — optional structured loss-reason taxonomy id. When supplied it is
    // persisted to crm_deals.lost_reason_id (rollup/analytics); the free-text `reason`
    // above is unchanged (kept as a supplementary note + carried on DealLostEvent).
    // Owner-gated (Guruh-B): the lost_reason_id column does not exist yet, so the live
    // controller route leaves this undefined and only the free-text lost_reason is written.
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

    // Arm 1 — persist the terminal transition + free-text reason by the real uuid.
    // Deal.getId() is Number(uuid)=NaN, so the aggregate cannot address the live row;
    // thread command.dealId (the uuid string) exactly as the won path does. Business
    // status lives in free-form stage_id; lost_reason is the real free-text column.
    const updateResult = await this.dealRepo.update(command.dealId, {
      stage_id: deal.getStatus(), // 'lost'
      lost_reason: command.reason,
    });
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

    // DealLostEvent.dealId is numeric (best-effort base — analytics/churn subscribers key
    // off companyId/reason). The aggregate id is Number(uuid)=NaN for a live uuid deal, so
    // fall back to 0 rather than emit NaN (mirrors the won handler's numericId guard).
    const numericId = Number.isFinite(deal.getId()) ? deal.getId() : 0;
    this.eventBus.publish(new DealLostEvent(
      numericId, deal.getCompanyId(), deal.getTotalAmount(), deal.getAssignedTo(), command.reason,
    ));
    this.logger.log({ msg: 'Deal marked as lost', dealId: command.dealId, reason: command.reason });
    return Ok();
  }
}
