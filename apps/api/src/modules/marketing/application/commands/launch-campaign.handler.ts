/**
 * @module launch-campaign.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { AppErr, Err } from '@common/result';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { Result } from '@common/types/result.type';
import { LaunchCampaignCommand } from './launch-campaign.command';
import { Campaign } from '../../domain/aggregates/campaign.aggregate';
import { ICampaignRepo, CAMPAIGN_REPO } from '../../domain/repositories/i-campaign.repo';

@Injectable()
@CommandHandler(LaunchCampaignCommand)
export class LaunchCampaignHandler implements ICommandHandler<LaunchCampaignCommand> {
  private readonly logger = new Logger(LaunchCampaignHandler.name);

  constructor(
    @Inject(CAMPAIGN_REPO) private readonly campaignRepo: ICampaignRepo,
      ) {}

  async execute(command: LaunchCampaignCommand): Promise<Result<Campaign>> {
    const existing = await this.campaignRepo.findById(command.id);

    if (!existing.ok || !existing.data) {
      this.logger.error('Campaign not found');
      return Err(AppErr('NOT_FOUND', 'Campaign not found'));
    }

    const campaign = existing.data;

    if (campaign.status !== 'draft') {
      this.logger.error('Only draft campaigns can be launched');
      return Err(AppErr('FORBIDDEN', 'Only draft campaigns can be launched'));
    }

    campaign.status = 'active' as typeof campaign.status;
    campaign.startDate = _time.now();
    campaign.updatedAt = _time.now();

    const result = await this.campaignRepo.update(command.id, campaign);

    if (!result.ok) {
      this.logger.error('Failed to launch campaign');
      return result;
    }

    this.logger.log('Campaign launched');

    return result;
  }
}
