import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { eq, sql } from 'drizzle-orm';
import { crmLeads, crm_lead_stages, crm_activities, crmDeals } from '@shared/db';
import { safeCall, Result } from '@common/result';

type Row = Record<string, unknown>;

@Injectable()
export class CrmAiRepository {
  async getLeadWithActivity(lid: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.select({
        id:              crmLeads.id,
        first_name:      crmLeads.first_name,
        last_name:       crmLeads.last_name,
        email:           crmLeads.email,
        phone:           crmLeads.phone,
        status:          crmLeads.status,
        ai_score:        crmLeads.ai_score,
        stage_name:      crm_lead_stages.name,
        activity_count:  sql<number>`COUNT(${crm_activities.id})::int`,
        last_activity_at: sql<Date>`MAX(${crm_activities.created_at})`,
      })
        .from(crmLeads)
        .leftJoin(crm_lead_stages, eq(crm_lead_stages.id, crmLeads.stage_id))
        .leftJoin(crm_activities, eq(crm_activities.lead_id, crmLeads.id))
        .where(eq(crmLeads.id, lid))
        .groupBy(crmLeads.id, crm_lead_stages.name);
      return (rows[0] ?? null) as Row | null;
      }, 'DB_ERROR');
  }

  async updateLeadScore(lid: number, score: number): Promise<void> {
    await db.update(crmLeads).set({
      ai_score:       String(score),
      ai_analyzed_at: _time.now(),
    }).where(eq(crmLeads.id, lid));
  }

  async getLeadWithDeals(lid: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.select({
        id:         crmLeads.id,
        first_name: crmLeads.first_name,
        last_name:  crmLeads.last_name,
        status:     crmLeads.status,
        activities: sql<number>`COUNT(DISTINCT ${crm_activities.id})::int`,
        deals:      sql<number>`COUNT(DISTINCT ${crmDeals.id})::int`,
      })
        .from(crmLeads)
        .leftJoin(crm_activities, eq(crm_activities.lead_id, crmLeads.id))
        .leftJoin(crmDeals, eq(crmDeals.lead_id, crmLeads.id))
        .where(eq(crmLeads.id, lid))
        .groupBy(crmLeads.id);
      return (rows[0] ?? null) as Row | null;
      }, 'DB_ERROR');
  }

  async updateLeadScoreSimple(lid: number, score: number): Promise<void> {
    await db.update(crmLeads).set({
      ai_score:   String(score),
      updated_at: _time.now(),
    }).where(eq(crmLeads.id, lid));
  }

  async getDealWithActivity(did: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.select({
        id:         crmDeals.id,
        name:       crmDeals.name,
        status:     crmDeals.status,
        amount:     crmDeals.amount,
        activities: sql<number>`COUNT(DISTINCT ${crm_activities.id})::int`,
        age_days:   sql<number>`EXTRACT(DAYS FROM (NOW() - ${crmDeals.created_at}))::int`,
      })
        .from(crmDeals)
        .leftJoin(crm_activities, eq(crm_activities.deal_id, crmDeals.id))
        .where(eq(crmDeals.id, did))
        .groupBy(crmDeals.id);
      return (rows[0] ?? null) as Row | null;
      }, 'DB_ERROR');
  }

  async getLeadDashboard(mid: number | null): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.select({
        total:      sql<number>`COUNT(*)::int`,
        new_leads:  sql<number>`COUNT(*) FILTER (WHERE ${crmLeads.status} = 'new')::int`,
        qualified:  sql<number>`COUNT(*) FILTER (WHERE ${crmLeads.status} = 'qualified')::int`,
        converted:  sql<number>`COUNT(*) FILTER (WHERE ${crmLeads.status} = 'converted')::int`,
        avg_score:  sql<number>`ROUND(AVG(${crmLeads.ai_score}))::int`,
      })
        .from(crmLeads)
        .where(sql`
          (${mid ?? null}::int IS NULL OR ${crmLeads.assigned_to} = ${mid ?? null}) AND
          ${crmLeads.created_at} >= NOW() - INTERVAL '30 days'
        `);
      return (rows[0] ?? {}) as Row;
      }, 'DB_ERROR');
  }

  async getDealDashboard(mid: number | null): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.select({
        total:          sql<number>`COUNT(*)::int`,
        won:            sql<number>`COUNT(*) FILTER (WHERE ${crmDeals.status} = 'won')::int`,
        pipeline_value: sql<number>`COALESCE(SUM(${crmDeals.expected_amount}) FILTER (WHERE ${crmDeals.status} = 'open'), 0)::numeric`,
      })
        .from(crmDeals)
        .where(sql`
          (${mid ?? null}::int IS NULL OR ${crmDeals.assigned_to} = ${mid ?? null}) AND
          ${crmDeals.created_at} >= NOW() - INTERVAL '30 days'
        `);
      return (rows[0] ?? {}) as Row;
      }, 'DB_ERROR');
  }

  async getEntityActivities(entityType: string, eid: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const colFragment = entityType === 'lead' ? sql`lead_id` : sql`deal_id`;
      const result = await runQuery<Row>(sql`
        SELECT type, COUNT(*)::int AS cnt, MAX(created_at) AS last
        FROM crm_activities
        WHERE ${colFragment} = ${eid}
        GROUP BY type
        ORDER BY last DESC
      `);
      return result.rows as Row[];
      }, 'DB_ERROR');
  }

  async getRecentActivity(lid: number | null, did: number | null): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.select({
        type:       crm_activities.type,
        created_at: crm_activities.created_at,
      })
        .from(crm_activities)
        .where(sql`
          (${lid ?? null}::int IS NULL OR ${crm_activities.lead_id} = ${lid ?? null}) AND
          (${did ?? null}::int IS NULL OR ${crm_activities.deal_id} = ${did ?? null})
        `)
        .orderBy(sql`${crm_activities.created_at} DESC`)
        .limit(1);
      return (rows[0] ?? null) as Row | null;
      }, 'DB_ERROR');
  }
}
