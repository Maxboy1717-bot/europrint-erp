/**
 * @module qualify-lead.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { AppErr, Err, Ok, Result } from '@common/result';
import { ILeadRepository, LEAD_REPO } from '../../domain/repositories/i-lead.repo';

export class QualifyLeadCommand {
  constructor(public readonly leadId: number,
    public readonly expectedDealAmount: number,
    public readonly expectedClosureDate: Date) {}
}

@CommandHandler(QualifyLeadCommand)
export class QualifyLeadHandler implements ICommandHandler<QualifyLeadCommand> {
  private readonly logger = new Logger(QualifyLeadHandler.name);

  constructor(
    @Inject(LEAD_REPO) private readonly leadRepo: ILeadRepository,
  ) {}

  // Qualifying a lead ONLY transitions its status to 'qualified'. It does NOT create a
  // deal — a deal is created exclusively by convert (ConvertLeadToDealCommand). Owner
  // funnel: lead → qualified → ... → convert → deal; a qualified lead is still a hot lead,
  // not yet an opportunity. (Previously this handler auto-created a deal with
  // assignedTo = lead.getCompanyId() = 0 → crm_deals.assigned_by_id NOT NULL → 500.)
  async execute(command: QualifyLeadCommand): Promise<Result<number>> {
    const leadResult = await this.leadRepo.findById(command.leadId);
    if (!leadResult.ok || !leadResult.data) {
      return Err(AppErr('NOT_FOUND', 'Lead not found'));
    }
    const lead = leadResult.data;
    const qualifyResult = lead.qualify();
    if (!qualifyResult.ok) {
      return Err(AppErr('VALIDATION', qualifyResult.error?.message ?? 'Lead qualify failed'));
    }
    const updateResult = await this.leadRepo.update(lead);
    if (!updateResult.ok) {
      return Err(AppErr('INTERNAL', 'Failed to update lead'));
    }
    this.logger.log({ msg: 'Lead qualified', leadId: lead.getId() });
    return Ok(lead.getId());
  }
}
