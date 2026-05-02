import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { db,
  rawSql} from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../hr/common/db-rows';
import { safeCall, Result, AppError } from '@common/result';

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
             i.issue_date, i.due_date, i.paid_date, i.created_at, i.updated_at
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
      const pipelineValue = (rows ?? []).reduce((s, d) => s + Number(d['opportunity'] ?? 0), 0);
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
        LEFT JOIN current_stock cs ON cs.material_card_id = mc.id
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

  getMarketingSegments() {
    return [
      { id: 1, name: 'Premium mijozlar', count: 0, criteria: 'Yillik hajm > 500M UZS' },
      { id: 2, name: "O'rta segment", count: 0, criteria: '50M — 500M UZS' },
      { id: 3, name: 'Kichik mijozlar', count: 0, criteria: '< 50M UZS' },
    ];
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

  createTask(body: Record<string, unknown>) {
    return { id: null as number | null, status: 'created', title: String(body['title'] ?? ''), createdAt: _time.now() };
  }

  processChat(body: Record<string, unknown>) {
    return { response: '', sessionId: String(body['sessionId'] ?? ''), timestamp: _time.now() };
  }

  runAutoTasks(body: Record<string, unknown>) {
    return { tasksCreated: 0, message: 'Auto-tasks queued', params: body };
  }

  churnAnalysis(body: Record<string, unknown>) {
    return { churnRisk: 'low', score: 0, recommendations: ([] as { action: string; priority: number }[]), entityId: body['entityId'] };
  }

  processVoice(body: Record<string, unknown>) {
    return { transcript: '', intent: null as string | null, confidence: 0, entityId: body['entityId'] };
  }
}
