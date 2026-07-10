/**
 * @module drizzle-manager-kpi.repo
 * @description Per-manager KPI aggregation for the sales-manager "karta"
 *   (vision 14-90 / TASDIQ-2146 §14 #90). Activity stats come from
 *   sd_lead_activities (grouped by manager_id, soft-deletes excluded);
 *   result/conversion stats come from crm_leads (grouped by manager_id).
 *   The two independent aggregates are merged via FULL OUTER JOIN on
 *   manager_id and resolved to users.full_name for card display.
 *
 *   Returns Result<T> from @common/result; never throws raw Errors.
 *
 * NOTE (Qoida 4/16): a FULL OUTER JOIN of two CTE aggregates is not
 *   expressible in the Drizzle fluent builder, so this uses a single
 *   parameterised raw statement via `typedExecute<T>` (no sql.raw, no
 *   string interpolation of user input — the only bound value is the
 *   optional managerId filter, passed through the drizzle `sql` template).
 */

import { Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { Ok, Err, Result } from '@common/result';
import { typedExecute } from '@shared/db/typed-execute';

export interface ManagerKpiRow {
  manager_id: number;
  manager_name: string | null;
  username: string | null;
  activity_count: number;
  calls: number;
  meetings: number;
  messages: number;
  last_activity_at: string | null;
  leads_total: number;
  leads_converted: number;
  conversion_rate: string;
}

@Injectable()
export class DrizzleManagerKpiRepository {
  private readonly logger = new Logger(DrizzleManagerKpiRepository.name);

  async getManagerKpi(opts: { managerId?: number }): Promise<Result<ManagerKpiRow[]>> {
    try {
      const managerFilter =
        opts.managerId != null
          ? sql`WHERE COALESCE(a.manager_id, r.manager_id) = ${opts.managerId}`
          : sql``;

      const rows = await typedExecute<ManagerKpiRow>(sql`
        WITH act AS (
          SELECT manager_id,
                 count(*)                                  AS activity_count,
                 count(*) FILTER (WHERE type = 'call')     AS calls,
                 count(*) FILTER (WHERE type = 'meeting')  AS meetings,
                 count(*) FILTER (WHERE type = 'message')  AS messages,
                 max(created_at)                           AS last_activity_at
          FROM sd_lead_activities
          WHERE deleted_at IS NULL AND manager_id IS NOT NULL
          GROUP BY manager_id
        ),
        res AS (
          SELECT manager_id,
                 count(*)                                          AS leads_total,
                 count(*) FILTER (WHERE converted_at IS NOT NULL)  AS leads_converted
          FROM crm_leads
          WHERE manager_id IS NOT NULL
          GROUP BY manager_id
        )
        SELECT
          COALESCE(a.manager_id, r.manager_id)         AS manager_id,
          u.full_name                                  AS manager_name,
          u.username                                   AS username,
          COALESCE(a.activity_count, 0)::int           AS activity_count,
          COALESCE(a.calls, 0)::int                    AS calls,
          COALESCE(a.meetings, 0)::int                 AS meetings,
          COALESCE(a.messages, 0)::int                 AS messages,
          a.last_activity_at                           AS last_activity_at,
          COALESCE(r.leads_total, 0)::int              AS leads_total,
          COALESCE(r.leads_converted, 0)::int          AS leads_converted,
          CASE WHEN COALESCE(r.leads_total, 0) > 0
               THEN round(100.0 * COALESCE(r.leads_converted, 0) / r.leads_total, 1)
               ELSE 0 END                              AS conversion_rate
        FROM act a
        FULL OUTER JOIN res r ON r.manager_id = a.manager_id
        LEFT JOIN users u ON u.id = COALESCE(a.manager_id, r.manager_id)
        ${managerFilter}
        ORDER BY activity_count DESC, leads_converted DESC
      `);

      return Ok(Array.isArray(rows) ? rows : []);
    } catch (e) {
      this.logger.error('getManagerKpi error', e as Error);
      return Err(String(e));
    }
  }
}
