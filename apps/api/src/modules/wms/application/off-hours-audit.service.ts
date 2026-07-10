/**
 * @module off-hours-audit.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 *   Vision 10-warehouse #30 - reader for off-hours (outside-shift) warehouse movements; source
 *   for the weekly HR + Director report. The flag is computed in the query (no new column).
 * @layer Application (WMS)
 */
import { Injectable } from '@nestjs/common';
import { Result, AppError } from '@common/result';
import { OffHoursAuditRepository } from '../infrastructure/repositories/off-hours-audit.repository';

type Row = Record<string, unknown>;

@Injectable()
export class OffHoursAuditService {
  constructor(private readonly repo: OffHoursAuditRepository) {}

  /**
   * Off-hours warehouse movements in the last `sinceDays` days.
   * sinceDays/limit are clamped defensively (1..366 days, 1..2000 rows).
   */
  async getOffHoursMovements(sinceDays = 7, limit = 500): Promise<Result<Row[], AppError>> {
    const days = Number.isFinite(sinceDays) && sinceDays > 0 ? Math.min(Math.floor(sinceDays), 366) : 7;
    const lim = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 2000) : 500;
    return this.repo.findOffHoursMovements(days, lim);
  }
}
