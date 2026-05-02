import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result, Err } from '@common/types/result.type';
import { Lead } from '../../domain/aggregates/lead.aggregate';
import { AIScore } from '../../domain/value-objects/ai-score.vo';
import { LeadStatus } from '../../domain/value-objects/lead-status.vo';
import { ILeadRepository } from '../../domain/repositories/i-lead.repo';

export class CreateLeadCommand {
  constructor(public readonly companyId: number,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly email: string,
    public readonly phone: string,
    public readonly source: string,
    public readonly createdBy: number,
    public readonly notes?: string) {}
}

@CommandHandler(CreateLeadCommand)
export class CreateLeadHandler implements ICommandHandler<CreateLeadCommand> {
  private readonly logger = new Logger(CreateLeadHandler.name);

  constructor(
    @Inject('ILeadRepository') private readonly leadRepo: ILeadRepository,
  ) {}

  async execute(command: CreateLeadCommand): Promise<Result<Lead>> {
    this.logger.log({ msg: 'Creating lead', email: command.email, companyId: command.companyId });

    const existingLead = await this.leadRepo.findByEmail(command.email);
    if (existingLead.ok && existingLead.data) {
      return Err('Lead with this email already exists');
    }

    const aiScoreResult = AIScore.create(Math.round(Math.random() * 100));
    if (!aiScoreResult.ok || !aiScoreResult.data) {
      return Err('Failed to generate AI score');
    }

    const statusResult = LeadStatus.create('new');
    if (!statusResult.ok || !statusResult.data) {
      return Err('Failed to set lead status');
    }

    const lead = Lead.create({
      companyId: command.companyId,
      firstName: command.firstName,
      lastName: command.lastName,
      email: command.email,
      phone: command.phone,
      status: statusResult.data,
      aiScore: aiScoreResult.data,
      createdBy: command.createdBy,
      source: command.source,
      notes: command.notes,
    });

    const saveResult = await this.leadRepo.save(lead);
    if (!saveResult.ok) {
      this.logger.error({ msg: 'Failed to save lead', error: saveResult.error });
      return Err('Failed to save lead');
    }

    this.logger.log({ msg: 'Lead created successfully', leadId: saveResult.data.getId() });
    return saveResult;
  }
}
