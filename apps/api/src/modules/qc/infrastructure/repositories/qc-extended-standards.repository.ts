/**
 * @module qc-extended-standards.repository (infrastructure)
 * @description Sub-repository for QC extended — standards aggregate.
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
export class QcExtendedStandardsRepository {
  async listStandards(category: string | undefined, lim: number, off: number): Promise<Result<Row[]>>  {
    try {
      const rows = await runQuery<Row>(sql`
        SELECT * FROM qc_standards
        WHERE (${category ?? null}::text IS NULL OR category = ${category ?? null})
        ORDER BY name LIMIT ${lim} OFFSET ${off}
      `);
      return Ok(rows.rows as Row[]);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async getStandard(id: number): Promise<Result<Row[]>>  {
    try {
      const rows = await runQuery<Row>(sql`SELECT * FROM qc_standards WHERE id = ${id}`);
      return Ok(rows.rows as Row[]);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async createStandard(name: string, category: string | null, description: string | null, parameters: Record<string, unknown> | null, is_active: boolean | null): Promise<Result<Row>>  {
    try {
      const rows = await runQuery<Row>(sql`
        INSERT INTO qc_standards (name, category, description, parameters, is_active)
        VALUES (${name}, ${category ?? null}, ${description ?? null}, ${parameters ? JSON.stringify(parameters) : null}::jsonb, ${is_active ?? true})
        RETURNING *
      `);
      return Ok(rows.rows[0] as Row);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async updateStandard(id: number, name: string | null, category: string | null, description: string | null, is_active: boolean | null): Promise<Result<Row[]>>  {
    try {
      const rows = await runQuery<Row>(sql`
        UPDATE qc_standards
        SET name = COALESCE(${name ?? null}, name),
            category = COALESCE(${category ?? null}, category),
            description = COALESCE(${description ?? null}, description),
            is_active = COALESCE(${is_active ?? null}, is_active),
            updated_at = NOW()
        WHERE id = ${id} RETURNING *
      `);
      return Ok(rows.rows as Row[]);
    } catch (_e) {
      return Err(String(_e));
    }
  }
}
