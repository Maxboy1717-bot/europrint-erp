/**
 * @module qualify-lead.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { AppErr, Err, Ok, Result, isErr } from '@common/result';
import { ILeadRepository } from '../../domain/repositories/i-lead.repo';
import { IDealRepository } from '../../domain/repositories/i-deal.repo';
import { Deal, DealCreateProps } from '../../domain/aggregates/deal.aggregate';
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
    @Inject('ILeadRepository') private readonly leadRepo: ILeadRepository,
    @Inject('IDealRepository') private readonly dealRepo: IDealRepository,
  ) {}

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

    let money: Money;
    try {
      money = Money.of(command.expectedDealAmount, 'USD');
    } catch {
      return Err(AppErr('VALIDATION', 'Invalid deal amount'));
    }

    const statusResult = DealStatus.create('qualification');
    if (!statusResult.ok) {
      return Err(AppErr('VALIDATION', 'Invalid deal status'));
    }

    const deal = Deal.create({
      leadId: lead.getId(),
      companyId: lead.getCompanyId(),
      dealNumber: `DEAL-${Date.now()}`,
      status: (statusResult).data,
      totalAmount: money,
      currency: 'USD',
      assignedTo: lead.getCompanyId(),
      createdBy: command.leadId,
      expectedClosureDate: command.expectedClosureDate,
    });

    const dealResult = await this.dealRepo.save(deal);
    if (isErr(dealResult)) {
      this.logger.error({ msg: 'Failed to create deal', error: dealResult.error.message });
      return Err(AppErr('INTERNAL', 'Failed to create deal'));
    }

    this.logger.log({ msg: 'Lead qualified and deal created', leadId: command.leadId, dealId: dealResult.data.getId() });
    return Ok(dealResult.data.getId());
  }
}
