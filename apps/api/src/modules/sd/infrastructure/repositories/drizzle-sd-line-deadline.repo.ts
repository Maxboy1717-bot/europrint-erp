/**
 * @module drizzle-sd-line-deadline.repo
 * @description Repository impl for SD per-line deadline scheduling (06-sd #29).
 *   Parametrised raw SQL via `sql` template + typedExecute (no Drizzle schema object
 *   imports for the two new columns — same pattern as drizzle-sd-lost-orders-reclamations.repo.ts).
 *   effective_deadline is computed with COALESCE(line_deadline, sales_orders.delivery_date).
 */

import { Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { typedExecute } from '@shared/db/typed-execute';
import { Result, safeCall } from '@common/result';
import {
  ISdLineDeadlineRepo, LineDeadlineRow, OrderLineDeadlines,
  PerLineSchedulingRow, SetLineDeadlineInput,
} from '../../domain/repositories/i-sd-line-deadline.repo';

@Injectable()
export class DrizzleSdLineDeadlineRepo implements ISdLineDeadlineRepo {
  private readonly logger = new Logger(DrizzleSdLineDeadlineRepo.name);

  async getOrderLineDeadlines(orderId: number): Promise<Result<OrderLineDeadlines>> {
    return safeCall(async () => {
      const header = await typedExecute<{ id: number; per_line_scheduling: boolean; delivery_date: string | null }>(sql`
        SELECT id, per_line_scheduling, delivery_date
        FROM sales_orders WHERE id = ${orderId} LIMIT 1
      `);
      const h = header[0];
      if (!h) throw new Error('Sotuv buyurtmasi topilmadi');
      const lines = await typedExecute<LineDeadlineRow>(sql`
        SELECT id, item_number, description, line_deadline,
               COALESCE(line_deadline, ${h.delivery_date ?? null}::timestamptz) AS effective_deadline
        FROM sales_order_items
        WHERE sales_order_id = ${orderId}
        ORDER BY id
      `);
      return {
        sales_order_id: h.id,
        per_line_scheduling: h.per_line_scheduling,
        order_deadline: h.delivery_date ?? null,
        lines,
      };
    }, 'NOT_FOUND');
  }

  async setPerLineScheduling(orderId: number, enabled: boolean): Promise<Result<PerLineSchedulingRow>> {
    return safeCall(async () => {
      const rows = await typedExecute<PerLineSchedulingRow>(sql`
        UPDATE sales_orders
        SET per_line_scheduling = ${enabled}, updated_at = now()
        WHERE id = ${orderId}
        RETURNING id AS sales_order_id, per_line_scheduling
      `);
      const row = rows[0];
      if (!row) throw new Error('Sotuv buyurtmasi topilmadi');
      return row;
    }, 'NOT_FOUND');
  }

  async setLineDeadline(input: SetLineDeadlineInput): Promise<Result<LineDeadlineRow>> {
    return safeCall(async () => {
      const rows = await typedExecute<LineDeadlineRow>(sql`
        UPDATE sales_order_items soi
        SET line_deadline = ${input.deadline ?? null}::timestamptz
        FROM sales_orders so
        WHERE soi.id = ${input.itemId} AND so.id = soi.sales_order_id
        RETURNING soi.id, soi.item_number, soi.description, soi.line_deadline,
                  COALESCE(soi.line_deadline, so.delivery_date) AS effective_deadline
      `);
      const row = rows[0];
      if (!row) throw new Error('Buyurtma qatori topilmadi');
      return row;
    }, 'NOT_FOUND');
  }
}
