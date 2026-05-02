export class GetIncidentsQuery {
  constructor(readonly filters: {
      severity?: string;
      status?: string;
      page?: number;
      limit?: number;
    }) {}
}
