/**
 * @module update-lead.handler
 * @description CQRS handler — partial-update of a Lead's contact / status fields.
 *
 * Wraps the existing CrmLeadsOpsRepository so the controller can route via
 * CommandBus (Sprint 2 A.3). This is a transitional handler: a future iteration
 * should decompose the generic "update any field" semantics into specific
 * domain commands (e.g. UpdateLeadContactInfo, ReassignLead, ChangeLeadSource)
 * each with proper invariants on the Lead aggregate.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { AppErr, Err, Ok, Result, isErr } from '@common/result';
import { CrmLeadsOpsRepository } from '../crm-leads-ops.repository';

export class UpdateLeadCommand {
  constructor(
    public readonly leadId: number,
    public readonly body: Record<string, unknown>,
  ) {}
}

@CommandHandler(UpdateLeadCommand)
export class UpdateLeadHandler implements ICommandHandler<UpdateLeadCommand> {
  private readonly logger = new Logger(UpdateLeadHandler.name);

  constructor(private readonly repo: CrmLeadsOpsRepository) {}

  async execute(command: UpdateLeadCommand): Promise<Result<Record<string, unknown>>> {
    const result = await this.repo.updateLead(command.leadId, command.body);
    if (isErr(result)) {
      return Err(AppErr('INTERNAL', `Failed to update lead: ${result.error.message}`));
    }
    const updated = result.data[0];
    if (!updated) return Err(AppErr('NOT_FOUND', `Lead ${command.leadId} not found`));
    this.logger.log({ msg: 'Lead updated', leadId: command.leadId });
    return Ok(updated);
  }
}
