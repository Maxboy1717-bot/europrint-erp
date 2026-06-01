/**
 * @module crm-ai.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 * @layer Infrastructure (CRM)
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { eq, sql } from 'drizzle-orm';
import { crmLeads, crm_activities, crmDeals } from '@shared/db';
import { safeCall, Result } from '@common/result';
import type { ICrmAiRepo } from '../../domain/repositories/i-crm-ai.repo';

type Row = Record<string, unknown>;

@Injectable()
export class CrmAiRepository implements ICrmAiRepo {
  async getLeadWithActivity(lid: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.select({
        id:               crmLeads.id,
        contact_name:     crmLeads.contact_name,
        contact_email:    crmLeads.contact_email,
        contact_phone:    crmLeads.contact_phone,
        status:           crmLeads.status_description,
        ai_score:         sql<null>`NULL`,
        stage_name:       sql<null>`NULL`,
        activity_count:   sql<number>`COUNT(${crm_activities.id})::int`,
        last_activity_at: sql<Date>`MAX(${crm_activities.created_at})`,
      })
        .from(crmLeads)
        .leftJoin(crm_activities, eq(crm_activities.lead_id, crmLeads.id))
        .where(eq(crmLeads.id, lid))
        .groupBy(crmLeads.id);
      return (rows[0] ?? null) as Row | null;
      }, 'DB_ERROR');
  }

  /** crm_leads has no ai_score column — no-op until column is added */
  async updateLeadScore(_lid: number, _score: number): Promise<void> { /* no-op */ }

  async getLeadWithDeals(lid: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.select({
        id:           crmLeads.id,
        contact_name: crmLeads.contact_name,
        status:       crmLeads.status_description,
        activities:   sql<number>`COUNT(DISTINCT ${crm_activities.id})::int`,
        deals:        sql<number>`COUNT(DISTINCT ${crmDeals.id})::int`,
      })
        .from(crmLeads)
        .leftJoin(crm_activities, eq(crm_activities.lead_id, crmLeads.id))
        // live crm_deals has no lead_id column — lead link stored in metadata jsonb
        .leftJoin(crmDeals, sql`(${crmDeals.metadata}->>'lead_id')::int = ${crmLeads.id}`)
        .where(eq(crmLeads.id, lid))
        .groupBy(crmLeads.id);
      return (rows[0] ?? null) as Row | null;
      }, 'DB_ERROR');
  }

  /** crm_leads has no ai_score column — no-op until column is added */
  async updateLeadScoreSimple(_lid: number, _score: number): Promise<void> { /* no-op */ }

  async getDealWithActivity(did: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.select({
        id:         crmDeals.id,
        name:       crmDeals.title,
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
        total:     sql<number>`COUNT(*)::int`,
        new_leads: sql<number>`COUNT(*) FILTER (WHERE ${crmLeads.status_description} = 'new')::int`,
        qualified: sql<number>`COUNT(*) FILTER (WHERE ${crmLeads.status_description} = 'qualified')::int`,
        converted: sql<number>`COUNT(*) FILTER (WHERE ${crmLeads.status_description} = 'converted')::int`,
        avg_score: sql<number>`NULL::numeric`,
      })
        .from(crmLeads)
        .where(sql`
          (${mid ?? null}::int IS NULL OR ${crmLeads.manager_id} = ${mid ?? null}) AND
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
