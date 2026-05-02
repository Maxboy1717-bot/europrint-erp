export class GetGlEntriesQuery {
  constructor(public readonly filters: {
      account?: string;
      from?: Date;
      to?: Date;
      page?: number;
      limit?: number;
    }) {}
}
