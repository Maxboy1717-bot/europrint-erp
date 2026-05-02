export class GetTasksQuery {
  constructor(public readonly filters: {
      status?: string;
      assignedTo?: string;
      page?: number;
      limit?: number;
    }) {}
}
