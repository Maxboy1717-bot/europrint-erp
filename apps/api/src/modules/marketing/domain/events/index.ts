/**
 * @module index
 * @description Barrel re-export file. Surfaces the public API of this folder.
 */

export class CampaignCreatedEvent {
  constructor(readonly campaignId: string,
    readonly name: string) {}
}

export class CampaignActivatedEvent {
  constructor(
    readonly campaignId: string,
    readonly startDate: Date,
  ) {}
}

export class CampaignCompletedEvent {
  constructor(
    readonly campaignId: string,
    readonly endDate: Date,
  ) {}
}
