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
import { Result, Ok } from '@common/result';
import type { IGofraFactorsRepo } from './i-gofra-factors.repo';
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
}
