/**
 * @module convert-lead-to-deal.handler
 * @description CQRS handler for converting a qualified Lead into a Deal.
 *
 * Flow: load Lead → Lead.convertToDeal() → build Deal → save Deal → save Lead → publish event.
 * The conversion business rule lives in Lead.convertToDeal() (Sprint 2 A.5):
 *   only qualified leads can convert; status transitions to 'converted'.
 */

import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { AppErr, Err, Ok, Result, isErr } from '@common/result';
import { Lead } from '../../domain/aggregates/lead.aggregate';
import { Deal } from '../../domain/aggregates/deal.aggregate';
import { DealStatus } from '../../domain/value-objects/deal-status.vo';
import { Money } from 'shared/domain/value-objects/money.vo';
import { ILeadRepository, LEAD_REPO } from '../../domain/repositories/i-lead.repo';
import { IDealRepository, DEAL_REPO } from '../../domain/repositories/i-deal.repo';
import { LeadConvertedEvent } from '../../domain/events/lead-converted.event';

export class ConvertLeadToDealCommand {
  constructor(
    public readonly leadId: number,
    public readonly expectedDealAmount: number,
    public readonly expectedClosureDate: Date,
    public readonly currency: string = 'UZS',
    public readonly assignedTo?: number,
    public readonly description?: string,
  ) {}
}

@CommandHandler(ConvertLeadToDealCommand)
export class ConvertLeadToDealHandler implements ICommandHandler<ConvertLeadToDealCommand> {
  private readonly logger = new Logger(ConvertLeadToDealHandler.name);

  constructor(
    @Inject(LEAD_REPO) private readonly leadRepo: ILeadRepository,
    @Inject(DEAL_REPO) private readonly dealRepo: IDealRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ConvertLeadToDealCommand): Promise<Result<{ leadId: number; dealId: number }>> {
    const leadR = await this.loadLead(command.leadId);
    if (isErr(leadR)) return Err(leadR.error);
    const lead = leadR.data;

    const dealR = this.buildDeal(lead, command);
    if (isErr(dealR)) return Err(dealR.error);
    const savedDealR = await this.dealRepo.save(dealR.data);
    if (isErr(savedDealR)) {
      this.logger.error({ msg: 'Deal save failed during conversion', leadId: command.leadId, error: savedDealR.error.message });
      return Err(AppErr('INTERNAL', 'Failed to create deal during conversion'));
    }
    const deal = savedDealR.data;

    const convertResult = lead.convertToDeal(deal.getId());
    if (!convertResult.ok) {
      return Err(AppErr('VALIDATION', convertResult.error?.message ?? 'Lead cannot be converted'));
    }
    const updateLeadR = await this.leadRepo.update(lead);
    if (isErr(updateLeadR)) {
      this.logger.error({ msg: 'Lead update failed after deal creation — possible inconsistency', leadId: command.leadId, dealId: deal.getId() });
      return Err(AppErr('INTERNAL', 'Failed to update lead status after deal creation'));
    }

    this.eventBus.publish(new LeadConvertedEvent(
      lead.getId(), deal.getId(), lead.getCompanyId(), command.expectedDealAmount, command.currency,
    ));
    this.logger.log({ msg: 'Lead converted to deal', leadId: lead.getId(), dealId: deal.getId() });
    return Ok({ leadId: lead.getId(), dealId: deal.getId() });
  }

  private async loadLead(leadId: number): Promise<Result<Lead>> {
    const r = await this.leadRepo.findById(leadId);
    if (isErr(r) || !r.data) return Err(AppErr('NOT_FOUND', 'Lead not found'));
    return Ok(r.data);
  }

  private buildDeal(lead: Lead, command: ConvertLeadToDealCommand): Result<Deal> {
    let money: Money;
    try {
      money = Money.of(command.expectedDealAmount, command.currency);
    } catch {
      return Err(AppErr('VALIDATION', 'Invalid deal amount'));
    }
    const statusR = DealStatus.create('qualification');
    if (!statusR.ok || !statusR.data) return Err(AppErr('VALIDATION', 'Invalid deal status'));
    const deal = Deal.create({
      leadId: lead.getId(),
      companyId: lead.getCompanyId(),
      dealNumber: `DEAL-${Date.now()}`,
      status: statusR.data,
      totalAmount: money,
      currency: command.currency,
      assignedTo: command.assignedTo ?? lead.getAssignedTo() ?? lead.getCreatedBy(),
      createdBy: lead.getCreatedBy(),
      description: command.description,
      expectedClosureDate: command.expectedClosureDate,
    });
    return Ok(deal);
  }
}
