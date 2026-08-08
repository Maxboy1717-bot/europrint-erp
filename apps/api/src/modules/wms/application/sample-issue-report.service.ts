/**
 * @module sample-issue-report.service
 * @description Business-logic service. Returns Result<T>; never throws raw Errors.
 *   Vision 10-warehouse #29 — reader for sample/probnik ('NAMUNA') warehouse issues:
 *   the separate report surface + the monthly threshold ('10kg/oy signal') flag.
 *   Inputs are clamped defensively (mirrors off-hours-audit.service.ts).
 * @layer Application (WMS)
 */
import { Injectable } from '@nestjs/common';
import { Result, AppError } from '@common/result';
import { SampleIssueReportRepository } from '../infrastructure/repositories/sample-issue-report.repository';

type Row = Record<string, unknown>;

@Injectable()
export class SampleIssueReportService {
  constructor(private readonly repo: SampleIssueReportRepository) {}

  /** Sample-tagged issues in the last `sinceDays` days (clamped 1..366; limit 1..2000). */
  async listSampleIssues(sinceDays = 90, limit = 200): Promise<Result<Row[], AppError>> {
    const days = Number.isFinite(sinceDays) && sinceDays > 0 ? Math.min(Math.floor(sinceDays), 366) : 90;
    const lim = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 2000) : 200;
    return this.repo.listSampleIssues(days, lim);
  }

  /** Monthly sample-issue roll-up with over-threshold flag (months clamped 1..36). */
  async monthlySummary(months = 6): Promise<Result<Row[], AppError>> {
    const mo = Number.isFinite(months) && months > 0 ? Math.min(Math.floor(months), 36) : 6;
    return this.repo.monthlySampleSummary(mo);
  }
}
