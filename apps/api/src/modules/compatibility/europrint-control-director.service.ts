/**
 * @module europrint-control-director.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { db,
  rawSql} from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../hr/common/db-rows';
import { safeCall, Result, AppError, Ok } from '@common/result';



@Injectable()
export class EuroprintControlDirectorService {
  private readonly logger = new Logger(EuroprintControlDirectorService.name);

  async getDirectorKpis(): Promise<Result<object, AppError>> {
    const r = await safeCall(() => rawSql(sql`
      SELECT kd.id::text AS id, kd.kpi_code AS "kpiCode", kd.kpi_name AS "kpiName",
             kd.category, kd.target_value AS "targetValue", kd.warning_threshold AS "warningThreshold",
             kd.critical_threshold AS "criticalThreshold", kd.threshold_direction AS "thresholdDirection",
             kd.unit, kd.block_on_violation AS "blockOnViolation",
             COALESCE(kv.value, 0) AS "currentValue"
      FROM kpi_definitions kd
      LEFT JOIN LATERAL (
        SELECT value FROM kpi_values WHERE kpi_id = kd.id ORDER BY recorded_at DESC LIMIT 1
      ) kv ON true
      ORDER BY kd.category, kd.kpi_name
    `));
    if (!r.ok) {
      this.logger.warn('kpi_definitions table not available, returning empty KPIs');
      return Ok([]);
    }
    return Ok(dbRows(r.data));
  }

  // AuditorPanel: admin-role menu structure from role_menus (the live table; "rbac_menus" was the old name).
  async getAdminMenus(): Promise<Result<object, AppError>> {
    const r = await safeCall(() => rawSql(sql`
      SELECT id, role, menu_code AS "menuCode", menu_name AS "menuName", menu_name_ru AS "menuNameRu",
             parent_menu_id AS "parentMenuId", menu_path AS "menuPath", menu_icon AS "menuIcon",
             sort_order AS "sortOrder", is_visible AS "isVisible", permissions
      FROM role_menus WHERE role = 'admin' AND is_visible = true ORDER BY sort_order, menu_code`));
    if (!r.ok) { this.logger.warn('role_menus table not available, returning empty menus'); return Ok([]); }
    return Ok(dbRows(r.data));
  }

  async getDirectorSummary(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const alertsR = await rawSql(sql`
        SELECT al.id, al.action, al.module, al.entity_id, al.created_at
        FROM audit_logs al
        WHERE al.action IN ('ERROR', 'WARN', 'ALERT')
        ORDER BY al.created_at DESC LIMIT 10
      `);
      const alerts = alertsR ? dbRows(alertsR) : [];
      const countR = await rawSql(sql`
        SELECT COUNT(*) AS total FROM employees WHERE status = 'active'
      `);
      const total = countR ? Number((dbRows(countR)[0] as Record<string, unknown>)?.['total'] ?? 0) : 0;
      return {
        summary: `Faol xodimlar: ${total}. Tizim normal ishlayapti.`,
        alerts: Array.isArray(alerts) ? alerts : [],
        lastUpdated: _time.now(),
      };
    });
  }

  async getStatusHistory(): Promise<Result<unknown[], AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        SELECT al.id, al.user_id, al.action, al.module, al.entity_id, al.created_at
        FROM audit_logs al
        ORDER BY al.created_at DESC LIMIT 30
      `);
      return Array.isArray(dbRows(r)) ? dbRows(r) : [];
    });
  }

  async getDeletedRecords() {
    const r = await safeCall(() => rawSql(sql`
      SELECT id, user_id, action, module, entity_id, before_value, created_at
      FROM audit_logs
      WHERE action = 'DELETE'
      ORDER BY created_at DESC
      LIMIT 50
    `));
    const rows = r.ok ? dbRows(r.data) : [];
    return { data: Array.isArray(rows) ? rows : [], total: Array.isArray(rows) ? rows.length : 0 };
  }

  async getAccountantBudgets() {
    const r = await safeCall(() => rawSql(sql`
      SELECT b.*, COALESCE(SUM(bl.budgeted_amount), 0) AS total_budget FROM budgets b
      LEFT JOIN budget_lines bl ON bl.budget_id = b.id
      GROUP BY b.id ORDER BY b.period_start DESC LIMIT 20
    `));
    return r.ok ? dbRows(r.data) : [];
  }

  async getAccountantFinancialSummary(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        SELECT
          COALESCE(SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END), 0)::numeric(15,2)   AS revenue,
          COALESCE(SUM(CASE WHEN status != 'paid' THEN total_amount ELSE 0 END), 0)::numeric(15,2)  AS expenses,
          COALESCE(SUM(CASE WHEN status = 'paid' THEN total_amount ELSE -total_amount END), 0)::numeric(15,2) AS profit
        FROM invoices
      `);
      const row = dbRows(r)[0] as Record<string, unknown> | undefined;
      return {
        revenue:   Number(row?.['revenue']  ?? 0),
        expenses:  Number(row?.['expenses'] ?? 0),
        profit:    Number(row?.['profit']   ?? 0),
        cashFlow:  Number(row?.['revenue']  ?? 0) - Number(row?.['expenses'] ?? 0),
      };
    });
  }

  async getAccountantKpiValues(): Promise<Result<unknown[], AppError>> {
    return safeCall(async () => {
      const r = await rawSql(sql`
        SELECT kv.id, kv.kpi_id, kv.employee_id, kv.actual_value, kv.period, kv.recorded_at,
               kd.kpi_name AS kpi_name, kd.category, kd.unit
        FROM kpi_values kv
        LEFT JOIN kpi_definitions kd ON kd.id = kv.kpi_id
        ORDER BY kv.recorded_at DESC LIMIT 50
      `);
      return Array.isArray(dbRows(r)) ? dbRows(r) : [];
    });
  }

  async getAccountantPendingPayments() {
    const r = await safeCall(() => rawSql(sql`
      SELECT * FROM invoices WHERE status IN ('sent', 'overdue') ORDER BY due_date ASC LIMIT 20
    `));
    return r.ok ? dbRows(r.data) : [];
  }

  async getAccountantDashboard(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const [pendR, kpiR] = await Promise.all([
        rawSql(sql`
          SELECT COUNT(*) AS pending_count,
                 COALESCE(SUM(total_amount), 0)::numeric(15,2) AS pending_amount
          FROM invoices WHERE status IN ('sent', 'overdue')
        `),
        rawSql(sql`
          SELECT COUNT(*) AS violation_count FROM kpi_values
          WHERE recorded_at >= NOW() - INTERVAL '30 days'
        `),
      ]);
      const pend = dbRows(pendR)[0] as Record<string, unknown> | undefined;
      const kpi  = dbRows(kpiR)[0]  as Record<string, unknown> | undefined;
      return {
        summary: {
          pendingPayments: Number(pend?.['pending_count']  ?? 0),
          pendingAmount:   Number(pend?.['pending_amount'] ?? 0),
          kpiEntries:      Number(kpi?.['violation_count'] ?? 0),
        },
        alerts: [],
        lastUpdated: _time.now(),
      };
    });
  }

}
