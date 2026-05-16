/**
 * @module delete-lead.handler
 * @description CQRS handler — soft-existence-check + delete lead. Returns Err
 * NOT_FOUND if the lead doesn't exist so the controller can translate to 404.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger, Inject } from '@nestjs/common';
import { AppErr, Err, Ok, Result, isErr } from '@common/result';
import { CRM_LEADS_OPS_REPO, type ICrmLeadsOpsRepo } from '../../domain/repositories/i-crm-leads-ops.repo';

export class DeleteLeadCommand {
  constructor(public readonly leadId: number) {}
}

@CommandHandler(DeleteLeadCommand)
export class DeleteLeadHandler implements ICommandHandler<DeleteLeadCommand> {
  private readonly logger = new Logger(DeleteLeadHandler.name);

  constructor(@Inject(CRM_LEADS_OPS_REPO) private readonly repo: ICrmLeadsOpsRepo) {}

  async execute(command: DeleteLeadCommand): Promise<Result<{ deleted: true; id: number }>> {
    const existsR = await this.repo.leadExists(command.leadId);
    if (isErr(existsR)) {
      return Err(AppErr('INTERNAL', `Existence check failed: ${existsR.error.message}`));
    }
    if (!existsR.data) {
      return Err(AppErr('NOT_FOUND', `Lead ${command.leadId} not found`));
    }
    await this.repo.deleteLead(command.leadId);
    this.logger.log({ msg: 'Lead deleted', leadId: command.leadId });
    return Ok({ deleted: true as const, id: command.leadId });
  }
}
