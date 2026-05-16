/**
 * @module crm-extras.repository (infrastructure)
 * @description Drizzle implementation of {@link ICrmExtrasRepo}.
 *   Migrated from `application/crm-extras.repository.ts` per PA1-9.
 * @layer Infrastructure (CRM)
 */

import { Injectable, Logger } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db , runQuery } from '@shared/db';
import { eq, sql } from 'drizzle-orm';
import {
  crm_comments, crm_history, crm_tasks, crm_lead_stages,
  crm_invoices, crm_proposals, crm_activities, crmLeads, crmDeals,
  sd_customers,
} from '@shared/db';
import { employees } from '@shared/db';
import { crmContacts } from '@shared/db';
import { safeCall, Result } from '@common/result';
import type { ICrmExtrasRepo } from '../../domain/repositories/i-crm-extras.repo';

type Row = Record<string, unknown>;

@Injectable()
export class CrmExtrasRepository implements ICrmExtrasRepo {
  private readonly logger = new Logger(CrmExtrasRepository.name);

  async listComments(leadId: number | null, dealId: number | null, lim: number, off: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      try {
        return db.select({
          id:          crm_comments.id,
          lead_id:     crm_comments.lead_id,
          deal_id:     crm_comments.deal_id,
          text:        crm_comments.text,
          author_id:   crm_comments.author_id,
          created_at:  crm_comments.created_at,
          author_name: employees.full_name,
        })
          .from(crm_comments)
          .leftJoin(employees, sql`${employees.id}::text = ${crm_comments.author_id}::text`)
          .where(sql`
            (${leadId ?? null}::int IS NULL OR ${crm_comments.lead_id} = ${leadId ?? null}) AND
            (${dealId ?? null}::int IS NULL OR ${crm_comments.deal_id} = ${dealId ?? null})
          `)
          .orderBy(sql`${crm_comments.created_at} DESC`)
          .limit(lim).offset(off).then(r => castTo<Row[]>(r));
      } catch (err) {
        this.logger.warn(`listComments: ${(err as Error).message}`);
        return [];
      }
      }, 'DB_ERROR');
  }

  async createComment(leadId: number | null, dealId: number | null, text: string, authorId: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.insert(crm_comments).values({
        lead_id:   leadId ?? undefined,
        deal_id:   dealId ?? undefined,
        text,
        author_id: authorId,
      }).returning();
      return (rows[0] ?? null) as Row | null;
      }, 'DB_ERROR');
  }

  async getHistory(entityType: string | null, entityId: number | null, lim: number, off: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      try {
        return db.select({
          id:          crm_history.id,
          entity_type: crm_history.entity_type,
          entity_id:   crm_history.entity_id,
          action:      crm_history.action,
          changes:     crm_history.changes,
          actor_id:    crm_history.actor_id,
          created_at:  crm_history.created_at,
          actor_name:  employees.full_name,
        })
          .from(crm_history)
          .leftJoin(employees, sql`${employees.id}::text = ${crm_history.actor_id}::text`)
          .where(sql`
            (${entityType ?? null}::text IS NULL OR ${crm_history.entity_type} = ${entityType ?? null}) AND
            (${entityId ?? null}::int IS NULL OR ${crm_history.entity_id} = ${entityId ?? null})
          `)
          .orderBy(sql`${crm_history.created_at} DESC`)
          .limit(lim).offset(off).then(r => castTo<Row[]>(r));
      } catch (err) {
        this.logger.warn(`getHistory: ${(err as Error).message}`);
        return [];
      }
      }, 'DB_ERROR');
  }

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

  async listTasks(assignedTo: number | null, status: string | null, lim: number, off: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      try {
        return db.select({
          id:            crm_tasks.id,
          title:         crm_tasks.title,
          lead_id:       crm_tasks.lead_id,
          deal_id:       crm_tasks.deal_id,
          assigned_to:   crm_tasks.assigned_to,
          due_date:      crm_tasks.due_date,
          status:        crm_tasks.status,
          priority:      crm_tasks.priority,
          created_at:    crm_tasks.created_at,
          assignee_name: employees.full_name,
        })
          .from(crm_tasks)
          .leftJoin(employees, sql`${employees.id}::text = ${crm_tasks.assigned_to}::text`)
          .where(sql`
            (${assignedTo ?? null}::int IS NULL OR ${crm_tasks.assigned_to} = ${assignedTo ?? null}) AND
            (${status ?? null}::text IS NULL OR ${crm_tasks.status} = ${status ?? null})
          `)
          .orderBy(sql`${crm_tasks.due_date} ASC NULLS LAST`, sql`${crm_tasks.created_at} DESC`)
          .limit(lim).offset(off).then(r => castTo<Row[]>(r));
      } catch (err) {
        this.logger.warn(`listTasks: ${(err as Error).message}`);
        return [];
      }
      }, 'DB_ERROR');
  }

  async createTask(body: Row): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.insert(crm_tasks).values({
        title:       (body.title as string) ?? 'Task',
        lead_id:     (body.lead_id as number) ?? undefined,
        deal_id:     (body.deal_id as number) ?? undefined,
        assigned_to: ((body.assignee_id ?? body.assigned_to) as number) ?? undefined,
        due_date:    body.due_date ? new Date(body.due_date as string) : undefined,
        status:      (body.status as string) ?? 'pending',
        priority:    (body.priority as string) ?? 'medium',
      }).returning();
      return (rows[0] ?? null) as Row | null;
      }, 'DB_ERROR');
  }

  async listInvoices(lim: number, off: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      try {
        const rows = await runQuery<Row>(sql`
          SELECT i.id, i.company_id AS customer_id, i.total_amount AS amount, i.status,
                 i.due_date, i.created_at, i.number, i.title, i.currency,
                 c.name AS client_name
          FROM crm_invoices i
          LEFT JOIN sd_customers c ON c.id = i.company_id
          ORDER BY i.created_at DESC
          LIMIT ${lim} OFFSET ${off}
        `);
        return castTo<Row[]>(rows.rows);
      } catch (err) {
        this.logger.warn(`listInvoices: ${(err as Error).message}`);
        return [];
      }
      }, 'DB_ERROR');
  }

  async listProposals(lim: number, off: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      try {
        return db.select({
          id:           crm_proposals.id,
          contact_id:   crm_proposals.contact_id,
          title:        crm_proposals.title,
          status:       crm_proposals.status,
          amount:       crm_proposals.amount,
          created_at:   crm_proposals.created_at,
          contact_name: sql<string>`${crmContacts.first_name} || ' ' || ${crmContacts.last_name}`,
        })
          .from(crm_proposals)
          .leftJoin(crmContacts, eq(crmContacts.id, crm_proposals.contact_id))
          .orderBy(sql`${crm_proposals.created_at} DESC`)
          .limit(lim).offset(off).then(r => castTo<Row[]>(r));
      } catch (err) {
        this.logger.warn(`listProposals: ${(err as Error).message}`);
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
