/**
 * @module get-campaigns.query
 * @description Source module. See exports for details.
 */

export class GetCampaignsQuery {
  constructor(public readonly filters: {
      status?: string;
      page?: number;
      limit?: number;
    }) {}
}
