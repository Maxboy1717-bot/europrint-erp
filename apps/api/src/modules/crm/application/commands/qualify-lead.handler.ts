/**
 * @module qualify-lead.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { AppErr, Err, Ok, Result, isErr } from '@common/result';
import { ILeadRepository, LEAD_REPO } from '../../domain/repositories/i-lead.repo';
import { IDealRepository, DEAL_REPO } from '../../domain/repositories/i-deal.repo';
import { Deal } from '../../domain/aggregates/deal.aggregate';
import { Lead } from '../../domain/aggregates/lead.aggregate';
import { DealStatus } from '../../domain/value-objects/deal-status.vo';
import { Money } from 'shared/domain/value-objects/money.vo';

export class QualifyLeadCommand {
  private readonly logger = new Logger(QualifyLeadCommand.name);
  constructor(public readonly leadId: number,
    public readonly expectedDealAmount: number,
    public readonly expectedClosureDate: Date) {}
}

@CommandHandler(QualifyLeadCommand)
export class QualifyLeadHandler implements ICommandHandler<QualifyLeadCommand> {
  private readonly logger = new Logger(QualifyLeadHandler.name);

  constructor(
    @Inject(LEAD_REPO) private readonly leadRepo: ILeadRepository,
    @Inject(DEAL_REPO) private readonly dealRepo: IDealRepository,
  ) {}

  async execute(command: QualifyLeadCommand): Promise<Result<number>> {
    const leadR = await this.qualifyAndUpdateLead(command.leadId);
    if (isErr(leadR)) return Err(leadR.error);
    const dealR = this.buildDealFromLead(leadR.data, command);
    if (isErr(dealR)) return Err(dealR.error);
    return this.saveDeal(dealR.data, command.leadId);
  }

  private async qualifyAndUpdateLead(leadId: number) {
    const leadResult = await this.leadRepo.findById(leadId);
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
    return Ok(lead);
  }

  private buildDealFromLead(lead: Lead, command: QualifyLeadCommand): Result<Deal> {
    let money: Money;
    try {
      money = Money.of(command.expectedDealAmount, 'USD');
    } catch {
      return Err(AppErr('VALIDATION', 'Invalid deal amount'));
    }
    const statusResult = DealStatus.create('qualification');
    if (!statusResult.ok || !statusResult.data) {
      return Err(AppErr('VALIDATION', 'Invalid deal status'));
    }
    const deal = Deal.create({
      leadId: lead.getId(),
      companyId: lead.getCompanyId(),
      dealNumber: `DEAL-${Date.now()}`,
      status: statusResult.data,
      totalAmount: money,
      currency: 'USD',
      assignedTo: lead.getCompanyId(),
      createdBy: command.leadId,
      expectedClosureDate: command.expectedClosureDate,
    });
    return Ok(deal);
  }

  private async saveDeal(deal: Deal, leadId: number): Promise<Result<number>> {
    const dealResult = await this.dealRepo.save(deal);
    if (isErr(dealResult)) {
      this.logger.error({ msg: 'Failed to create deal', error: dealResult.error.message });
      return Err(AppErr('INTERNAL', 'Failed to create deal'));
    }
    this.logger.log({ msg: 'Lead qualified and deal created', leadId, dealId: dealResult.data.getId() });
    return Ok(dealResult.data.getId());
  }
}
