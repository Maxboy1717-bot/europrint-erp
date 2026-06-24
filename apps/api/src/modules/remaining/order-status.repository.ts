/**
 * @module order-status.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Ok, Err, Result } from '@common/result';
import { Injectable } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { execSalesOrderStatusUpdate, execOrderStatusLogInsert } from '@common/database/queries-remaining';
import { sql } from 'drizzle-orm';

type Row = Record<string, unknown>;

@Injectable()
export class OrderStatusRepository {
  async getStatusLog(orderId: string): Promise<Result<Row[]>>  {
  try {  
      const rows = await runQuery<Row>(sql`
        SELECT osl.*, (u.first_name || ' ' || u.last_name) AS changed_by_name
        FROM order_status_logs osl
        LEFT JOIN users u ON u.id = osl.changed_by
        WHERE osl.order_id = ${orderId}
        ORDER BY osl.created_at DESC
      `);
      return Ok(rows.rows as Row[]);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async insertTransitionLog(orderId: string, newStatus: string, userId: number, notes: unknown): Promise<Result<Row>>  {
  try {
      // FIX (iter-77): order_status_logs.sales_order_id is NOT NULL (no default) but the INSERT
      // only wrote the legacy nullable order_id → every transition log raised 23502 (silently
      // breaking OrderStatusPage logging). Write sales_order_id = order_id = sales_orders.id.
      const rows = await runQuery<Row>(sql`
        INSERT INTO order_status_logs (sales_order_id, order_id, from_status, to_status, changed_by, notes, created_at)
        SELECT id, id, status, ${newStatus}, ${userId}, ${notes ?? null}, NOW()
        FROM sales_orders WHERE id::text = ${orderId}
        RETURNING *
      `);
      return Ok(rows.rows[0] as Row);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async updateOrderStatus(orderId: string, newStatus: string): Promise<Result<void>>  {
  try {  
      await execSalesOrderStatusUpdate(orderId, newStatus);  return Ok();  } catch (_e) {
    return Err(String(_e));
  }

  }

  async insertDesignApprovalLog(orderId: string, userId: number): Promise<Result<void>>  {
  try {  
      await execOrderStatusLogInsert(orderId, userId);  return Ok();  } catch (_e) {
    return Err(String(_e));
  }

  }
}
