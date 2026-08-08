/**
 * @module mes-oee-targets.service
 * @description Business-logic service for OEE targets. Returns Result<T> (Qoida 1);
 *   wraps the repo with safeCall. RBAC (НО/direktor-only write) is enforced at the
 *   controller via RolesGuard — the service stays transport-agnostic.
 */

import { Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { MesOeeTargetsRepository } from '../infrastructure/repositories/mes-oee-targets.repo';

type Row = Record<string, unknown>;

@Injectable()
export class MesOeeTargetsService {
  constructor(private readonly repo: MesOeeTargetsRepository) {}

  async list(): Promise<Result<Row[], AppError>> {
    return safeCall(async () => this.repo.list());
  }

  /**
   * Current target for a scope. When no target is configured yet, returns a
   * factory-default of 85 (source:'default') so the FE OEE gate that previously
   * hardcoded 85 (MESExtended.tsx:146) stays non-regressed.
   */
  async getCurrentTarget(stationId: number | null): Promise<Result<Row, AppError>> {
    return safeCall(async () => {
      const row = await this.repo.getCurrent(stationId);
      if (row) return row;
      return {
        station_id: stationId,
        target_percent: 85,
        version: 0,
        is_active: true,
        effective_date: null,
        source: 'default',
      } as Row;
    });
  }

  async createTarget(
    stationId: number | null,
    targetPercent: number,
    effectiveDate: string | null,
    createdBy: number | null,
  ): Promise<Result<Row[], AppError>> {
    return safeCall(async () =>
      this.repo.create(stationId, targetPercent, effectiveDate, createdBy),
    );
  }
}
