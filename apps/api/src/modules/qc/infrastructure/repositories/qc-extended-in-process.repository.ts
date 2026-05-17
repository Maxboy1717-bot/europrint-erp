/**
 * @module qc-extended-in-process.repository (infrastructure)
 * @description Sub-repository for QC extended — in-process inspections aggregate.
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
export class QcExtendedInProcessRepository {
  async listInProcess(sid: number | null, status: string | undefined, lim: number): Promise<Result<Row[]>>  {
    try {
      const rows = await runQuery<Row>(sql`
        SELECT ip.*, CONCAT(e.first_name, ' ', e.last_name) AS inspector_name
        FROM qc_in_process_inspections ip
        LEFT JOIN employees e ON e.id = ip.inspector_id
        WHERE (${sid}::int IS NULL OR ip.session_id = ${sid})
          AND (${status ?? null}::text IS NULL OR ip.status = ${status ?? null})
        ORDER BY ip.created_at DESC LIMIT ${lim}
      `);
      return Ok(rows.rows as Row[]);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async createInProcessInspection(session_id: number, inspector_id: number | null, check_point: string | null, total: number, defects: number, status: string, notes: string | null): Promise<Result<Row>>  {
    try {
      const rows = await runQuery<Row>(sql`
        INSERT INTO qc_in_process_inspections (session_id, inspector_id, check_point, sample_size, defects_found, status, notes)
        VALUES (${session_id}, ${inspector_id ?? null}, ${check_point ?? null}, ${total}, ${defects}, ${status}, ${notes ?? null})
        RETURNING *
      `);
      return Ok(rows.rows[0] as Row);
    } catch (_e) {
      return Err(String(_e));
    }
  }
}
