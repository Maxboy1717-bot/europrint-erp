/**
 * @module create-lead.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result, Err, Ok } from '@common/types/result.type';
import { Lead } from '../../domain/aggregates/lead.aggregate';
import { AIScore } from '../../domain/value-objects/ai-score.vo';
import { LeadStatus } from '../../domain/value-objects/lead-status.vo';
import { Email } from '@shared/domain/value-objects/email.vo';
import { PhoneNumber } from '@shared/domain/value-objects/phone-number.vo';
import { ILeadRepository, LEAD_REPO } from '../../domain/repositories/i-lead.repo';

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
    @Inject(LEAD_REPO) private readonly leadRepo: ILeadRepository,
  ) {}

  async execute(command: CreateLeadCommand): Promise<Result<Lead>> {
    this.logger.log({ msg: 'Creating lead', email: command.email, companyId: command.companyId });

    const existingLead = await this.leadRepo.findByEmail(command.email);
    if (existingLead.ok && existingLead.data) {
      return Err('Lead with this email already exists');
    }
    const leadR = this.buildLead(command);
    if (!leadR.ok) return leadR;

    const saveResult = await this.leadRepo.save(leadR.data);
    if (!saveResult.ok) {
      this.logger.error({ msg: 'Failed to save lead', error: saveResult.error });
      return Err('Failed to save lead');
    }
    this.logger.log({ msg: 'Lead created successfully', leadId: saveResult.data.getId() });
    return saveResult;
  }

  private buildLead(command: CreateLeadCommand): Result<Lead> {
    // VO validation — chain failures to a single Err. The handler is the
    // boundary: raw strings come in from the controller, VOs go into the
    // aggregate.
    const vosR = this.buildLeadValueObjects(command);
    if (!vosR.ok) return Err(vosR.error);
    const { email, phone, status, aiScore } = vosR.data;
    const lead = Lead.create({
      companyId: command.companyId,
      firstName: command.firstName,
      lastName: command.lastName,
      email,
      phone,
      status,
      aiScore,
      createdBy: command.createdBy,
      source: command.source,
      notes: command.notes,
    });
    return Ok(lead);
  }

  private buildLeadValueObjects(command: CreateLeadCommand): Result<{
    email: Email;
    phone: PhoneNumber;
    status: LeadStatus;
    aiScore: AIScore;
  }> {
    const emailR = Email.create(command.email);
    if (!emailR.ok) return Err(emailR.error);
    const phoneR = PhoneNumber.create(command.phone);
    if (!phoneR.ok) return Err(phoneR.error);
    // Batch 2 item 1.11: was AIScore.create(Math.round(Math.random()*100)) — a fabricated random
    // score that LOOKED real. It has no live effect today (this CQRS CreateLeadCommand path is not
    // dispatched anywhere, and the live read recomputes ai_score via CrmLeadScoringService's real
    // 5-criterion formula, never reading the stored value) — but Math.random() is a latent landmine
    // if the path is revived. Use a deterministic "not yet scored" default (0); the real scorer
    // owns the displayed value (Q-40 — no fabrication).
    const aiScoreResult = AIScore.create(0);
    if (!aiScoreResult.ok || !aiScoreResult.data) {
      return Err('Failed to generate AI score');
    }
    const statusResult = LeadStatus.create('new');
    if (!statusResult.ok || !statusResult.data) {
      return Err('Failed to set lead status');
    }
    return Ok({
      email: emailR.data,
      phone: phoneR.data,
      status: statusResult.data,
      aiScore: aiScoreResult.data,
    });
  }
}
