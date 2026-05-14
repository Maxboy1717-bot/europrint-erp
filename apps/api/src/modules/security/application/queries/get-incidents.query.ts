/**
 * @module get-incidents.query
 * @description Source module. See exports for details.
 */

export class GetIncidentsQuery {
  constructor(readonly filters: {
      severity?: string;
      status?: string;
      page?: number;
      limit?: number;
    }) {}
}
