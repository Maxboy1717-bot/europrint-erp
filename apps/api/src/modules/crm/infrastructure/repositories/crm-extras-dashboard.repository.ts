/**
 * @module crm-extras-dashboard.repository (infrastructure)
 * @description Sub-repository for CRM extras — dashboard + pipeline + lead-stages concern.
 *   Split from `crm-extras.repository.ts` (Wave 13 PR1) per the
 *   Wave 9 R16 umbrella-pattern. Plain `@Injectable()` — the umbrella
 *   `CrmExtrasRepository` is the sole implementer of `ICrmExtrasRepo`.
 * @layer Infrastructure (CRM)
 */

import { Injectable, Logger } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db, runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { crm_activities, crm_lead_stages, crmDeals, crmLeads } from '@shared/db';
import { safeCall, Result } from '@common/result';

type Row = Record<string, unknown>;

@Injectable()
export class CrmExtrasDashboardRepository {
  private readonly logger = new Logger(CrmExtrasDashboardRepository.name);

  async getDashboardLeads(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      try {
        return db.select({
          status: crmLeads.status,
          count:  sql<number>`COUNT(*)::int`,
        }).from(crmLeads).groupBy(crmLeads.status).then(r => castTo<Row[]>(r));
      } catch (err) {
        this.logger.warn(`getDashboardLeads: ${(err as Error).message}`);
        return [];
      }
      }, 'DB_ERROR');
  }

  async getDashboardDeals(): Promise<Result<Row>> {
    return safeCall(async () => {
      try {
        const rows = await db.select({
          total:    sql<number>`COUNT(*)::int`,
          pipeline: sql<number>`COALESCE(SUM(${crmDeals.expected_amount}), 0)`,
        })
          .from(crmDeals)
          .where(sql`${crmDeals.status} != 'won' AND ${crmDeals.status} != 'lost'`);
        return (rows[0] ?? {}) as Row;
      } catch (err) {
        this.logger.warn(`getDashboardDeals: ${(err as Error).message}`);
        return {};
      }
      }, 'DB_ERROR');
  }

  async getDashboardActivities(): Promise<Result<number>> {
    return safeCall(async () => {
      try {
        const rows = await db.select({ total: sql<number>`COUNT(*)::int` })
          .from(crm_activities)
          .where(sql`${crm_activities.due_date}::date = CURRENT_DATE AND ${crm_activities.status} != 'completed'`);
        return rows[0]?.total ?? 0;
      } catch (err) {
        this.logger.warn(`getDashboardActivities: ${(err as Error).message}`);
        return 0;
      }
      }, 'DB_ERROR');
  }

  async getPipeline(stageId: number | null): Promise<Result<Row[]>> {
    return safeCall(async () => {
      try {
        const result = await runQuery<Row>(sql`
          SELECT ls.id AS stage_id, ls.name AS stage_name, ls.order_index,
                 COUNT(l.id)::int AS lead_count,
                 COALESCE(SUM(d.expected_amount), 0) AS pipeline_value
          FROM crm_lead_stages ls
          LEFT JOIN crm_leads l ON l.stage_id = ls.id AND l.status = 'active'
            AND (${stageId ?? null}::int IS NULL OR ls.id = ${stageId ?? null})
          LEFT JOIN crm_deals d ON d.lead_id = l.id AND d.status NOT IN ('won','lost')
          GROUP BY ls.id, ls.name, ls.order_index
          ORDER BY ls.order_index
        `);
        return result.rows as Row[];
      } catch (err) {
        this.logger.warn(`getPipeline: ${(err as Error).message}`);
        return [];
      }
      }, 'DB_ERROR');
  }

  async getLeadStages(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      try {
        return db.select().from(crm_lead_stages)
          .orderBy(crm_lead_stages.order_index).then(r => castTo<Row[]>(r));
      } catch (err) {
        this.logger.warn(`getLeadStages: ${(err as Error).message}`);
        return [];
      }
      }, 'DB_ERROR');
  }
}
