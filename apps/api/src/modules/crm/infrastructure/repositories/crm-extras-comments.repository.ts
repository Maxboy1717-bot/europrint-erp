/**
 * @module crm-extras-comments.repository (infrastructure)
 * @description Sub-repository for CRM extras — comments + history concern.
 *   Split from `crm-extras.repository.ts` (Wave 13 PR1) per the
 *   Wave 9 R16 umbrella-pattern. Plain `@Injectable()` — the umbrella
 *   `CrmExtrasRepository` is the sole implementer of `ICrmExtrasRepo`.
 * @layer Infrastructure (CRM)
 */

import { Injectable, Logger } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { crm_comments, crm_history, employees } from '@shared/db';
import { safeCall, Result } from '@common/result';

type Row = Record<string, unknown>;

@Injectable()
export class CrmExtrasCommentsRepository {
  private readonly logger = new Logger(CrmExtrasCommentsRepository.name);

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
}
