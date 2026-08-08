/**
 * @module sales.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 *
 * Merged into sd module (PA3-17 Wave 3): originally lived in `modules/sales/`.
 */

import { Ok, Err, Result, safeCall } from '@common/result';
import { Injectable } from '@nestjs/common';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import { db , runQuery } from '@shared/db';
import { COMMISSION_RATE } from '@common/constants/business.constants';

import { SECONDS_PER_DAY } from '@common/constants/app.constants';
type Row = Record<string, unknown>;
const exec = (q: SQL | SQLWrapper): Promise<Result<Row[]>> => safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);

@Injectable()
export class SalesRepository {
  async listInvoices(customerId: number | null, status: string | null, lim: number, off: number): Promise<Result<Row[]>>  {
  try {
      return customerId && status
        ? exec(sql`SELECT i.*, c.name AS customer_name FROM invoices i LEFT JOIN sd_customers c ON c.id = i.customer_id WHERE i.customer_id = ${customerId} AND i.status = ${status} ORDER BY i.created_at DESC LIMIT ${lim} OFFSET ${off}`)
        : customerId
        ? exec(sql`SELECT i.*, c.name AS customer_name FROM invoices i LEFT JOIN sd_customers c ON c.id = i.customer_id WHERE i.customer_id = ${customerId} ORDER BY i.created_at DESC LIMIT ${lim} OFFSET ${off}`)
        : status
        ? exec(sql`SELECT i.*, c.name AS customer_name FROM invoices i LEFT JOIN sd_customers c ON c.id = i.customer_id WHERE i.status = ${status} ORDER BY i.created_at DESC LIMIT ${lim} OFFSET ${off}`)
        : exec(sql`SELECT i.*, c.name AS customer_name FROM invoices i LEFT JOIN sd_customers c ON c.id = i.customer_id ORDER BY i.created_at DESC LIMIT ${lim} OFFSET ${off}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getMonthlyTrend(months: number): Promise<Result<Row[]>>  {
  try {
      return exec(sql`SELECT DATE_TRUNC('month', created_at) AS month, COUNT(*)::int AS order_count, COALESCE(SUM(total_amount), 0)::numeric(15,2) AS revenue FROM sales_orders WHERE created_at >= NOW() - (${months} || ' months')::interval GROUP BY DATE_TRUNC('month', created_at) ORDER BY month`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getVelocity(): Promise<Result<Row>>  {
  try {
      const rows = await exec(sql`SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / ${SECONDS_PER_DAY})::numeric(10,2) AS avg_cycle_days, COUNT(*)::int AS total_deals, COUNT(CASE WHEN status = 'won' THEN 1 END)::int AS won_deals FROM crm_deals WHERE created_at >= NOW() - INTERVAL '90 days'`);
      return rows.ok ? Ok(rows.data[0] ?? {}) : Err(rows.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getCommissionCalculations(managerId: number | null): Promise<Result<Row[]>>  {
  try {
      return managerId
        ? exec(sql`SELECT e.id, e.full_name, COALESCE(SUM(o.total_amount), 0)::numeric(15,2) AS total_sales, (COALESCE(SUM(o.total_amount), 0) * ${COMMISSION_RATE})::numeric(15,2) AS commission_5pct, COUNT(DISTINCT o.id)::int AS order_count FROM employees e LEFT JOIN sales_orders o ON o.assigned_to::text = e.id::text AND o.status IN ('delivered', 'completed') AND o.created_at >= DATE_TRUNC('month', NOW()) WHERE e.id = ${managerId} AND e.department = 'Sales' GROUP BY e.id, e.full_name`)
        : exec(sql`SELECT e.id, e.full_name, COALESCE(SUM(o.total_amount), 0)::numeric(15,2) AS total_sales, (COALESCE(SUM(o.total_amount), 0) * ${COMMISSION_RATE})::numeric(15,2) AS commission_5pct, COUNT(DISTINCT o.id)::int AS order_count FROM employees e LEFT JOIN sales_orders o ON o.assigned_to::text = e.id::text AND o.status IN ('delivered', 'completed') AND o.created_at >= DATE_TRUNC('month', NOW()) WHERE e.department = 'Sales' GROUP BY e.id, e.full_name`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getPipelineForecast(): Promise<Result<Row>>  {
  try {
      const rows = await exec(sql`SELECT COALESCE(SUM(forecast_amount), 0)::numeric(15,2) AS pipeline_value, COUNT(*)::int AS deal_count FROM crm_deals WHERE status NOT IN ('won', 'lost')`);
      return rows.ok ? Ok(rows.data[0] ?? {}) : Err(rows.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getLeaderboard(limit: number): Promise<Result<Row[]>>  {
  try {
      return exec(sql`SELECT e.id, e.full_name, e.position, COALESCE(SUM(o.total_amount), 0)::numeric(15,2) AS total_revenue, COUNT(DISTINCT o.id)::int AS order_count, RANK() OVER (ORDER BY COALESCE(SUM(o.total_amount), 0) DESC)::int AS rank FROM employees e LEFT JOIN sales_orders o ON o.assigned_to::text = e.id::text AND o.created_at >= DATE_TRUNC('month', NOW()) WHERE e.department = 'Sales' GROUP BY e.id, e.full_name, e.position ORDER BY total_revenue DESC LIMIT ${limit}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async listSalesOrders(lim: number, off: number): Promise<Result<Row[]>>  {
  try {
      return exec(sql`SELECT o.*, c.name AS customer_name FROM sales_orders o LEFT JOIN sd_customers c ON c.id = o.customer_id ORDER BY o.created_at DESC LIMIT ${lim} OFFSET ${off}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getForecastHistory(managerId: number | null, lim: number): Promise<Result<Row[]>> {
    try {
      return managerId !== null
        ? exec(sql`SELECT id, forecast_period AS period, forecasted_revenue, actual_revenue, accuracy, confidence_level, forecast_method, created_at FROM sales_forecasts WHERE created_by = ${managerId} ORDER BY created_at DESC LIMIT ${lim}`)
        : exec(sql`SELECT id, forecast_period AS period, forecasted_revenue, actual_revenue, accuracy, confidence_level, forecast_method, created_at FROM sales_forecasts ORDER BY created_at DESC LIMIT ${lim}`);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  /**
   * Calculates forecast accuracy by comparing monthly deal forecast_amount
   * (from crm_deals grouped by COALESCE(won_at, date_create)) against
   * actual sales_orders.total_amount grouped by created_at month.
   * accuracy_percent = (1 - |actual - forecast| / forecast) * 100, capped in query.
   */
  async getForecastAccuracyData(managerId: number | null, months: number): Promise<Result<{ periods: Row[]; avg_accuracy: number | null }>> {
    try {
      // Language: raw SQL needed for FULL OUTER JOIN + CTEs (Drizzle does not support FULL OUTER JOIN natively)
      const periodsResult = managerId
        ? await exec(sql`
            WITH deal_months AS (
              SELECT
                DATE_TRUNC('month', COALESCE(won_at, date_create)) AS month,
                SUM(forecast_amount) AS forecast_total
              FROM crm_deals
              WHERE deleted_at IS NULL
                AND manager_id = ${managerId}
              GROUP BY DATE_TRUNC('month', COALESCE(won_at, date_create))
            ),
            sales_months AS (
              SELECT
                DATE_TRUNC('month', created_at) AS month,
                SUM(COALESCE(total_amount, total_value, 0)) AS actual_total
              FROM sales_orders
              WHERE deleted_at IS NULL
              GROUP BY DATE_TRUNC('month', created_at)
            )
            SELECT
              TO_CHAR(COALESCE(d.month, s.month), 'YYYY-MM') AS month,
              COALESCE(d.forecast_total, 0)::numeric(15,2) AS forecast,
              COALESCE(s.actual_total, 0)::numeric(15,2) AS actual,
              CASE
                WHEN COALESCE(d.forecast_total, 0) = 0 THEN NULL
                ELSE ROUND(
                  (1 - ABS(COALESCE(s.actual_total, 0) - d.forecast_total) / NULLIF(d.forecast_total, 0))
                  * 100,
                  1
                )
              END AS accuracy_percent
            FROM deal_months d
            FULL OUTER JOIN sales_months s ON d.month = s.month
            ORDER BY COALESCE(d.month, s.month) DESC
            LIMIT ${months}
          `)
        : await exec(sql`
            WITH deal_months AS (
              SELECT
                DATE_TRUNC('month', COALESCE(won_at, date_create)) AS month,
                SUM(forecast_amount) AS forecast_total
              FROM crm_deals
              WHERE deleted_at IS NULL
              GROUP BY DATE_TRUNC('month', COALESCE(won_at, date_create))
            ),
            sales_months AS (
              SELECT
                DATE_TRUNC('month', created_at) AS month,
                SUM(COALESCE(total_amount, total_value, 0)) AS actual_total
              FROM sales_orders
              WHERE deleted_at IS NULL
              GROUP BY DATE_TRUNC('month', created_at)
            )
            SELECT
              TO_CHAR(COALESCE(d.month, s.month), 'YYYY-MM') AS month,
              COALESCE(d.forecast_total, 0)::numeric(15,2) AS forecast,
              COALESCE(s.actual_total, 0)::numeric(15,2) AS actual,
              CASE
                WHEN COALESCE(d.forecast_total, 0) = 0 THEN NULL
                ELSE ROUND(
                  (1 - ABS(COALESCE(s.actual_total, 0) - d.forecast_total) / NULLIF(d.forecast_total, 0))
                  * 100,
                  1
                )
              END AS accuracy_percent
            FROM deal_months d
            FULL OUTER JOIN sales_months s ON d.month = s.month
            ORDER BY COALESCE(d.month, s.month) DESC
            LIMIT ${months}
          `);

      if (!periodsResult.ok) return Err(periodsResult.error);

      const periods = periodsResult.data;
      const validAccuracies = periods
        .map((p) => (p['accuracy_percent'] != null ? Number(p['accuracy_percent']) : null))
        .filter((v): v is number => v !== null);

      const avg_accuracy =
        validAccuracies.length > 0
          ? Math.round((validAccuracies.reduce((s, v) => s + v, 0) / validAccuracies.length) * 10) / 10
          : null;

      return Ok({ periods, avg_accuracy });
    } catch (_e) {
      return Err(String(_e));
    }
  }
}
