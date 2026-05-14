/**
 * @module get-tasks.query
 * @description Source module. See exports for details.
 */

export class GetTasksQuery {
  constructor(public readonly filters: {
      status?: string;
      assignedTo?: string;
      page?: number;
      limit?: number;
    }) {}
}
