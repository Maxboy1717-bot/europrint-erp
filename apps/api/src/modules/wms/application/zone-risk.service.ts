/**
 * @module zone-risk.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 *   Vision 10-warehouse #6 — IoT-signal zone at-risk flag. Thin orchestration over ZoneRiskRepository:
 *   validates the zone id, delegates the atomic flag/clear writes, and exposes the QC review queue.
 */
import { Inject, Injectable } from '@nestjs/common';
import { AppErr, Err, Result } from '@common/result';
import {
  ZONE_RISK_REPO,
  type IZoneRiskRepo,
  type ZoneRiskCounts,
  type ZoneClearCounts,
} from '../domain/repositories/i-zone-risk.repo';

type Row = Record<string, unknown>;

@Injectable()
export class ZoneRiskService {
  constructor(@Inject(ZONE_RISK_REPO) private readonly repo: IZoneRiskRepo) {}

  async flagZone(zoneId: number, reason: string): Promise<Result<ZoneRiskCounts>> {
    if (!Number.isInteger(zoneId) || zoneId <= 0) {
      return Err(AppErr('VALIDATION', "zoneId musbat butun son bo'lishi kerak"));
    }
    const trimmed = (reason ?? '').trim();
    return this.repo.flagZoneAtRisk(zoneId, trimmed.length > 0 ? trimmed : 'IoT signal (zone anomaly)');
  }

  async clearZone(zoneId: number, resolvedBy: number | null): Promise<Result<ZoneClearCounts>> {
    if (!Number.isInteger(zoneId) || zoneId <= 0) {
      return Err(AppErr('VALIDATION', "zoneId musbat butun son bo'lishi kerak"));
    }
    return this.repo.clearZoneAtRisk(zoneId, resolvedBy);
  }

  async getReviewQueue(zoneId: number | null, limit: number): Promise<Result<Row[]>> {
    return this.repo.listReviewQueue(zoneId, limit);
  }

  async getAtRiskStock(limit: number): Promise<Result<Row[]>> {
    return this.repo.listAtRiskStock(limit);
  }
}
