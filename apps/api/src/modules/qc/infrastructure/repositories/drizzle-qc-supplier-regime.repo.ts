/**
 * @module drizzle-qc-supplier-regime.repo
 * @description Drizzle repo — qc_supplier_regime jadvali (ISO 2859 kuchaytirilgan nazorat
 *   rejimi, per-supplier + per-material). Result<T> qaytaradi; throw taqiq (Qoida 1/15).
 * @layer Infrastructure (QC)
 */

import { Injectable } from '@nestjs/common';
import { DrizzleService } from '@common/services/drizzle.service';
import { qcSupplierRegime } from '@workspace/db';
import { and, eq } from 'drizzle-orm';
import { safeCall, Result } from '@common/result';

export type InspectionRegime = 'normal' | 'tightened' | 'reduced';

export interface RegimeRow {
  regime: InspectionRegime;
  consecutiveRejections: number;
  consecutiveAccepts: number;
  tightenedAt: Date | null;
}

export interface UpsertRegimeInput {
  supplierId: number;
  materialId: number;
  regime: InspectionRegime;
  consecutiveRejections: number;
  consecutiveAccepts: number;
  tightenedAt: Date | null;
  lastInspectionId: number | null;
}

@Injectable()
export class DrizzleQcSupplierRegimeRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  /** Current regime for a (supplier, material) pair; null when never recorded. */
  async findRegime(supplierId: number, materialId: number): Promise<Result<RegimeRow | null>> {
    return safeCall(async () => {
      const rows = await this.drizzle.db
        .select({
          regime: qcSupplierRegime.regime,
          consecutiveRejections: qcSupplierRegime.consecutiveRejections,
          consecutiveAccepts: qcSupplierRegime.consecutiveAccepts,
          tightenedAt: qcSupplierRegime.tightenedAt,
        })
        .from(qcSupplierRegime)
        .where(and(eq(qcSupplierRegime.supplierId, supplierId), eq(qcSupplierRegime.materialId, materialId)))
        .limit(1);
      const r = rows[0];
      if (!r) return null;
      return {
        regime: r.regime as InspectionRegime,
        consecutiveRejections: r.consecutiveRejections ?? 0,
        consecutiveAccepts: r.consecutiveAccepts ?? 0,
        tightenedAt: r.tightenedAt ?? null,
      };
    }, 'DB_ERROR');
  }

  /** Insert or update the regime row keyed on the (supplier, material) unique constraint. */
  async upsertRegime(input: UpsertRegimeInput): Promise<Result<RegimeRow>> {
    return safeCall(async () => {
      const rows = await this.drizzle.db
        .insert(qcSupplierRegime)
        .values({
          supplierId: input.supplierId,
          materialId: input.materialId,
          regime: input.regime,
          consecutiveRejections: input.consecutiveRejections,
          consecutiveAccepts: input.consecutiveAccepts,
          lastInspectionId: input.lastInspectionId,
          tightenedAt: input.tightenedAt,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [qcSupplierRegime.supplierId, qcSupplierRegime.materialId],
          set: {
            regime: input.regime,
            consecutiveRejections: input.consecutiveRejections,
            consecutiveAccepts: input.consecutiveAccepts,
            lastInspectionId: input.lastInspectionId,
            tightenedAt: input.tightenedAt,
            updatedAt: new Date(),
          },
        })
        .returning({
          regime: qcSupplierRegime.regime,
          consecutiveRejections: qcSupplierRegime.consecutiveRejections,
          consecutiveAccepts: qcSupplierRegime.consecutiveAccepts,
          tightenedAt: qcSupplierRegime.tightenedAt,
        });
      const r = rows[0];
      if (!r) throw new Error('qc_supplier_regime upsert qatorni qaytarmadi');
      return {
        regime: r.regime as InspectionRegime,
        consecutiveRejections: r.consecutiveRejections ?? 0,
        consecutiveAccepts: r.consecutiveAccepts ?? 0,
        tightenedAt: r.tightenedAt ?? null,
      };
    }, 'DB_ERROR');
  }
}
