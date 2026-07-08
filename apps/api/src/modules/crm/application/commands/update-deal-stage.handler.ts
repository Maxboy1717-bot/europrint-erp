/**
 * @module update-deal-stage.handler
 * @description CQRS handler — sets a deal's stage_id. Thin wrapper over
 * ICrmDealsRepository.update so the controller can dispatch stage changes
 * through the CommandBus (PA1-11 — one path per write).
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { AppErr, Err, Ok, Result } from '@common/result';
import { CRM_DEALS_REPO, ICrmDealsRepository } from '../../deals/i-crm-deals.repo';

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

    return Ok(updated.data);
  }
}
