import { Result } from '@common/types/result.type';
import { Campaign } from '../aggregates/campaign.aggregate';

export interface ICampaignRepo {
  findById(id: string): Promise<Result<Campaign | null>>;
  findAll(filters: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<Result<{ items: Campaign[]; total: number }>>;
  findActive(): Promise<Result<Campaign[]>>;
  save(campaign: Campaign): Promise<Result<Campaign>>;
  update(id: string, data: Partial<Campaign>): Promise<Result<Campaign>>;
}

export const CAMPAIGN_REPO = Symbol('CAMPAIGN_REPO');
