/**
 * @module update-lead-stage.handler
 * @description CQRS handler — move a Lead to a different pipeline stage.
 * Validates stage existence first, then updates lead + records an activity note
 * (if notes provided).
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger, Inject } from '@nestjs/common';
import { AppErr, Err, Ok, Result, isErr } from '@common/result';
import { CRM_LEADS_OPS_REPO, type ICrmLeadsOpsRepo } from '../../domain/repositories/i-crm-leads-ops.repo';

export class UpdateLeadStageCommand {
  constructor(
    public readonly leadId: number,
    public readonly stageId: number,
    public readonly notes?: string,
  ) {}
}

@CommandHandler(UpdateLeadStageCommand)
export class UpdateLeadStageHandler implements ICommandHandler<UpdateLeadStageCommand> {
  private readonly logger = new Logger(UpdateLeadStageHandler.name);

  constructor(@Inject(CRM_LEADS_OPS_REPO) private readonly repo: ICrmLeadsOpsRepo) {}

  async execute(command: UpdateLeadStageCommand): Promise<Result<Record<string, unknown>>> {
    const stageR = await this.repo.findStage(command.stageId);
    if (isErr(stageR)) {
      return Err(AppErr('INTERNAL', `Stage lookup failed: ${stageR.error.message}`));
    }
    if (!stageR.data) {
      return Err(AppErr('NOT_FOUND', `Lead stage ${command.stageId} not found`));
    }

    const updateR = await this.repo.updateLeadStage(command.leadId, command.stageId);
    if (isErr(updateR)) {
      return Err(AppErr('INTERNAL', `Failed to update lead stage: ${updateR.error.message}`));
    }
    const updated = updateR.data[0];
    if (!updated) return Err(AppErr('NOT_FOUND', `Lead ${command.leadId} not found`));

    if (command.notes && command.notes.trim().length > 0) {
      await this.repo.insertActivityNote(command.leadId, command.notes);
    }
    this.logger.log({ msg: 'Lead stage updated', leadId: command.leadId, stageId: command.stageId });
    return Ok(updated);
  }
}
