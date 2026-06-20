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
import { sql, eq, and } from 'drizzle-orm';
import { crm_activities, crm_lead_stages, crmLeads } from '@shared/db';
import { safeCall, Result } from '@common/result';
import type { CrmActivityRow } from '../../domain/repositories/i-crm-extras.repo';

type Row = Record<string, unknown>;

@Injectable()
export class CrmExtrasDashboardRepository {
  private readonly logger = new Logger(CrmExtrasDashboardRepository.name);

  async getDashboardLeads(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      try {
        return db.select({
          status: crmLeads.status_description,
          count:  sql<number>`COUNT(*)::int`,
        }).from(crmLeads).groupBy(crmLeads.status_description).then(r => castTo<Row[]>(r));
      } catch (err) {
        this.logger.warn(`getDashboardLeads: ${(err as Error).message}`);
        return [];
      }
      }, 'DB_ERROR');
  }

  async getDashboardDeals(): Promise<Result<Row>> {
    return safeCall(async () => {
      try {
        // Live crm_deals real columns: `status` (lowercase business status —
        // proposal/negotiation/won/lost), `opportunity` (Bitrix canonical deal value),
        // `deleted_at`. Raw SQL with the real column names: the @shared/db compat def
        // aliases the `status` field to the `stage_id` column and names the soft-delete
        // field `deleted_at` (not `deletedAt`), so the ORM path produced invalid SQL
        // (undefined column → threw → empty result). runQuery mirrors getPipeline below.
        const r = await runQuery<Row>(sql`
          SELECT COUNT(*)::int AS total,
                 COALESCE(SUM(opportunity), 0)::float8 AS pipeline
          FROM crm_deals
          WHERE deleted_at IS NULL
            AND (status IS NULL OR status NOT IN ('won', 'lost'))
        `);
        return (r.rows[0] ?? {}) as Row;
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
        // Live-DB column names: crm_deals has forecast_amount (not expected_amount),
        // stage_semantic_id (not status), and no lead_id column — the lead link lives
        // in metadata jsonb. crm_leads has status_description (not status).
        const result = await runQuery<Row>(sql`
          SELECT ls.id AS stage_id, ls.name AS stage_name, ls.order_index,
                 COUNT(l.id)::int AS lead_count,
                 COALESCE(SUM(d.forecast_amount), 0) AS pipeline_value
          FROM crm_lead_stages ls
          LEFT JOIN crm_leads l ON l.stage_id = ls.id AND l.status_description != 'converted'
            AND (${stageId ?? null}::int IS NULL OR ls.id = ${stageId ?? null})
          LEFT JOIN crm_deals d ON (d.metadata->>'lead_id')::int = l.id AND d.stage_semantic_id NOT IN ('won','lost')
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

  /**
   * Returns last 5 activities for a given entity (lead/deal) ordered by created_at DESC.
   * Used by getNba() to derive real next-best-action from live DB state.
   */
  async getEntityActivities(entityType: string, entityId: number): Promise<Result<CrmActivityRow[]>> {
    return safeCall(async () => {
      try {
        const rows = await db.select({
          id:          crm_activities.id,
          entity_type: crm_activities.entity_type,
          entity_id:   crm_activities.entity_id,
          type:        crm_activities.type,
          status:      crm_activities.status,
          due_date:    crm_activities.due_date,
          created_at:  crm_activities.created_at,
        })
          .from(crm_activities)
          .where(
            and(
              eq(crm_activities.entity_type, entityType),
              eq(crm_activities.entity_id, entityId),
            ),
          )
          .orderBy(sql`${crm_activities.created_at} DESC NULLS LAST`)
          .limit(5);
        return rows as CrmActivityRow[];
      } catch (err) {
        this.logger.warn(`getEntityActivities: ${(err as Error).message}`);
        return [];
      }
    }, 'DB_ERROR');
  }
}
