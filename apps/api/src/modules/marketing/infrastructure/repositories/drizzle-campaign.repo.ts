import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { safeNum } from '@common/math';
import { Injectable, Logger } from '@nestjs/common';
import { and, eq, desc , sql } from 'drizzle-orm';
import { Result, Err , Ok } from '@common/types/result.type';
import { ICampaignRepo } from '../../domain/repositories/i-campaign.repo';
import { Campaign } from '../../domain/aggregates/campaign.aggregate';
import { CampaignStatus, CampaignType } from '../../domain/enums/campaign-status.enum';
import { db, campaigns } from '@shared/db';

@Injectable()
export class DrizzleCampaignRepository implements ICampaignRepo {
  private readonly logger = new Logger(DrizzleCampaignRepository.name);

  constructor() {}

  async findById(id: string): Promise<Result<Campaign | null>> {
    return db
      .select()
      .from(campaigns)
      .where(sql`${campaigns.id} = ${id}`)
      .execute()
      .then((rows) => {
        if (rows.length === 0) {
          return Ok(null);
        }
        return Ok(this.toDomain(rows[0]));
      })
      .catch((error) => {
        this.logger.error('Error finding campaign by id');
        return Err((error as Error).message);
      });
  }

  async findAll(filters: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<Result<{ items: Campaign[]; total: number }>> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    return Promise.all([
      db
        .select()
        .from(campaigns)
        .where(filters.status ? sql`${campaigns.status} = ${filters.status}` : undefined)
        .orderBy(desc(campaigns.created_at))
        .limit(limit)
        .offset(offset)
        .execute()
        .catch((error) => {
          this.logger.error('Error fetching campaigns');
          throw error;
        }),
      db
        .select()
        .from(campaigns)
        .where(filters.status ? sql`${campaigns.status} = ${filters.status}` : undefined)
        .execute()
        .then((rows) => rows.length)
        .catch((error) => {
          this.logger.error('Error counting campaigns');
          throw error;
        }),
    ])
      .then(([items, total]) => (Ok({ items: (items ?? []).map((row) => this.toDomain(row)), total })))
      .catch((error) => {
        return Err((error as Error).message);
      });
  }

  async findActive(): Promise<Result<Campaign[]>> {
    return db
      .select()
      .from(campaigns)
      .where(eq(campaigns.status, 'active'))
      .orderBy(desc(campaigns.created_at))
      .execute()
      .then((rows) => (Ok((rows ?? []).map((row) => this.toDomain(row)),)))
      .catch((error) => {
        this.logger.error('Error finding active campaigns');
        return Err((error as Error).message);
      });
  }

  async save(campaign: Campaign): Promise<Result<Campaign>> {
    return db
      .insert(campaigns)
      .values({
        id: campaign.id,
        title: campaign.name,
        description: campaign.description,
        type: campaign.type,
        status: campaign.status,
        budget: campaign.budget.toString(),
        start_date: campaign.startDate,
        end_date: campaign.endDate,
        target_audience: JSON.stringify(campaign.targetAudience),
        created_by: campaign.createdBy.toString(),
        created_at: campaign.createdAt,
        updated_at: campaign.updatedAt,
      } as typeof campaigns.$inferInsert)
      .returning()
      .execute()
      .then((rows) => {
        if (rows.length === 0) {
          return Err('Failed to save campaign');
        }
        return Ok(this.toDomain(rows[0]));
      })
      .catch((error) => {
        this.logger.error('Error saving campaign');
        return Err((error as Error).message);
      });
  }

  async update(id: string, data: Partial<Campaign>): Promise<Result<Campaign>> {
    const updateData: Record<string, unknown> = {};

    if (data.name) updateData.title = data.name;
    if (data.description) updateData.description = data.description;
    if (data.status) updateData.status = data.status;
    if (data.budget) updateData.budget = data.budget.toString();
    if (data.startDate) updateData.start_date = data.startDate;
    if (data.endDate) updateData.end_date = data.endDate;
    if (data.targetAudience) updateData.target_audience = JSON.stringify(data.targetAudience);

    updateData.updated_at = _time.now();

    return db
      .update(campaigns)
      .set(updateData)
      .where(sql`${campaigns.id} = ${id}`)
      .returning()
      .execute()
      .then((rows) => {
        if (rows.length === 0) {
          return Err('Campaign not found');
        }
        return Ok(this.toDomain(rows[0]));
      })
      .catch((error) => {
        this.logger.error('Error updating campaign');
        return Err((error as Error).message);
      });
  }

  private toDomain(row: Record<string, unknown>): Campaign {
    const campaign = new Campaign(
      String(row.title ?? ''),
      row.type as CampaignType,
      String(row.description ?? ''),
      typeof row.target_audience === 'string' ? row.target_audience : JSON.stringify(row.target_audience || {}),
      row.budget ? safeNum(row.budget) : 0,
      row.start_date ? new Date(String(row.start_date)) : _time.now(),
      row.end_date ? new Date(String(row.end_date)) : _time.now(),
      parseInt(String(row.created_by)) || 0);

    campaign.id = String(row.id ?? '');
    campaign.status = row.status as CampaignStatus;
    campaign.createdAt = row.created_at ? new Date(String(row.created_at)) : _time.now();
    campaign.updatedAt = row.updated_at ? new Date(String(row.updated_at)) : _time.now();

    return campaign;
  }
}
