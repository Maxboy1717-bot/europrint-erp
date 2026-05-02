export class GetDeliveriesQuery {
  constructor(readonly filters: {
      status?: string;
      driverId?: string;
      page?: number;
      limit?: number;
    }) {}
}
