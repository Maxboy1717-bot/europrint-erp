/**
 * @module sd-dashboard.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 * @layer Infrastructure (SD)
 */

import { Ok, Err, Result, safeCall } from '@common/result';
import { Injectable } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import { ISdDashboardRepo } from '../../domain/repositories/i-sd-dashboard.repo';
type Row = Record<string, unknown>;
const exec = (q: SQL | SQLWrapper): Promise<Result<Row[]>> => safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);

@Injectable()
export class SdDashboardRepository implements ISdDashboardRepo {
  async getOverview(): Promise<Result<Row>>  {
  try {
      // Live sales_orders columns: total_value (not total_amount), module_status (not status),
      // advance_paid_amount (not advance_paid). Output keys kept stable for the FE.
      const rows = await exec(sql`SELECT COUNT(*)::int AS total_orders, COUNT(*) FILTER (WHERE module_status = 'pending')::int AS pending_orders, COUNT(*) FILTER (WHERE module_status = 'production')::int AS in_production, COUNT(*) FILTER (WHERE module_status = 'delivery')::int AS delivered, COALESCE(SUM(total_value) FILTER (WHERE DATE(created_at) >= DATE_TRUNC('month', NOW())), 0)::numeric(15,2) AS monthly_revenue, COALESCE(SUM(total_value) FILTER (WHERE DATE(created_at) >= DATE_TRUNC('week', NOW())), 0)::numeric(15,2) AS weekly_revenue, COALESCE(SUM(total_value) FILTER (WHERE created_at::date = CURRENT_DATE), 0)::numeric(15,2) AS today_revenue, COUNT(*) FILTER (WHERE COALESCE(advance_paid_amount, 0) = 0)::int AS pending_advance FROM sales_orders WHERE created_at >= NOW() - INTERVAL '90 days' AND deleted_at IS NULL`);
      return rows.ok ? Ok(rows.data[0] ?? {}) : Err(rows.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getTopCustomers(): Promise<Result<Row[]>>  {
  try {
      return exec(sql`SELECT o.customer_id, c.name AS customer_name, COUNT(o.id)::int AS order_count, COALESCE(SUM(o.total_value), 0)::numeric(15,2) AS total_revenue FROM sales_orders o LEFT JOIN sd_customers c ON c.id::text = o.customer_id::text WHERE o.created_at >= DATE_TRUNC('month', NOW()) AND o.deleted_at IS NULL GROUP BY o.customer_id, c.name ORDER BY total_revenue DESC LIMIT 5`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getPendingAdvanceOrders(mid: number | null, lim: number): Promise<Result<Row[]>>  {
  try {
      // Live cols: total_value (not total_amount), overall_status (not status); customer name JOINed from sd_customers
      return mid
        ? exec(sql`SELECT o.id, o.document_number AS order_number, c.name AS customer_name, o.total_value AS total_amount, o.advance_paid_amount AS advance_amount, o.created_at, 'advance_required' AS action_type FROM sales_orders o JOIN sd_leads l ON l.customer_id = o.customer_id AND l.manager_id = ${mid} LEFT JOIN sd_customers c ON c.id = o.customer_id WHERE COALESCE(o.advance_paid_amount, 0) < (o.total_value * COALESCE(o.advance_percent, 30) / 100) AND COALESCE(o.overall_status,'') NOT IN ('CANCELLED') AND o.deleted_at IS NULL ORDER BY o.created_at ASC LIMIT ${lim}`)
        : exec(sql`SELECT o.id, o.document_number AS order_number, c.name AS customer_name, o.total_value AS total_amount, o.advance_paid_amount AS advance_amount, o.created_at, 'advance_required' AS action_type FROM sales_orders o LEFT JOIN sd_customers c ON c.id = o.customer_id WHERE COALESCE(o.advance_paid_amount, 0) < (o.total_value * COALESCE(o.advance_percent, 30) / 100) AND COALESCE(o.overall_status,'') NOT IN ('CANCELLED') AND o.deleted_at IS NULL ORDER BY o.created_at ASC LIMIT ${lim}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getPendingTechCheckpoints(mid: number | null, lim: number): Promise<Result<Row[]>>  {
  try {
      return mid
        ? exec(sql`SELECT o.id, o.document_number AS order_number, c.name AS customer_name, o.total_value AS total_amount, o.module_status AS tech_checkpoint_status, 'tech_checkpoint' AS action_type FROM sales_orders o JOIN sd_leads l ON l.customer_id = o.customer_id AND l.manager_id = ${mid} LEFT JOIN sd_customers c ON c.id = o.customer_id WHERE o.module_status = 'pending' AND COALESCE(o.overall_status,'') NOT IN ('CANCELLED') AND o.deleted_at IS NULL ORDER BY o.created_at ASC LIMIT ${lim}`)
        : exec(sql`SELECT o.id, o.document_number AS order_number, c.name AS customer_name, o.total_value AS total_amount, o.module_status AS tech_checkpoint_status, 'tech_checkpoint' AS action_type FROM sales_orders o LEFT JOIN sd_customers c ON c.id = o.customer_id WHERE o.module_status = 'pending' AND COALESCE(o.overall_status,'') NOT IN ('CANCELLED') AND o.deleted_at IS NULL ORDER BY o.created_at ASC LIMIT ${lim}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getQuotaStats(mid: number | null): Promise<Result<Row[]>>  {
  try {
      return mid
        ? exec(sql`SELECT e.id AS manager_id, CONCAT(e.first_name, ' ', e.last_name) AS manager_name, COALESCE(SUM(o.total_value), 0)::numeric(15,2) AS achieved, 0::numeric(15,2) AS target, COUNT(o.id)::int AS order_count FROM employees e LEFT JOIN sd_leads l ON l.manager_id = e.id LEFT JOIN sales_orders o ON o.customer_id = l.customer_id AND DATE(o.created_at) >= DATE_TRUNC('month', NOW()) WHERE e.id = ${mid} GROUP BY e.id, e.first_name, e.last_name ORDER BY achieved DESC`)
        : exec(sql`SELECT e.id AS manager_id, CONCAT(e.first_name, ' ', e.last_name) AS manager_name, COALESCE(SUM(o.total_value), 0)::numeric(15,2) AS achieved, 0::numeric(15,2) AS target, COUNT(o.id)::int AS order_count FROM employees e LEFT JOIN sd_leads l ON l.manager_id = e.id LEFT JOIN sales_orders o ON o.customer_id = l.customer_id AND DATE(o.created_at) >= DATE_TRUNC('month', NOW()) GROUP BY e.id, e.first_name, e.last_name ORDER BY achieved DESC LIMIT 20`);  } catch (_e) {
    return Ok([]);
  }

  }

  async getExtendedStats(): Promise<Result<Row>> {
    return safeCall(async () => {
      const r = await exec(sql`
        SELECT
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int   AS new_orders_count,
          COALESCE(SUM(total_value) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days'), 0)::numeric(15,2) AS new_orders_amount,
          COUNT(*) FILTER (WHERE module_status = 'production' OR overall_status = 'IN_PROCESS')::int AS in_production_count,
          COALESCE(SUM(total_value) FILTER (WHERE module_status = 'production'), 0)::numeric(15,2) AS in_production_amount,
          COUNT(*) FILTER (WHERE module_status = 'warehouse')::int                AS in_warehouse_count,
          COALESCE(SUM(total_value) FILTER (WHERE module_status = 'warehouse'), 0)::numeric(15,2) AS in_warehouse_amount,
          COUNT(*) FILTER (WHERE delivery_status = 'PARTIALLY')::int             AS delivering_count,
          COALESCE(SUM(total_value) FILTER (WHERE delivery_status = 'PARTIALLY'), 0)::numeric(15,2) AS delivering_amount,
          COUNT(*) FILTER (WHERE DATE(created_at) >= DATE_TRUNC('month', NOW()))::int AS monthly_orders_count
        FROM sales_orders
        WHERE deleted_at IS NULL
      `);
      return r.ok ? (r.data[0] ?? {}) : {};
    });
  }

  async getLeadFunnelStats(): Promise<Result<Row[]>> {
    // sd_leads has no deleted_at column in the live DB
    return exec(sql`SELECT status, COUNT(*)::int AS count FROM sd_leads GROUP BY status`);
  }

  async getDebitorStats(): Promise<Result<Row>> {
    return safeCall(async () => {
      const r = await exec(sql`
        SELECT
          COUNT(*)::int AS debitor_count,
          COALESCE(SUM(amount), 0)::numeric(15,2) AS debitor_amount,
          COALESCE(SUM(amount) FILTER (WHERE status = 'paid' AND paid_date >= DATE_TRUNC('month', NOW())::text), 0)::numeric(15,2) AS monthly_collected
        FROM sd_payments
      `);
      return r.ok ? (r.data[0] ?? {}) : {};
    });
  }
}
