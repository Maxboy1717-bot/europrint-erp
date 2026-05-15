/**
 * @module get-order-status.tool
 */

// RULE4_EXCEPTION: AIsha tools intentionally use raw SQL. Each tool
// aggregates across cross-module tables (sales, production, HR, finance,
// security, IoT, kanban, calendar) that the AIsha module does not own.
// Importing every Drizzle schema would create tight coupling between
// AIsha and every other domain module. The read-only / single-INSERT
// raw SQL keeps AIsha a loose query-adapter layer over the ERP. Drizzle
// ORM is used elsewhere; see [[aisha-final-report]] for the
// architectural rationale.

import { Injectable } from '@nestjs/common';
import { Result, Err, AppErr, safeCall } from '@common/result';
import { sql } from 'drizzle-orm';
import { db } from '@shared/db';
import type { IAishaTool, ToolResult } from '../../domain/tool.interface';
import { provSource, provResult, rowsOf } from './_helpers';

export interface OrderStatus {
  orderId: string; orderNumber: string; customer: string;
  status: string; progress: number; deliveryDate: string | null;
}

@Injectable()
export class GetOrderStatusTool implements IAishaTool {
  readonly definition = {
    name: 'get_order_status',
    description: 'Buyurtmaning statusi: progress, status, yetkazib berish sanasi.',
    input_schema: {
      type: 'object' as const,
      properties: {
        orderId:      { type: 'string', description: 'Buyurtma raqami yoki IDsi' },
        customerName: { type: 'string', description: 'Mijoz nomi (orderId o\'rniga)' },
      },
    },
  };

  async execute(input: Record<string, unknown>): Promise<Result<ToolResult<OrderStatus[]>>> {
    const orderId = String(input['orderId'] ?? '');
    const customer = String(input['customerName'] ?? '');
    if (!orderId && !customer) return Err(AppErr('VALIDATION', 'orderId yoki customerName kerak'));

    return safeCall<ToolResult<OrderStatus[]>>(async () => {
      const start = Date.now();
      const rows = rowsOf<{
        id: string; order_number: string; customer_name: string;
        status: string; progress_percent: number; delivery_date: string | null;
      }>(await db.execute(sql`
        SELECT id, order_number, customer_name, status, progress_percent, delivery_date
        FROM sales_orders
        WHERE (${orderId} = '' OR order_number = ${orderId} OR id::text = ${orderId})
          AND (${customer} = '' OR LOWER(customer_name) LIKE LOWER('%' || ${customer} || '%'))
        ORDER BY created_at DESC LIMIT 20
      `));
      const data = rows.map(r => ({
        orderId: r.id, orderNumber: r.order_number, customer: r.customer_name,
        status: r.status, progress: r.progress_percent ?? 0,
        deliveryDate: r.delivery_date,
      }));
      return provResult<OrderStatus[]>({
        data,
        sources: [provSource({ type: 'database', identifier: 'sd.sales_orders', startMs: start, rowCount: data.length })],
        citations: data.slice(0, 5).map(o => ({ label: o.orderNumber, url: `/sd/orders/${o.orderId}` })),
      });
    });
  }
}
