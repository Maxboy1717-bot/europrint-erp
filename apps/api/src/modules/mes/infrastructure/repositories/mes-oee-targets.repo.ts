/**
 * @module mes-oee-targets.repo
 * @description Repository / data-access layer for mes_oee_targets (OEE-target versioned
 *   settings). Repo owns DB (Qoida 15); raw runQuery+sql like the sibling MES repos.
 *   Versioning is append-only: create() deactivates the current row for the scope and
 *   inserts a new higher-version active row; history rows are kept (is_active=false).
 */

import { Injectable } from '@nestjs/common';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';

type Row = Record<string, unknown>;

@Injectable()
export class MesOeeTargetsRepository {
  /** All target rows (every version), newest version first within each scope. */
  async list(): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`
      SELECT t.id, t.station_id, eq.name AS station_name, t.target_percent,
             t.effective_date, t.version, t.is_active, t.created_by,
             COALESCE(u.full_name, u.username) AS created_by_name, t.created_at
      FROM mes_oee_targets t
      LEFT JOIN equipment eq ON eq.id = t.station_id
      LEFT JOIN users     u  ON u.id  = t.created_by
      ORDER BY t.station_id NULLS FIRST, t.version DESC
    `);
    return rows.rows as Row[];
  }

  /**
   * Current effective target for a scope (stationId NULL = factory-wide default).
   * IS NOT DISTINCT FROM matches NULL station_id correctly. Returns the active row
   * whose effective_date has arrived; null if none configured for the scope.
   */
  async getCurrent(stationId: number | null): Promise<Row | null> {
    const rows = await runQuery<Row>(sql`
      SELECT id, station_id, target_percent, effective_date, version, is_active
      FROM mes_oee_targets
      WHERE station_id IS NOT DISTINCT FROM ${stationId}
        AND is_active = true
        AND effective_date <= CURRENT_DATE
      ORDER BY effective_date DESC, version DESC
      LIMIT 1
    `);
    return (rows.rows[0] ?? null) as Row | null;
  }

  /**
   * Create a new target version for the scope (append-only versioning). Deactivates
   * the prior active row for the same scope and inserts a new row with version =
   * MAX(version)+1, is_active=true. Single-statement CTE = atomic. effectiveDate NULL
   * defaults to CURRENT_DATE.
   */
  async create(
    stationId: number | null,
    targetPercent: number,
    effectiveDate: string | null,
    createdBy: number | null,
  ): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`
      WITH deactivated AS (
        UPDATE mes_oee_targets SET is_active = false
        WHERE is_active = true AND station_id IS NOT DISTINCT FROM ${stationId}
        RETURNING id
      ),
      nextv AS (
        SELECT COALESCE(MAX(version), 0) + 1 AS v
        FROM mes_oee_targets WHERE station_id IS NOT DISTINCT FROM ${stationId}
      )
      INSERT INTO mes_oee_targets
        (station_id, target_percent, effective_date, version, is_active, created_by, created_at)
      SELECT ${stationId}, ${targetPercent}, COALESCE(${effectiveDate}::date, CURRENT_DATE),
             nextv.v, true, ${createdBy}, NOW()
      FROM nextv
      RETURNING *
    `);
    return rows.rows as Row[];
  }
}
