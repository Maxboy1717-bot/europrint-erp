/**
 * @module crm-extended.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { db,
  rawSql} from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../hr/common/db-rows';
import { safeCall, Result, AppError, AppErr, Err } from '@common/result';

import { MAX_QUERY_LIMIT } from '@common/constants/app.constants';

type Row = Record<string, unknown>;

@Injectable()
export class CrmExtendedCompatService {

  async getCrmInvoices(page = '1', limit = '50'): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    const lim = Math.min(parseInt(limit, 10) || 50, MAX_QUERY_LIMIT);
    const off = (Math.max(1, parseInt(page, 10) || 1) - 1) * lim;
    const result = await rawSql(sql`
      SELECT i.id, i.number, i.title, i.deal_id, i.company_id, i.contact_id,
             i.status, i.total_amount, i.paid_amount, i.currency,
             i.invoice_date, i.due_date, i.paid_date, i.created_at, i.updated_at
      FROM crm_invoices i
      ORDER BY i.created_at DESC LIMIT ${lim} OFFSET ${off}
    `);
    return { data: dbRows(result), total: 0, page: parseInt(page, 10) || 1 };
  
    });}

  async getAiDashboardAnalysis(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const r = await safeCall(() => rawSql(sql`
        SELECT
          COUNT(*) FILTER (WHERE status = 'new')::int AS new_leads,
          COUNT(*) FILTER (WHERE status = 'qualified')::int AS qualified_leads,
          COUNT(*) FILTER (WHERE status = 'converted')::int AS converted_leads,
          COUNT(*)::int AS total_leads
        FROM crm_leads
      `));
      const row: Row = r.ok ? (dbRows(r.data)[0] ?? {}) : {};
      const totalLeads = Number(row['total_leads'] ?? 0);
      const convertedLeads = Number(row['converted_leads'] ?? 0);
      const avgScore = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;
      const insights: Row[] = r.ok ? dbRows(r.data) : [];
      return {
        insights,
        recommendations: insights,
        leadScore: { average: avgScore, distribution: insights },
        churnRisk: {
          highRisk: Number(row['new_leads'] ?? 0),
          mediumRisk: Number(row['qualified_leads'] ?? 0),
          lowRisk: convertedLeads,
        },
        lastUpdated: _time.now(),
      };
    });
  }

  async getSupervisorDashboard(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const r = await safeCall(() => rawSql(sql`
        SELECT
          id, title, stage_id AS stage, opportunity, assigned_by_id AS assigned_by, close_date,
          EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW()) AS closed_this_month
        FROM crm_deals
        WHERE stage_id NOT IN ('WON', 'LOST')
        ORDER BY opportunity DESC
        LIMIT 50
      `));
      const rows: Row[] = r.ok ? dbRows(r.data) : [];
      const openDeals = (Array.isArray(rows) ? rows : []).filter((d) => d['stage'] !== 'WON' && d['stage'] !== 'LOST').length;
      const closedThisMonth = (Array.isArray(rows) ? rows : []).filter((d) => d['closed_this_month']).length;
      const pipelineValue = (Array.isArray(rows) ? rows : []).reduce((s, d) => s + Number(d['opportunity'] ?? 0), 0);
      return { teamPerformance: rows, openDeals, closedThisMonth, pipelineValue };
    });
  }

  async getErpProducts(page = '1', limit = '50'){
    return safeCall(async () => {
    const lim = Math.min(parseInt(limit, 10) || 50, MAX_QUERY_LIMIT);
    const off = (Math.max(1, parseInt(page, 10) || 1) - 1) * lim;
    const [result, countResult] = await Promise.all([
      rawSql(sql`
        SELECT mc.id, mc.xom_ashyo AS name, mc.material_type AS category,
               mc.unit_of_measure AS unit, mc.sku_code AS sku,
               COALESCE(cs.quantity_on_hand, 0) AS "currentStock"
        FROM material_cards mc
        LEFT JOIN current_stock cs ON cs.material_id = mc.id
        ORDER BY mc.xom_ashyo LIMIT ${lim} OFFSET ${off}
      `),
      rawSql(sql`SELECT COUNT(*) AS cnt FROM material_cards`)
        ,
    ]);
    return {
      data:  dbRows(result),
      total: Number((dbRows(countResult)[0] ?? {})['cnt'] ?? 0),
      page:  parseInt(page, 10) || 1,
    };
  
    });}

  async getMarketingSegments(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        SELECT
          COUNT(*) FILTER (WHERE COALESCE(opportunity_amount, budget, 0) > 500000000)::int  AS premium_count,
          COUNT(*) FILTER (WHERE COALESCE(opportunity_amount, budget, 0) BETWEEN 50000000 AND 500000000)::int AS mid_count,
          COUNT(*) FILTER (WHERE COALESCE(opportunity_amount, budget, 0) < 50000000
                            OR (budget IS NULL AND opportunity_amount IS NULL))::int AS small_count
        FROM crm_leads
        WHERE deleted_at IS NULL
      `);
      const row = (dbRows(r)[0] ?? {}) as { premium_count?: number; mid_count?: number; small_count?: number };
      return [
        { id: 1, name: 'Premium mijozlar', count: Number(row.premium_count ?? 0), criteria: 'Yillik hajm > 500M UZS' },
        { id: 2, name: "O'rta segment",    count: Number(row.mid_count     ?? 0), criteria: '50M — 500M UZS' },
        { id: 3, name: 'Kichik mijozlar',  count: Number(row.small_count   ?? 0), criteria: '< 50M UZS' },
      ];
    });
  }

  async getNextBestAction(): Promise<Result<Row[], AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        SELECT id, title, stage_id AS stage, opportunity, close_date
        FROM crm_deals
        WHERE stage_id NOT IN ('WON', 'LOST')
        ORDER BY opportunity DESC
        LIMIT 5
      `);
      return dbRows(r) as Row[];
    });
  }

  async getExtendedInsights(): Promise<Result<Row[], AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        SELECT
          COUNT(*)::int AS total_leads,
          COUNT(*) FILTER (WHERE status = 'new')::int AS new_leads,
          COUNT(*) FILTER (WHERE status = 'qualified')::int AS qualified_leads
        FROM crm_leads
      `);
      return dbRows(r) as Row[];
    });
  }

  // audit 2026-08-06 T20 (Qoida 10/40): these five compat AI endpoints returned
  // hardcoded fake-success ({id:null}, empty transcript, churnRisk:'low' score:0, …)
  // to any caller — a green-lie worse than an honest 501. Until a real AI
  // integration is wired (AiRouterService pattern exists in modules/ai), they now
  // return NOT_IMPLEMENTED, which unwrapOrInternal maps to HTTP 501.
  createTask(_body: Record<string, unknown>): Result<never, AppError> {
    return Err(AppErr('NOT_IMPLEMENTED', 'CRM AI vazifa-yaratish hali ulanmagan — tez orada'));
  }

  processChat(_body: Record<string, unknown>): Result<never, AppError> {
    return Err(AppErr('NOT_IMPLEMENTED', 'CRM AI chat hali ulanmagan — tez orada'));
  }

  runAutoTasks(_body: Record<string, unknown>): Result<never, AppError> {
    return Err(AppErr('NOT_IMPLEMENTED', 'CRM avto-vazifalar hali ulanmagan — tez orada'));
  }

  churnAnalysis(_body: Record<string, unknown>): Result<never, AppError> {
    return Err(AppErr('NOT_IMPLEMENTED', 'Churn-tahlil hali ulanmagan — tez orada'));
  }

  processVoice(_body: Record<string, unknown>): Result<never, AppError> {
    return Err(AppErr('NOT_IMPLEMENTED', 'Ovoz-tahlil hali ulanmagan — tez orada'));
  }
}
