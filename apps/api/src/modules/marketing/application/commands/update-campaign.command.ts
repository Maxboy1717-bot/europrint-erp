/**
 * @module update-campaign.command
 * @description Source module. See exports for details.
 */

export class UpdateCampaignCommand {
  constructor(public readonly id: string,
    public readonly name?: string,
    public readonly description?: string,
    public readonly status?: string,
    public readonly budget?: number,
    public readonly startDate?: Date,
    public readonly endDate?: Date,
    public readonly targetAudience?: Record<string, unknown>,
    public readonly userId?: string) {}
}
