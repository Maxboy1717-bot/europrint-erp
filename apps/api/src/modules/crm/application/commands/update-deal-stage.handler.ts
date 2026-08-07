/**
 * @module update-deal-stage.handler
 * @description CQRS handler — sets a deal's stage_id. Thin wrapper over
 * ICrmDealsRepository.update so the controller can dispatch stage changes
 * through the CommandBus (PA1-11 — one path per write).
 */

import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { AppErr, Err, Ok, Result } from '@common/result';
import { CRM_DEALS_REPO, ICrmDealsRepository } from '../../deals/i-crm-deals.repo';
import { DealWonEvent } from '../../domain/events/deal-won.event';
import { isWonStage } from '../../domain/deal-stage-markers';

export class UpdateDealStageCommand {
  constructor(
    public readonly id: string,
    public readonly stageId: string,
  ) {}
}

@CommandHandler(UpdateDealStageCommand)
export class UpdateDealStageHandler implements ICommandHandler<UpdateDealStageCommand> {
  private readonly logger = new Logger(UpdateDealStageHandler.name);

  constructor(
    @Inject(CRM_DEALS_REPO) private readonly repo: ICrmDealsRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UpdateDealStageCommand): Promise<Result<Record<string, unknown>>> {
    this.logger.log({ msg: 'Updating deal stage', id: command.id, stageId: command.stageId });

    const existing = await this.repo.findById(command.id);
    if (!existing.ok) return Err(AppErr('INTERNAL', existing.error.message));
    if (!existing.data) return Err(AppErr('NOT_FOUND', `Deal #${command.id} topilmadi`));

    // VISION-3340 #34: capture the pre-update stage so the transition can be audited.
    const before = existing.data as Record<string, unknown>;
    const fromStage = before.stage_id != null ? String(before.stage_id) : null;

    const updated = await this.repo.update(command.id, { stage_id: command.stageId });
    if (!updated.ok) return Err(AppErr('INTERNAL', updated.error.message));

    // VISION-3340 #34: append a stage-change history row. Best-effort — the handler has no
    // surrounding transaction, so a history-write failure logs and is swallowed; it must never
    // roll back or fail the actual stage transition that already succeeded above.
    try {
      const hist = await this.repo.recordStageHistory({
        entityType: 'deal',
        entityId: command.id,
        fromStage,
        toStage: command.stageId,
        changedBy: null,
      });
      if (!hist.ok) {
        this.logger.warn({ msg: 'Deal stage history write failed', id: command.id, err: hist.error.message });
      }
    } catch (e) {
      this.logger.warn({ msg: 'Deal stage history write threw', id: command.id, err: String(e) });
    }

    // Audit 2026-08-06 (SD/CRM §5c): the Kanban board moves a deal by calling
    // PATCH /crm/deals/:id/stage — this handler — never POST /:id/won. So dragging a card
    // into the won column changed stage_id and nothing else: DealWonEvent was only ever
    // published by MarkDealWonHandler, which no frontend calls. The CRM→SD golden thread
    // (deal won → sales order) was therefore dead in the one path users actually take.
    //
    // Publish the same event here on a real not-won → won transition. Guarded three ways so
    // a re-drag or a board refresh cannot create a second sales order: the previous stage
    // must not already be won, and a deal that already carries sales_order_id is skipped.
    // The event, not this handler, owns SO creation — see the SD listener.
    const row = (updated.data ?? {}) as Record<string, unknown>;
    const alreadyLinked = (row['sales_order_id'] ?? before['sales_order_id']) != null;

    if (isWonStage(command.stageId) && !isWonStage(fromStage) && !alreadyLinked) {
      // Payload mirrors MarkDealWonHandler exactly — same numeric-id best effort, same
      // metadata.lead_id source (crm_deals.lead_id is a separate, unpopulated uuid column).
      const meta = (row['metadata'] ?? before['metadata'] ?? {}) as Record<string, unknown>;
      const leadIdRaw = Number(meta['lead_id']);
      const numericId = Number(before['id']);

      this.eventBus.publish(new DealWonEvent(
        Number.isFinite(numericId) ? numericId : 0,
        Number(row['company_id'] ?? before['company_id'] ?? 0),
        Number(row['amount'] ?? row['opportunity'] ?? before['amount'] ?? 0),
        Number(row['assigned_by_id'] ?? before['assigned_by_id'] ?? before['assigned_to'] ?? 0),
        String(row['currency_id'] ?? before['currency_id'] ?? before['currency'] ?? 'UZS'),
        command.id,
        Number.isInteger(leadIdRaw) && leadIdRaw > 0 ? leadIdRaw : undefined,
      ));
      this.logger.log({ msg: 'Deal won via stage move — DealWonEvent published', id: command.id, stageId: command.stageId });
    }

    return Ok(updated.data);
  }
}
