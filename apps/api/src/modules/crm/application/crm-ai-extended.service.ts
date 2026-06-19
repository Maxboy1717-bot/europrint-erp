/**
 * @module crm-ai-extended.service
 * @description Business-logic service for CRM AI extended features.
 *   Returns Result<T> from @common/result; never throws raw Errors.
 *
 *   Q-40 honesty policy:
 *   - autofill / analyzeChurn / chatRespond / analyzeVoiceCall / getAiQuickScore
 *     require an external AI/ML provider that is NOT configured → 501 NOT_IMPLEMENTED
 *   - suggestAutoTasks  → queries crm_tasks from DB for recent entity tasks
 *   - createAutoTask    → real INSERT into crm_tasks
 *   - getAiLeads        → queries crmLeads with activity counts
 *   - getAiNba          → queries crm_activities to derive next-best-action
 */

import { Injectable } from '@nestjs/common';
import { safeCall, Result, AppError, Err, Ok } from '@common/result';
import { db } from '@shared/db';
import { crm_tasks, crm_activities, crmLeads } from '@shared/db';
import { sql, eq, and, isNotNull } from 'drizzle-orm';

type Row = Record<string, unknown>;

const NOT_IMPL = (feature: string): Result<never, AppError> =>
  Err({ code: 'NOT_IMPLEMENTED' as const, message: `${feature}: no AI provider configured` });

@Injectable()
export class CrmAiExtendedService {
  /**
   * Autofill — requires external AI/ML inference. No provider configured.
   * Returns 501 NOT_IMPLEMENTED (honest) rather than hardcoded Manufacturing/50-200 echo.
   */
  async autofill(_entityType: string, _entityId: number): Promise<Result<never, AppError>> {
    return NOT_IMPL('autofill');
  }

  /**
   * Churn analysis — requires ML model. No provider configured.
   * Returns 501 NOT_IMPLEMENTED.
   */
  async analyzeChurn(_entityType: string, _entityId: number): Promise<Result<never, AppError>> {
    return NOT_IMPL('analyzeChurn');
  }

  /**
   * Suggest auto-tasks — queries crm_tasks for most recent tasks linked to this entity.
   * Returns up to 3 recent task records from DB (entity-specific, not hardcoded).
   */
  async suggestAutoTasks(entityType: string, entityId: number): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const col = entityType === 'deal' ? crm_tasks.deal_id : crm_tasks.lead_id;
      const rows = await db
        .select({
          id:       crm_tasks.id,
          title:    crm_tasks.title,
          status:   crm_tasks.status,
          priority: crm_tasks.priority,
          due_date: crm_tasks.due_date,
        })
        .from(crm_tasks)
        .where(eq(col, entityId))
        .orderBy(sql`${crm_tasks.created_at} DESC`)
        .limit(3);
      return {
        entity_type:    entityType,
        entity_id:      entityId,
        existing_tasks: rows,
        total:          rows.length,
      };
    }, 'DB_ERROR');
  }

  /**
   * Create an auto-task — real INSERT into crm_tasks.
   */
  async createAutoTask(body: Record<string, unknown>): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const rows = await db.insert(crm_tasks).values({
        title:       (body['title'] as string | undefined) ?? 'AI Task',
        lead_id:     body['lead_id'] != null ? Number(body['lead_id']) : undefined,
        deal_id:     body['deal_id'] != null ? Number(body['deal_id']) : undefined,
        assigned_to: body['assigned_to'] != null ? Number(body['assigned_to']) : undefined,
        due_date:    body['due_date'] != null ? new Date(String(body['due_date'])) : undefined,
        status:      'pending',
        priority:    (body['priority'] as string | undefined) ?? 'medium',
      }).returning();
      const row = rows[0] as Row | undefined;
      return {
        created:    true,
        task:       row ?? null,
        source:     'crm_tasks',
        created_at: row?.['created_at'] ?? null,
      };
    }, 'DB_ERROR');
  }

  /**
   * Chat respond — requires conversational AI backend. No provider configured.
   * Returns 501 NOT_IMPLEMENTED.
   */
  async chatRespond(_message: string, _context: Record<string, unknown>): Promise<Result<never, AppError>> {
    return NOT_IMPL('chatRespond');
  }

  /**
   * Analyze voice call — requires speech-to-text + NLP. No provider configured.
   * Returns 501 NOT_IMPLEMENTED.
   */
  async analyzeVoiceCall(_body: Record<string, unknown>): Promise<Result<never, AppError>> {
    return NOT_IMPL('analyzeVoiceCall');
  }

  /**
   * Get AI leads — queries crmLeads with activity counts, ordered by activity desc.
   * Returns real data from DB, not a hardcoded empty array.
   */
  async getAiLeads(limit: number, offset: number): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const rows = await db
        .select({
          id:             crmLeads.id,
          contact_name:   crmLeads.contact_name,
          contact_email:  crmLeads.contact_email,
          contact_phone:  crmLeads.contact_phone,
          status:         crmLeads.status_description,
          activity_count: sql<number>`COUNT(DISTINCT ${crm_activities.id})::int`,
        })
        .from(crmLeads)
        .leftJoin(crm_activities, eq(crm_activities.lead_id, crmLeads.id))
        .groupBy(crmLeads.id)
        .orderBy(sql`COUNT(DISTINCT ${crm_activities.id}) DESC`)
        .limit(limit)
        .offset(offset);

      const totalRows = await db
        .select({ cnt: sql<number>`COUNT(*)::int` })
        .from(crmLeads);
      const total = Number(totalRows[0]?.['cnt'] ?? 0);

      return {
        leads:      rows,
        total,
        ai_scored:  rows.filter(r => Number(r.activity_count) > 0).length,
        limit,
        offset,
      };
    }, 'DB_ERROR');
  }

  /**
   * Get AI next-best-action — queries crm_activities grouped by type for the entity,
   * derives NBA from last activity type (rule-based, no external AI).
   */
  async getAiNba(entityType: string | null, limit: number): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const colFragment = entityType === 'deal' ? sql`deal_id` : sql`lead_id`;
      const rows = await db
        .select({
          entity_type: crm_activities.entity_type,
          entity_id:   sql<number>`COALESCE(${crm_activities.lead_id}, ${crm_activities.deal_id})`,
          last_type:   crm_activities.type,
          last_at:     sql<Date>`MAX(${crm_activities.created_at})`,
          cnt:         sql<number>`COUNT(*)::int`,
        })
        .from(crm_activities)
        .where(entityType !== null
          ? sql`${colFragment} IS NOT NULL`
          : sql`TRUE`
        )
        .groupBy(crm_activities.entity_type, crm_activities.lead_id, crm_activities.deal_id, crm_activities.type)
        .orderBy(sql`MAX(${crm_activities.created_at}) DESC`)
        .limit(limit);

      const nbaMap: Record<string, string> = {
        call:    'send_email',
        email:   'make_call',
        meeting: 'send_proposal',
        sms:     'schedule_meeting',
        task:    'make_call',
      };

      const recommendations = rows.map((r) => {
        const lastType = String(r.last_type ?? 'none');
        return {
          entity_type: r.entity_type ?? entityType,
          entity_id:   r.entity_id,
          action:      nbaMap[lastType] ?? 'make_call',
          based_on:    lastType,
          last_at:     r.last_at,
        };
      });

      return {
        recommendations,
        entity_type:     entityType,
        generated_count: recommendations.length,
        limit,
      };
    }, 'DB_ERROR');
  }

  /**
   * Quick score — requires ML scoring model. No provider configured.
   * Returns 501 NOT_IMPLEMENTED.
   */
  async getAiQuickScore(_entityType: string, _entityId: number): Promise<Result<never, AppError>> {
    return NOT_IMPL('getAiQuickScore');
  }
}
