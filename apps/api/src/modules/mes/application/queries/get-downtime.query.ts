import { DowntimeFilters } from '../../infrastructure/repositories/drizzle-downtime.repo';

export class GetDowntimeQuery {
  constructor(public readonly filters: DowntimeFilters) {}
}
