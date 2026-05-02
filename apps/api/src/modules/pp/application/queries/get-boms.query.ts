export class GetBomsQuery {
  constructor(public readonly filters: {
      isActive?: boolean;
      productName?: string;
      page?: number;
      limit?: number;
    }) {}
}
