export class GetMaintenanceOrdersQuery {
  constructor(readonly filters: {
      status?: string;
      priority?: string;
      assignedTo?: string;
      page?: number;
      limit?: number;
    }) {}
}
