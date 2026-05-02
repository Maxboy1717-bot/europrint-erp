export class GetRoutingsQuery {
  constructor(public readonly filters: {
      page?: number;
      limit?: number;
    }) {}
}
