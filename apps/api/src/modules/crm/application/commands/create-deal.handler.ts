/**
 * @module create-deal.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { AppErr, Err, Ok, Result, isErr } from '@common/result';
import { Deal, DealCreateProps } from '../../domain/aggregates/deal.aggregate';
import { DealStatus } from '../../domain/value-objects/deal-status.vo';
import { Money } from 'shared/domain/value-objects/money.vo';
import { IDealRepository, DEAL_REPO } from '../../domain/repositories/i-deal.repo';

export class CreateDealCommand {
  constructor(public readonly companyId: number,
    public readonly leadId: number,
    public readonly totalAmount: number,
    public readonly currency: string,
    public readonly expectedClosureDate: Date,
    public readonly assignedTo: number,
    public readonly createdBy: number,
    public readonly description?: string) {}
}

@CommandHandler(CreateDealCommand)
export class CreateDealHandler implements ICommandHandler<CreateDealCommand> {
  private readonly logger = new Logger(CreateDealHandler.name);

  constructor(
    @Inject(DEAL_REPO) private readonly dealRepo: IDealRepository,
  ) {}

  async execute(command: CreateDealCommand): Promise<Result<Deal>> {
    const propsR = this.buildDealProps(command);
    if (isErr(propsR)) return Err(propsR.error);
    const deal = Deal.create(propsR.data);
    const saveResult = await this.dealRepo.save(deal);
    if (isErr(saveResult)) {
      this.logger.error({ msg: 'Failed to save deal', error: saveResult.error.message });
      return Err(AppErr('INTERNAL', 'Failed to save deal'));
    }
    this.logger.log({ msg: 'Deal created successfully', dealId: saveResult.data.getId(), companyId: command.companyId });
    return Ok(saveResult.data);
  }

  private buildDealProps(command: CreateDealCommand): Result<DealCreateProps> {
    const moneyR = Money.of(command.totalAmount, command.currency);
    if (!moneyR.ok) {
      return Err(AppErr('VALIDATION', moneyR.error.message || 'Invalid deal amount'));
    }
    const money: Money = moneyR.data;
    const statusResult = DealStatus.create('qualification');
    if (!statusResult.ok || !statusResult.data) {
      return Err(AppErr('VALIDATION', 'Invalid deal status'));
    }
    return Ok({
      leadId: command.leadId,
      companyId: command.companyId,
      dealNumber: `DEAL-${Date.now()}`,
      status: statusResult.data,
      totalAmount: money,
      currency: command.currency,
      assignedTo: command.assignedTo,
      createdBy: command.createdBy,
      description: command.description,
      expectedClosureDate: command.expectedClosureDate,
    });
  }
}
