/**
 * @module get-campaigns.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { Result, PaginatedResult , Ok } from '@common/types/result.type';
import { GetCampaignsQuery } from './get-campaigns.query';
import { Campaign } from '../../domain/aggregates/campaign.aggregate';
import { ICampaignRepo, CAMPAIGN_REPO } from '../../domain/repositories/i-campaign.repo';

@Injectable()
@QueryHandler(GetCampaignsQuery)
export class GetCampaignsHandler implements IQueryHandler<GetCampaignsQuery> {
  private readonly logger = new Logger(GetCampaignsHandler.name);

  constructor(
    @Inject(CAMPAIGN_REPO) private readonly campaignRepo: ICampaignRepo,
      ) {}

  async execute(query: GetCampaignsQuery): Promise<Result<PaginatedResult<Campaign>>> {
    const result = await this.campaignRepo.findAll(query.filters);

    if (!result.ok) {
      this.logger.error('Failed to fetch campaigns');
      return result;
    }

    const page = query.filters.page || 1;
    const limit = query.filters.limit || 10;

    const paginatedResult: PaginatedResult<Campaign> = {
      items: result.data.items,
      total: result.data.total,
      page,
      limit,
    };

    this.logger.log('Campaigns fetched');

    return Ok(paginatedResult);
  }
}
