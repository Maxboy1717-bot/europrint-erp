/**
 * @module crm-extras-tasks.repository (infrastructure)
 * @description Sub-repository for CRM extras — tasks concern.
 *   Split from `crm-extras.repository.ts` (Wave 13 PR1) per the
 *   Wave 9 R16 umbrella-pattern. Plain `@Injectable()` — the umbrella
 *   `CrmExtrasRepository` is the sole implementer of `ICrmExtrasRepo`.
 * @layer Infrastructure (CRM)
 */

import { Injectable, Logger } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { crm_tasks, employees } from '@shared/db';
import { safeCall, Result } from '@common/result';

type Row = Record<string, unknown>;

@Injectable()
export class CrmExtrasTasksRepository {
  private readonly logger = new Logger(CrmExtrasTasksRepository.name);

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
}
