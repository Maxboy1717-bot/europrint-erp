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

    const updated = await this.repo.update(command.id, { stage_id: command.stageId });
    if (!updated.ok) return Err(AppErr('INTERNAL', updated.error.message));

    return Ok(updated.data);
  }
}
