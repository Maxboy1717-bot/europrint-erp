/**
 * @module get-downtime.query
 * @description Source module. See exports for details.
 */

import { DowntimeFilters } from '../../infrastructure/repositories/drizzle-downtime.repo';

export class GetDowntimeQuery {
  constructor(public readonly filters: DowntimeFilters) {}
}
