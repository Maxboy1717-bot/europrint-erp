/**
 * @module crm-ai-extended.service
 * @description Business-logic service for CRM AI extended features.
 *   Returns Result<T> from @common/result; never throws raw Errors.
 *
 *   Q-40 honesty policy:
 *   - autofill / analyzeChurn / chatRespond / analyzeVoiceCall
 *     require an external AI/ML provider that is NOT configured → 501 NOT_IMPLEMENTED
 *   - suggestAutoTasks  → queries crm_tasks from DB for recent entity tasks
 *   - createAutoTask    → real INSERT into crm_tasks
 *   - getAiLeads        → queries crmLeads with activity counts
 *   - getAiNba          → queries crm_activities to derive next-best-action
 *   - getAiQuickScore(lead) → SB0640/SB0652/SB0673 fix: no ML model is configured, but
 *     this is NOT the same gap as autofill/churn (which need real ML/NLP). Lead scoring
 *     has an owner-approved deterministic formula (EP-CRM-012, CrmLeadScoringService) —
 *     using it here is honest (not a "fake AI" claim) because the UI label is "quick
 *     score", not "ML prediction". Deals have no equivalent formula yet → still 501.
 */

import { Injectable } from '@nestjs/common';
import { safeCall, Result, AppError, Err, Ok } from '@common/result';
import { db } from '@shared/db';
import { crm_tasks, crm_activities, crmLeads, crmDeals, crmCompanies } from '@shared/db';
import { sql, eq, and, isNotNull, count } from 'drizzle-orm';
import { CrmLeadScoringService } from '../domain/services/crm-lead-scoring.service';

/** Recency thresholds shared with getAiQuickScore's churnRisk derivation (EP-CRM-063). */
const CHURN_HIGH_RISK_DAYS = 60;
const CHURN_MEDIUM_RISK_DAYS = 30;

type Row = Record<string, unknown>;

const NOT_IMPL = (feature: string): Result<never, AppError> =>
  Err({ code: 'NOT_IMPLEMENTED' as const, message: `${feature}: no AI provider configured` });

@Injectable()
export class CrmAiExtendedService {
  constructor(private readonly leadScoring: CrmLeadScoringService) {}
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
   * Bulk-create auto-tasks — SB-mismatch fix: ExtendedAIPanel.tsx's "accept suggested
   * tasks" button POSTs { entityType, entityId, tasks: AutoTask[] } and expects
   * { created: number }. Real INSERT per task into crm_tasks (same table/shape as
   * the single-task createAutoTask above) — no fabricated count.
   */
  async createAutoTasks(
    entityType: string,
    entityId: number,
    tasks: Array<Record<string, unknown>>,
  ): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const list = Array.isArray(tasks) ? tasks : [];
      if (list.length === 0) {
        return { created: 0, tasks: [] };
      }
      const rows = await db.insert(crm_tasks).values(
        list.map((t) => {
          // crm_tasks has no description/task_type column (Q-35: no new column added
          // here) — fold description into title when title is missing, same lossy
          // mapping the pre-existing single-task createAutoTask() already accepts.
          const title = typeof t['title'] === 'string' && t['title']
            ? t['title']
            : (typeof t['description'] === 'string' && t['description'] ? t['description'] : 'AI Task');
          return {
            title,
            lead_id:     entityType === 'lead' ? entityId : undefined,
            deal_id:     entityType === 'deal' ? entityId : undefined,
            due_date:    t['dueDate'] != null ? new Date(String(t['dueDate'])) : undefined,
            status:      'pending' as const,
            priority:    (t['priority'] as string | undefined) ?? 'medium',
          };
        }),
      ).returning();
      return { created: rows.length, tasks: rows };
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
   * Portfolio-wide churn summary — SB0641/mismatch fix: ExtendedAIPanel.tsx's
   * ChurnPanel calls GET .../churn/analyze expecting {summary, atRiskCustomers},
   * a different shape from the per-entity churn-rescue plan. No ML model is
   * configured, so this is a real DB query (open deals, days since last update)
   * classified with the same recency thresholds getAiQuickScore's churnRisk
   * uses — honest rule-based risk, not a fabricated ML score.
   */
  async getChurnAnalysisSummary(limit: number): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const rows = await db
        .select({
          id:                crmDeals.id,
          title:              crmDeals.title,
          companyTitle:       crmCompanies.title,
          daysSinceActivity: sql<number>`GREATEST(0, EXTRACT(DAY FROM NOW() - ${crmDeals.updated_at})::int)`,
        })
        .from(crmDeals)
        .leftJoin(crmCompanies, eq(crmDeals.company_id, crmCompanies.id))
        .where(and(sql`${crmDeals.status} NOT IN ('won', 'lost')`, isNotNull(crmDeals.updated_at)))
        .orderBy(sql`${crmDeals.updated_at} ASC`)
        .limit(Math.max(limit, 200)); // classify a wide pool, then trim the returned list below

      let highRisk = 0;
      let mediumRisk = 0;
      let lowRisk = 0;
      const atRiskCustomers = rows.map((r) => {
        const days = Number(r.daysSinceActivity ?? 0);
        const churnRisk = days >= CHURN_HIGH_RISK_DAYS ? 'high' : days >= CHURN_MEDIUM_RISK_DAYS ? 'medium' : 'low';
        if (churnRisk === 'high') highRisk++;
        else if (churnRisk === 'medium') mediumRisk++;
        else lowRisk++;
        return {
          id:                r.id,
          title:             r.title ?? '',
          companyTitle:      r.companyTitle ?? null,
          daysSinceActivity: days,
          churnRisk,
          // Deterministic proxy — not a fabricated probability: capped linear
          // ramp against the same 60-day "fully cold" threshold used elsewhere.
          churnProbability:  Math.min(100, Math.round((days / CHURN_HIGH_RISK_DAYS) * 100)),
        };
      });

      return {
        summary: { highRisk, mediumRisk, lowRisk },
        atRiskCustomers: atRiskCustomers
          .filter((c) => c.churnRisk !== 'low')
          .sort((a, b) => b.daysSinceActivity - a.daysSinceActivity)
          .slice(0, limit),
      };
    }, 'DB_ERROR');
  }

  /**
   * Quick score — leads use the deterministic EP-CRM-012 formula
   * (CrmLeadScoringService, same one that powers CrmLeadsController /
   * DrizzleCrmLeadsRepository.ai_score). Deals have no equivalent formula
   * yet → honest 501 NOT_IMPLEMENTED (no fake number).
   */
  async getAiQuickScore(entityType: string, entityId: number): Promise<Result<object, AppError>> {
    if (entityType !== 'lead') {
      return NOT_IMPL('getAiQuickScore (deal)');
    }
    return safeCall(async () => {
      // Raw SQL (not the Drizzle `crmLeads` def): both @shared/db and @europrint/schemas
      // resolve `crmLeads` to a narrow compat shim (schema-compat-1a.ts) that only has
      // the columns older DDD repos needed. budget/opportunity_amount/estimated_volume/
      // source_id/last_activity_at/company_title/websites exist on the live table (see
      // apps/api/src/modules/crm/leads/drizzle-crm-leads.repo.ts which reads them via
      // raw row access from @europrint/schemas' `crmLeads` for the same reason) but are
      // not typed on any in-repo pgTable def reachable from this module.
      const leadResult = await db.execute(sql`
        SELECT budget, opportunity_amount, estimated_volume, source_id, source_description,
               last_activity_at, company_title, contact_email, contact_phone, websites
        FROM crm_leads
        WHERE id = ${entityId} AND deleted_at IS NULL
        LIMIT 1
      `);
      const lead = ((leadResult as { rows?: Row[] }).rows ?? [])[0] as Row | undefined;
      if (!lead) {
        throw Object.assign(new Error(`Lead #${entityId} topilmadi`), { code: 'NOT_FOUND' });
      }

      const activityRows = await db
        .select({ cnt: count() })
        .from(crm_activities)
        .where(eq(crm_activities.lead_id, entityId));
      const activityCount = Number(activityRows[0]?.cnt ?? 0);

      const lastActivityAt = lead['last_activity_at'] as string | Date | null;
      const daysSinceLastActivity = lastActivityAt
        ? Math.max(0, Math.floor((Date.now() - new Date(lastActivityAt).getTime()) / 86_400_000))
        : null;
      const budgetUzs = Number(lead['budget'] ?? lead['opportunity_amount'] ?? lead['estimated_volume'] ?? 0) || null;
      const sourceId = (lead['source_description'] ?? lead['source_id'] ?? null) as string | null;

      const scoreResult = this.leadScoring.score({
        budgetUzs,
        activityCount,
        daysSinceLastActivity,
        source: sourceId,
        hasCompany: Boolean(lead['company_title']),
        hasEmail: Boolean(lead['contact_email']),
        hasPhone: Boolean(lead['contact_phone']),
        hasWebsite: Boolean(lead['websites']),
        employeeCount: null,
      });
      if (!scoreResult.ok) {
        throw Object.assign(new Error(scoreResult.error.message), { code: 'VALIDATION' });
      }

      // churnRisk derived from the same recency signal the formula already used —
      // no separate fabricated model, just a readable label over daysSinceLastActivity.
      const churnRisk: 'low' | 'medium' | 'high' =
        daysSinceLastActivity == null ? 'medium'
        : daysSinceLastActivity >= CHURN_HIGH_RISK_DAYS ? 'high'
        : daysSinceLastActivity >= CHURN_MEDIUM_RISK_DAYS ? 'medium'
        : 'low';

      return {
        score:      scoreResult.data.score,
        tier:       scoreResult.data.tier,
        churnRisk,
        hasIssues:  activityCount === 0,
        breakdown:  scoreResult.data.breakdown,
        source:     'crm-lead-scoring-formula',
      };
    }, 'DB_ERROR');
  }
}
