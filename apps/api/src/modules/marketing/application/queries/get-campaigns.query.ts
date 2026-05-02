export class GetCampaignsQuery {
  constructor(public readonly filters: {
      status?: string;
      page?: number;
      limit?: number;
    }) {}
}
