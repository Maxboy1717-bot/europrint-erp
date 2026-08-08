/**
 * @module drizzle-gofra-factors.repo
 * @description Drizzle implementation of the flute take-up factor port. Reads
 *   `pp_flute_types` and returns a {code → factor} map. When the table is empty
 *   or missing (migration not yet applied), it falls back to the owner-#6 standard
 *   defaults so the pure conversion engine is usable pre-seed (documented behaviour).
 */

import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Result, Ok, Err } from '@common/result';
import type { IGofraFactorsRepo, FluteTypeRow } from './i-gofra-factors.repo';
import type { FluteFactorConfig, FluteType } from './gofra-conversion.types';

/**
 * Owner decision #6 standard take-up factors (MASSIV-50/00-EGASI-QARORLAR-QABUL.md).
 * Mirrors the GATED seed (p53-gofra-flute-factors.sql). Used only as the empty-table
 * fallback — once the owner seeds/edits pp_flute_types, the DB values win. This is the
 * single source for the "works pre-seed" guarantee; it is NOT a hardcoded coefficient
 * inside the math (the pure service still receives it as a parameter).
 */
export const OWNER_6_FLUTE_FACTORS: Readonly<Record<FluteType, number>> = Object.freeze({
  A: 1.54,
  B: 1.36,
  C: 1.45,
  E: 1.27,
  BC: 1.43,
  // EB/F have no owner-#6 default; left out so the service reports them as unset.
} as Record<FluteType, number>);

@Injectable()
export class DrizzleGofraFactorsRepo implements IGofraFactorsRepo {
  async getFluteFactors(): Promise<Result<FluteFactorConfig>> {
    try {
      const r = await runQuery<{ code: string; take_up_factor: string | null }>(sql`
        SELECT code, take_up_factor
        FROM pp_flute_types
        WHERE is_active = true`);
      const rows = Array.isArray(r.rows) ? r.rows : [];
      if (rows.length === 0) {
        // Pre-seed: fall back to owner-#6 defaults.
        return Ok({ ...OWNER_6_FLUTE_FACTORS });
      }
      const config: FluteFactorConfig = {};
      for (const row of rows) {
        const code = String(row.code) as FluteType;
        config[code] = row.take_up_factor != null ? Number(row.take_up_factor) : null;
      }
      return Ok(config);
    } catch {
      // Table missing (migration not applied) → owner-#6 fallback, not a hard error.
      return Ok({ ...OWNER_6_FLUTE_FACTORS });
    }
  }

  async getFluteTypes(): Promise<Result<FluteTypeRow[]>> {
    try {
      const r = await runQuery<{
        code: string;
        name_uz: string;
        name_ru: string | null;
        take_up_factor: string | null;
        is_active: boolean;
      }>(sql`
        SELECT code, name_uz, name_ru, take_up_factor, is_active
        FROM pp_flute_types
        WHERE is_active = true
        ORDER BY code`);
      const rows = Array.isArray(r.rows) ? r.rows : [];
      return Ok(
        rows.map((row) => ({
          code: String(row.code),
          nameUz: String(row.name_uz),
          nameRu: row.name_ru != null ? String(row.name_ru) : null,
          takeUpFactor: row.take_up_factor != null ? Number(row.take_up_factor) : null,
          isActive: row.is_active === true,
        })),
      );
    } catch {
      // Table missing (migration not applied) → empty list, FE degrades gracefully.
      return Ok([]);
    }
  }

  // Configurable take-up WRITE: owner sets/changes a flute's factor via PUT /pp/gofra/flute-types/:code.
  // The grammage engine (getFluteFactors → computeCorrugatedGrammage) reads it live, so a change here
  // immediately shifts every subsequent corrugated grammage computation. Parametrized SQL (no injection).
  async updateFluteFactor(code: string, takeUpFactor: number): Promise<Result<FluteTypeRow>> {
    try {
      const r = await runQuery<{
        code: string;
        name_uz: string;
        name_ru: string | null;
        take_up_factor: string | null;
        is_active: boolean;
      }>(sql`
        UPDATE pp_flute_types
        SET take_up_factor = ${takeUpFactor}, updated_at = NOW()
        WHERE code = ${code} AND is_active = true
        RETURNING code, name_uz, name_ru, take_up_factor, is_active`);
      const row = Array.isArray(r.rows) ? r.rows[0] : undefined;
      if (!row) return Err(`Flute turi topilmadi yoki nofaol: ${code}`);
      return Ok({
        code: String(row.code),
        nameUz: String(row.name_uz),
        nameRu: row.name_ru != null ? String(row.name_ru) : null,
        takeUpFactor: row.take_up_factor != null ? Number(row.take_up_factor) : null,
        isActive: row.is_active === true,
      });
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Take-up koeffitsientini yangilashda xatolik');
    }
  }
}
