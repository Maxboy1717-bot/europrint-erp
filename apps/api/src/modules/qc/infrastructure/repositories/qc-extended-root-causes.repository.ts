/**
 * @module qc-extended-root-causes.repository (infrastructure)
 * @description Sub-repository for QC extended — root-causes aggregate
 *   (catalogue lookup used by defects/CAPA flows).
 *   Split from `qc-extended.repository.ts` (Wave 13 PR1) per the
 *   Wave 9 R16 umbrella-pattern. Plain `@Injectable()` — the umbrella
 *   `QcExtendedRepository` is the sole implementer of `IQcExtendedRepo`.
 * @layer Infrastructure (QC)
 */

import { Ok, Err, Result } from '@common/result';
import { Injectable } from '@nestjs/common';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';

type Row = Record<string, unknown>;

@Injectable()
export class QcExtendedRootCausesRepository {
  async listRootCauses(): Promise<Result<Row[]>>  {
    try {
      const rows = await runQuery<Row>(sql`SELECT * FROM qc_root_causes ORDER BY name`);
      return Ok(rows.rows as Row[]);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async createRootCause(name: string, description?: string, category?: string): Promise<Result<Row>>  {
    try {
      const rows = await runQuery<Row>(sql`
        INSERT INTO qc_root_causes (name, description, category)
        VALUES (${name}, ${description ?? null}, ${category ?? null}) RETURNING *
      `);
      return Ok(rows.rows[0] as Row);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async updateRootCause(id: number, name: string | null, description: string | null, category: string | null): Promise<Result<Row[]>>  {
    try {
      const rows = await runQuery<Row>(sql`
        UPDATE qc_root_causes
        SET name = COALESCE(${name ?? null}, name),
            description = COALESCE(${description ?? null}, description),
            category = COALESCE(${category ?? null}, category),
            updated_at = NOW()
        WHERE id = ${id} RETURNING *
      `);
      return Ok(rows.rows as Row[]);
    } catch (_e) {
      return Err(String(_e));
    }
  }
}
