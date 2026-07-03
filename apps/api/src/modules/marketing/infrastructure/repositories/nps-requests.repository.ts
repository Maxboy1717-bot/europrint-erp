/**
 * @module nps-requests.repository
 * @description NPS avto-yig'ish so'rovlari (nps_requests) — modul 14 Marketing (14.60).
 *   Yetkazib berish yopilgach pending so'rov yaratiladi (delivery'dan customer/order resolve).
 *   Result pattern (Qoida 1).
 *
 * NOTE: Raw SQL — INSERT...SELECT deliveries'dan resolution + ON CONFLICT dedup.
 *   ARCHITECTURE_RULES.md Rule 4.
 * @layer Repository (Marketing)
 */
import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Result, Ok, Err } from '@common/result';

export interface NpsRequestRow {
  id: number;
  delivery_id: number | null;
  sales_order_id: number | null;
  customer_id: number | null;
  customer_name: string | null;
  status: string;
  nps_response_id: number | null;
  requested_at: string;
  responded_at: string | null;
}

@Injectable()
export class NpsRequestsRepository {
  /** Yetkazib berishdan pending NPS so'rovi yaratish (customer/order deliveries'dan). Dedup: bir delivery=bir so'rov. */
  async createFromDelivery(deliveryId: number): Promise<Result<{ id: number | null }>> {
    try {
      const r = await runQuery<{ id: number }>(sql`
        INSERT INTO nps_requests (delivery_id, sales_order_id, customer_id, customer_name)
        SELECT d.id, d.sales_order_id, d.customer_id, d.customer_name
        FROM deliveries d WHERE d.id = ${deliveryId}
        ON CONFLICT (delivery_id) WHERE delivery_id IS NOT NULL DO NOTHING
        RETURNING id
      `);
      return Ok({ id: r.rows[0]?.id ?? null });
    } catch (e) { return Err({ message: (e as Error).message, code: 'DB_ERROR' }); }
  }

  async list(pendingOnly: boolean): Promise<Result<NpsRequestRow[]>> {
    try {
      const f = pendingOnly ? sql`WHERE status = 'pending'` : sql``;
      const r = await runQuery<NpsRequestRow>(sql`
        SELECT id, delivery_id, sales_order_id, customer_id, customer_name, status,
               nps_response_id, requested_at, responded_at
        FROM nps_requests ${f}
        ORDER BY (status = 'pending') DESC, id DESC
      `);
      return Ok(r.rows);
    } catch (e) { return Err({ message: (e as Error).message, code: 'DB_ERROR' }); }
  }

  /** So'rovni 'responded' deb belgilash (NPS javobi kelganda). */
  async markResponded(id: number, npsResponseId: number | null): Promise<Result<void>> {
    try {
      const r = await runQuery<{ id: number }>(sql`
        UPDATE nps_requests
        SET status = 'responded', responded_at = NOW(), nps_response_id = COALESCE(${npsResponseId}, nps_response_id)
        WHERE id = ${id} AND status = 'pending'
        RETURNING id
      `);
      if (r.rows.length === 0) return Err({ message: 'Pending so\'rov topilmadi', code: 'CONFLICT' });
      return Ok(undefined);
    } catch (e) { return Err({ message: (e as Error).message, code: 'DB_ERROR' }); }
  }
}
