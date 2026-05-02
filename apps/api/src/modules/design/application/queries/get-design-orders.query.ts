export class GetDesignOrdersQuery {
  constructor(public readonly filters: {
      status?: string;
      assignedTo?: string;
      page?: number;
      limit?: number;
    }) {}
}
