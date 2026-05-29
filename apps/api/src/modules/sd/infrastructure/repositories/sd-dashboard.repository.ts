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
      const rows = await exec(sql`SELECT COUNT(*)::int AS total_orders, COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_orders, COUNT(*) FILTER (WHERE status = 'in_production')::int AS in_production, COUNT(*) FILTER (WHERE status = 'delivered')::int AS delivered, COALESCE(SUM(total_amount) FILTER (WHERE DATE(created_at) >= DATE_TRUNC('month', NOW())), 0)::numeric(15,2) AS monthly_revenue, COALESCE(SUM(total_amount) FILTER (WHERE DATE(created_at) >= DATE_TRUNC('week', NOW())), 0)::numeric(15,2) AS weekly_revenue, COALESCE(SUM(total_amount) FILTER (WHERE created_at::date = CURRENT_DATE), 0)::numeric(15,2) AS today_revenue, COUNT(*) FILTER (WHERE COALESCE(advance_paid, 0) = 0 AND COALESCE(advance_required, 0) = 1)::int AS pending_advance FROM sales_orders WHERE created_at >= NOW() - INTERVAL '90 days' AND deleted_at IS NULL`);
      return rows.ok ? Ok(rows.data[0] ?? {}) : Err(rows.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getTopCustomers(): Promise<Result<Row[]>>  {
  try {
      return exec(sql`SELECT o.customer_id, c.name AS customer_name, COUNT(o.id)::int AS order_count, COALESCE(SUM(o.total_amount), 0)::numeric(15,2) AS total_revenue FROM sales_orders o LEFT JOIN sd_customers c ON c.id::text = o.customer_id::text WHERE o.created_at >= DATE_TRUNC('month', NOW()) AND o.deleted_at IS NULL GROUP BY o.customer_id, c.name ORDER BY total_revenue DESC LIMIT 5`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getPendingAdvanceOrders(mid: number | null, lim: number): Promise<Result<Row[]>>  {
  try {
      return mid
        ? exec(sql`SELECT o.id, o.document_number AS order_number, o.customer_name, o.total_amount, o.advance_paid_amount AS advance_amount, o.created_at, 'advance_required' AS action_type FROM sales_orders o JOIN sd_leads l ON l.customer_id = o.customer_id AND l.manager_id = ${mid} WHERE COALESCE(o.advance_paid_amount, 0) < (o.total_amount * COALESCE(o.advance_percent, 30) / 100) AND o.status NOT IN ('cancelled', 'delivered') AND o.deleted_at IS NULL ORDER BY o.created_at ASC LIMIT ${lim}`)
        : exec(sql`SELECT o.id, o.document_number AS order_number, o.customer_name, o.total_amount, o.advance_paid_amount AS advance_amount, o.created_at, 'advance_required' AS action_type FROM sales_orders o WHERE COALESCE(o.advance_paid_amount, 0) < (o.total_amount * COALESCE(o.advance_percent, 30) / 100) AND o.status NOT IN ('cancelled', 'delivered') AND o.deleted_at IS NULL ORDER BY o.created_at ASC LIMIT ${lim}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getPendingTechCheckpoints(mid: number | null, lim: number): Promise<Result<Row[]>>  {
  try {
      return mid
        ? exec(sql`SELECT o.id, o.document_number AS order_number, o.customer_name, o.total_amount, o.module_status AS tech_checkpoint_status, 'tech_checkpoint' AS action_type FROM sales_orders o JOIN sd_leads l ON l.customer_id = o.customer_id AND l.manager_id = ${mid} WHERE o.module_status = 'pending' AND o.status NOT IN ('cancelled', 'delivered') AND o.deleted_at IS NULL ORDER BY o.created_at ASC LIMIT ${lim}`)
        : exec(sql`SELECT o.id, o.document_number AS order_number, o.customer_name, o.total_amount, o.module_status AS tech_checkpoint_status, 'tech_checkpoint' AS action_type FROM sales_orders o WHERE o.module_status = 'pending' AND o.status NOT IN ('cancelled', 'delivered') AND o.deleted_at IS NULL ORDER BY o.created_at ASC LIMIT ${lim}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getQuotaStats(mid: number | null): Promise<Result<Row[]>>  {
  try {
      return mid
        ? exec(sql`SELECT e.id AS manager_id, CONCAT(e.first_name, ' ', e.last_name) AS manager_name, COALESCE(SUM(o.total_amount), 0)::numeric(15,2) AS achieved, 0::numeric(15,2) AS target, COUNT(o.id)::int AS order_count FROM employees e LEFT JOIN sd_leads l ON l.manager_id = e.id LEFT JOIN sales_orders o ON o.customer_id = l.customer_id AND DATE(o.created_at) >= DATE_TRUNC('month', NOW()) WHERE e.id = ${mid} GROUP BY e.id, e.first_name, e.last_name ORDER BY achieved DESC`)
        : exec(sql`SELECT e.id AS manager_id, CONCAT(e.first_name, ' ', e.last_name) AS manager_name, COALESCE(SUM(o.total_amount), 0)::numeric(15,2) AS achieved, 0::numeric(15,2) AS target, COUNT(o.id)::int AS order_count FROM employees e LEFT JOIN sd_leads l ON l.manager_id = e.id LEFT JOIN sales_orders o ON o.customer_id = l.customer_id AND DATE(o.created_at) >= DATE_TRUNC('month', NOW()) GROUP BY e.id, e.first_name, e.last_name ORDER BY achieved DESC LIMIT 20`);  } catch (_e) {
    return Ok([]);
  }

  }
}
