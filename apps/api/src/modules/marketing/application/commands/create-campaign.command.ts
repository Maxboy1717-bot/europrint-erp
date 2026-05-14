/**
 * @module create-campaign.command
 * @description Source module. See exports for details.
 */

export class CreateCampaignCommand {
  constructor(readonly name: string,
    readonly type: string,
    readonly description: string,
    readonly targetAudience: string,
    readonly budget: number,
    readonly startDate: Date,
    readonly endDate: Date,
    readonly createdBy: number) {}
}

export class ActivateCampaignCommand {
  constructor(readonly campaignId: string) {}
}

export class CompleteCampaignCommand {
  constructor(readonly campaignId: string) {}
}
