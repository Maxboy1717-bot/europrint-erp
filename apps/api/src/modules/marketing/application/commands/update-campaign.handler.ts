import { AppErr, Err } from '@common/result';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { Result } from '@common/types/result.type';
import { UpdateCampaignCommand } from './update-campaign.command';
import { Campaign } from '../../domain/aggregates/campaign.aggregate';
import { ICampaignRepo, CAMPAIGN_REPO } from '../../domain/repositories/i-campaign.repo';
import { isTransitionAllowed } from '@common/constants/status-machines.constants';

const CAMPAIGN_TRANSITIONS: Record<string, string[]> = {
  draft: ['active', 'cancelled'],
  active: ['paused', 'completed', 'cancelled'],
  paused: ['active', 'completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

@Injectable()
@CommandHandler(UpdateCampaignCommand)
export class UpdateCampaignHandler implements ICommandHandler<UpdateCampaignCommand> {
  private readonly logger = new Logger(UpdateCampaignHandler.name);

  constructor(
    @Inject(CAMPAIGN_REPO) private readonly campaignRepo: ICampaignRepo,
      ) {}

  async execute(command: UpdateCampaignCommand): Promise<Result<Campaign>> {
    const existing = await this.campaignRepo.findById(command.id);

    if (!existing.ok || !existing.data) {
      this.logger.error('Campaign not found');
      return Err(AppErr('NOT_FOUND', 'Campaign not found'));
    }

    const campaign = existing.data;

    if (command.status && !isTransitionAllowed(CAMPAIGN_TRANSITIONS, campaign.status, command.status)) {
      this.logger.error(
        { from: campaign.status, to: command.status },
        'Invalid status transition for campaign',
      );
      return Err(`Cannot transition from ${campaign.status} to ${command.status}`);
    }

    if (command.name) campaign.name = command.name;
    if (command.description) campaign.description = command.description;
    if (command.status) campaign.status = command.status as typeof campaign.status;
    if (command.budget) campaign.budget = command.budget;
    if (command.startDate) campaign.startDate = command.startDate;
    if (command.endDate) campaign.endDate = command.endDate;
    if (command.targetAudience) campaign.targetAudience = typeof command.targetAudience === 'string' ? command.targetAudience : JSON.stringify(command.targetAudience);

    const result = await this.campaignRepo.update(command.id, campaign);

    if (!result.ok) {
      this.logger.error('Failed to update campaign');
      return result;
    }

    this.logger.log('Campaign updated');

    return result;
  }
}
