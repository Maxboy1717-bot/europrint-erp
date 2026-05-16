/**
 * @module campaign.aggregate
 * @description Source module. See exports for details.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { v4 as uuid } from 'uuid';
import { AggregateRoot } from '@shared/domain/aggregate-root.base';
import { CampaignStatus, CampaignType } from '../enums/campaign-status.enum';

export class Campaign extends AggregateRoot {
  id: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  description: string;
  targetAudience: string;
  budget: number;
  startDate: Date;
  endDate: Date;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(
    name: string,
    type: CampaignType,
    description: string,
    targetAudience: string,
    budget: number,
    startDate: Date,
    endDate: Date,
    createdBy: number,
  ) {
    super();
    this.id = uuid();
    this.name = name;
    this.type = type;
    this.status = CampaignStatus.DRAFT;
    this.description = description;
    this.targetAudience = targetAudience;
    this.budget = budget;
    this.startDate = startDate;
    this.endDate = endDate;
    this.createdBy = createdBy;
    this.createdAt = _time.now();
    this.updatedAt = _time.now();
  }

  activate(): void {
    this.status = CampaignStatus.ACTIVE;
    this.updatedAt = _time.now();
  }

  pause(): void {
    this.status = CampaignStatus.PAUSED;
    this.updatedAt = _time.now();
  }

  complete(): void {
    this.status = CampaignStatus.COMPLETED;
    this.updatedAt = _time.now();
  }

  static create(
    name: string,
    type: CampaignType,
    description: string,
    targetAudience: string,
    budget: number,
    startDate: Date,
    endDate: Date,
    createdBy: number,
  ): Campaign {
    return new Campaign(
      name,
      type,
      description,
      targetAudience,
      budget,
      startDate,
      endDate,
      createdBy,
    );
  }
}
