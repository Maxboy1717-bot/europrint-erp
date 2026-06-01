/**
 * @module sap.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import { db , runQuery } from '@shared/db';
import { safeCall, Result } from '@common/result';

type Row = Record<string, unknown>;
const exec = async (q: SQL | SQLWrapper): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

@Injectable()
export class SapRepository {
  async listSalesOrders(status: string | null, lim: number, off: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = status
        ? await exec(sql`SELECT so.*, c.name AS customer_name FROM sap_sales_orders so LEFT JOIN sd_customers c ON c.id = so.customer_id WHERE so.status = ${status} ORDER BY so.created_at DESC LIMIT ${lim} OFFSET ${off}`)
        : await exec(sql`SELECT so.*, c.name AS customer_name FROM sap_sales_orders so LEFT JOIN sd_customers c ON c.id = so.customer_id ORDER BY so.created_at DESC LIMIT ${lim} OFFSET ${off}`);
      if (rows.length === 0) {
        return status
          ? exec(sql`SELECT o.id, o.order_number, o.status, o.total_amount, o.created_at, c.name AS customer_name, 'sap_sync' AS source FROM sales_orders o LEFT JOIN sd_customers c ON c.id = o.customer_id WHERE o.status = ${status} ORDER BY o.created_at DESC LIMIT ${lim} OFFSET ${off}`)
          : exec(sql`SELECT o.id, o.order_number, o.status, o.total_amount, o.created_at, c.name AS customer_name, 'sap_sync' AS source FROM sales_orders o LEFT JOIN sd_customers c ON c.id = o.customer_id ORDER BY o.created_at DESC LIMIT ${lim} OFFSET ${off}`);
      }
      return rows;
      }, 'DB_ERROR');
  }

  async getSalesOrder(id: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const r = await exec(sql`SELECT * FROM sap_sales_orders WHERE id = ${id}`);
      if (r.length > 0) return r[0];
      const fallback = await exec(sql`SELECT o.*, c.name AS customer_name FROM sales_orders o LEFT JOIN sd_customers c ON c.id = o.customer_id WHERE o.id = ${id}`);
      return fallback[0] ?? null;
      }, 'DB_ERROR');
  }

  async updateSalesOrder(id: number, body: Row): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const r = await exec(sql`UPDATE sap_sales_orders SET status = COALESCE(${body['status'] ?? null}, status), notes = COALESCE(${body['notes'] ?? null}, notes), updated_at = NOW() WHERE id = ${id} RETURNING *`);
      if (r.length > 0) return r[0];
      const fallback = await exec(sql`UPDATE sales_orders SET status = COALESCE(${body['status'] ?? null}, status), updated_at = NOW() WHERE id = ${id} RETURNING *`);
      return fallback[0] ?? null;
      }, 'DB_ERROR');
  }

  async createSalesOrder(body: Row): Promise<Result<Row>> {
    return safeCall(async () => {
      const today = new Date().toISOString().split('T')[0] as string;
      const docNumber = `SAP-${Date.now()}`;
      const totalAmount = parseFloat(String(body['totalAmount'] ?? '0')) || 0;
      const customerId = body['customerId'] != null ? parseInt(String(body['customerId']), 10) : null;
      const notes = body['notes'] != null ? String(body['notes']) : null;
      const r = await exec(sql`
        INSERT INTO sales_orders
          (document_number, order_date, pricing_date, customer_id, net_value, total_value, total_amount, notes)
        VALUES
          (${docNumber}, ${today}, ${today}, ${customerId}, ${totalAmount}, ${totalAmount}, ${totalAmount}, ${notes})
        RETURNING *
      `);
      return r[0] as Row;
    }, 'DB_ERROR');
  }

  async deleteSalesOrder(id: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      // Try sap_sales_orders first, then canonical sales_orders (soft-delete)
      const r = await exec(sql`
        UPDATE sap_sales_orders
        SET status = 'CANCELLED', updated_at = NOW()
        WHERE id = ${id} RETURNING id, status
      `);
      if (r.length > 0) return r[0] as Row;
      const fallback = await exec(sql`
        UPDATE sales_orders
        SET overall_status = 'CANCELLED', master_status = 'cancelled', updated_at = NOW()
        WHERE id = ${id} RETURNING id, overall_status
      `);
      return fallback[0] ?? null;
    }, 'DB_ERROR');
  }
}
