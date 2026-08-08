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

    // VISION-3340 #34: capture the lead's pre-update stage for the audit trail. This read is
    // history-support only — its failure must NOT block the transition (from_stage falls back
    // to null). Read BEFORE updateLeadStage so it reflects the prior stage, not the new one.
    let fromStage: string | null = null;
    const beforeR = await this.repo.getLeadStage(command.leadId);
    if (beforeR.ok) fromStage = beforeR.data;
    else this.logger.warn({ msg: 'Lead pre-update stage read failed', leadId: command.leadId, err: beforeR.error.message });

    const updateR = await this.repo.updateLeadStage(command.leadId, command.stageId);
    if (isErr(updateR)) {
      return Err(AppErr('INTERNAL', `Failed to update lead stage: ${updateR.error.message}`));
    }
    const updated = updateR.data[0];
    if (!updated) return Err(AppErr('NOT_FOUND', `Lead ${command.leadId} not found`));

    // VISION-3340 #34: append a stage-change history row. Best-effort — the handler has no
    // surrounding transaction, so a history-write failure logs and is swallowed; it must never
    // roll back or fail the actual stage transition that already succeeded above.
    try {
      const hist = await this.repo.recordStageHistory({
        entityType: 'lead',
        entityId: String(command.leadId),
        fromStage,
        toStage: String(command.stageId),
        changedBy: null,
      });
      if (!hist.ok) {
        this.logger.warn({ msg: 'Lead stage history write failed', leadId: command.leadId, err: hist.error.message });
      }
    } catch (e) {
      this.logger.warn({ msg: 'Lead stage history write threw', leadId: command.leadId, err: String(e) });
    }

    if (command.notes && command.notes.trim().length > 0) {
      await this.repo.insertActivityNote(command.leadId, command.notes);
    }
    this.logger.log({ msg: 'Lead stage updated', leadId: command.leadId, stageId: command.stageId });
    return Ok(updated);
  }
}
