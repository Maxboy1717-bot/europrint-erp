import { AppErr, Err } from '@common/result';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { Result } from '@common/types/result.type';
import { GetCampaignQuery } from './get-campaign.query';
import { Campaign } from '../../domain/aggregates/campaign.aggregate';
import { ICampaignRepo, CAMPAIGN_REPO } from '../../domain/repositories/i-campaign.repo';

@Injectable()
@QueryHandler(GetCampaignQuery)
export class GetCampaignHandler implements IQueryHandler<GetCampaignQuery> {
  private readonly logger = new Logger(GetCampaignHandler.name);

  constructor(
    @Inject(CAMPAIGN_REPO) private readonly campaignRepo: ICampaignRepo,
      ) {}

  async execute(query: GetCampaignQuery): Promise<Result<Campaign>> {
    const result = await this.campaignRepo.findById(query.id);

    if (!result.ok) {
      this.logger.error('Failed to fetch campaign');
      return result as Result<Campaign>;
    }

    if (!result.data) {
      this.logger.warn('Campaign not found');
      return Err(AppErr('NOT_FOUND', 'Campaign not found'));
    }

    this.logger.log('Campaign fetched');

    return result as Result<Campaign>;
  }
}
