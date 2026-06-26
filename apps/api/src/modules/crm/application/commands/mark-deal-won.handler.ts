/**
 * @module mark-deal-won.handler
 * @description CQRS handler — transitions a Deal to 'won'.
 *
 * T18-C3-CRM-GATED: rewritten to be uuid-aware. Live `crm_deals.id` is a uuid
 * (a VIEW over `deals`); the previous numeric `IDealRepository` path produced
 * `Number(uuid) = NaN` and never matched a live row, so DealWonEvent never fired
 * and the CRM→SD golden thread (crm_deals.sales_order_id) stayed NULL. This now
 * uses the string-id `ICrmDealsRepository` and publishes DealWonEvent carrying
 * the real uuid (dealUuid) so the SD listener can link the created SO back.
 */

import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { AppErr, Err, Ok, Result } from '@common/result';
import { CRM_DEALS_REPO, ICrmDealsRepository } from '../../deals/i-crm-deals.repo';
import { DealWonEvent } from '../../domain/events/deal-won.event';

export class MarkDealWonCommand {
  constructor(
    public readonly dealId: string,
    public readonly actualAmount?: number,
  ) {}
}

// Live crm_deals carries business status in the free-form `stage_id`; a deal is
// already-terminal when stage_id is a won/lost marker. We block re-winning a
// lost deal but treat an already-won deal as idempotent success (no re-emit).
const LOST_MARKERS = ['lost', 'fail', 'c0:lose', 'lose'];
const WON_MARKERS = ['won', 'success', 'win', 'c0:win'];

function normalize(raw: unknown): string {
  return String(raw ?? '').trim().toLowerCase();
}

@CommandHandler(MarkDealWonCommand)
export class MarkDealWonHandler implements ICommandHandler<MarkDealWonCommand> {
  private readonly logger = new Logger(MarkDealWonHandler.name);

  constructor(
    @Inject(CRM_DEALS_REPO) private readonly dealRepo: ICrmDealsRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: MarkDealWonCommand): Promise<Result<{ id: string; status: string }>> {
    const found = await this.dealRepo.findById(command.dealId);
    if (!found.ok) return Err(AppErr('INTERNAL', found.error.message));
    if (!found.data) return Err(AppErr('NOT_FOUND', `Deal #${command.dealId} topilmadi`));

    const deal = found.data as Record<string, unknown>;
    const currentStage = normalize(deal['stage_id'] ?? deal['stage_semantic_id'] ?? deal['status']);

    if (LOST_MARKERS.includes(currentStage)) {
      return Err(AppErr('VALIDATION', `Cannot mark deal as won from terminal status '${currentStage}'`));
    }

    // Already won → idempotent: do not re-publish (the SO already exists/links).
    if (WON_MARKERS.includes(currentStage) || deal['sales_order_id'] != null) {
      this.logger.log({ msg: 'Deal already won — idempotent no-op', dealId: command.dealId });
      return Ok({ id: command.dealId, status: 'won' });
    }

    const patch: Record<string, unknown> = { stage_id: 'won', status: 'won' };
    if (command.actualAmount != null) patch.amount = command.actualAmount;

    const updated = await this.dealRepo.update(command.dealId, patch);
    if (!updated.ok) return Err(AppErr('INTERNAL', updated.error.message));

    const row = updated.data as Record<string, unknown>;
    const companyId = Number(row['company_id'] ?? deal['company_id'] ?? 0);
    const amount = Number(
      command.actualAmount ?? row['amount'] ?? row['opportunity'] ?? deal['amount'] ?? 0,
    );
    const assignedTo = Number(row['assigned_by_id'] ?? deal['assigned_by_id'] ?? deal['assigned_to'] ?? 0);
    const currency = String(row['currency_id'] ?? deal['currency_id'] ?? deal['currency'] ?? 'UZS');

    // dealId (numeric) is best-effort for the DomainEvent base; dealUuid is the
    // authoritative key the SD listener uses to write the SO link back.
    const numericId = Number(deal['id']);
    this.eventBus.publish(new DealWonEvent(
      Number.isFinite(numericId) ? numericId : 0,
      companyId,
      amount,
      assignedTo,
      currency,
      command.dealId,
    ));

    this.logger.log({ msg: 'Deal marked as won', dealId: command.dealId, amount });
    return Ok({ id: command.dealId, status: 'won' });
  }
}
