/**
 * @module sample-issue-report.repository
 * @description Repository / data-access layer. Wraps raw SQL; returns Result<T>.
 *   Vision 10-warehouse #29 — "Namuna/probnik chiqimi 'namuna' kod bilan hisobotda"
 *   (sample-issue tagging). A sample material issue is tagged on the EXISTING free-text
 *   `material_movements.reason` column with the canonical code 'NAMUNA' (no new
 *   column/table — vision-approved mechanism). This READ-model surfaces those issues
 *   SEPARATELY (so shrinkage/loss aggregations exclude them via `reason <> 'NAMUNA'`)
 *   and flags months whose sample tonnage exceeds the owner-tunable
 *   `wms_settings.sample_issue_monthly_limit_kg` threshold (seeded default 10 kg/month).
 * @layer Infrastructure (WMS)
 */
import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Result, safeCall } from '@common/result';

type Row = Record<string, unknown>;

/** Canonical reason code that tags a warehouse material issue as a sample/probnik. */
export const SAMPLE_ISSUE_REASON = 'NAMUNA';

@Injectable()
export class SampleIssueReportRepository {
  /**
   * Individual sample-tagged issues (reason='NAMUNA', case-insensitive) in the last
   * `sinceDays` days, most recent first — the separate report surface (also what
   * shrinkage/loss reports must exclude).
   */
  async listSampleIssues(sinceDays: number, limit: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const r = await runQuery<Row>(sql`
        SELECT m.id            AS movement_id,
               m.material_id   AS material_id,
               m.material_name AS material_name,
               m.movement_type AS movement_type,
               m.quantity      AS quantity,
               m.unit          AS unit,
               m.performed_by  AS performed_by,
               u.username      AS performed_by_name,
               m.reason        AS reason,
               m.created_at    AS issued_at
        FROM material_movements m
        LEFT JOIN users u ON u.id = m.performed_by
        WHERE upper(btrim(m.reason)) = ${SAMPLE_ISSUE_REASON}
          AND m.created_at >= now() - make_interval(days => ${sinceDays})
        ORDER BY m.created_at DESC
        LIMIT ${limit}
      `);
      return r.rows as Row[];
    }, 'DB_ERROR');
  }

  /**
   * Monthly roll-up of sample-tagged issues over the last `months` calendar months:
   * total quantity + movement count per month, with `over_threshold` = true when the
   * month tonnage exceeds `wms_settings.sample_issue_monthly_limit_kg` (fallback 10 kg).
   */
  async monthlySampleSummary(months: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const r = await runQuery<Row>(sql`
        WITH threshold AS (
          SELECT COALESCE(
                   (SELECT NULLIF(value, '')::numeric
                      FROM wms_settings
                     WHERE key = 'sample_issue_monthly_limit_kg'
                     LIMIT 1),
                   10
                 ) AS limit_kg
        )
        SELECT to_char(date_trunc('month', m.created_at), 'YYYY-MM') AS month,
               COUNT(*)                     AS movement_count,
               COALESCE(SUM(m.quantity), 0) AS total_quantity,
               t.limit_kg                   AS threshold_kg,
               (COALESCE(SUM(m.quantity), 0) > t.limit_kg) AS over_threshold
        FROM material_movements m
        CROSS JOIN threshold t
        WHERE upper(btrim(m.reason)) = ${SAMPLE_ISSUE_REASON}
          AND m.created_at >= date_trunc('month', now()) - make_interval(months => ${months})
        GROUP BY date_trunc('month', m.created_at), t.limit_kg
        ORDER BY month DESC
      `);
      return r.rows as Row[];
    }, 'DB_ERROR');
  }
}
