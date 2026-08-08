/**
 * @module drizzle-sd-order-sync.repo
 * @description Repository for SD order sync-scheduling (vision 06-sd#40 — Kashirovka
 *   offset+gofra). Parametrised raw SQL via `sql` template against the new
 *   sales_orders.predecessor_order_id column (no Drizzle schema object — same raw-SQL
 *   pattern as drizzle-sd-lost-orders-reclamations.repo.ts). Result<T> + repo-owns-DB.
 */

import { Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { typedExecute } from '@shared/db/typed-execute';
import { Err, AppErr, Result, safeCall } from '@common/result';
import { ISdOrderSyncRepo, OrderSyncStatusRow } from '../../domain/repositories/i-sd-order-sync.repo';

@Injectable()
export class DrizzleSdOrderSyncRepo implements ISdOrderSyncRepo {
  private readonly logger = new Logger(DrizzleSdOrderSyncRepo.name);

  // A predecessor is "complete enough" for the successor (gofra) to start when its status is one
  // of the ship-ready / terminal states from so-status.vo.ts. Fixed status whitelist (not a
  // tunable business number) — inlined as SQL literals below.
  async getSyncStatus(orderId: number): Promise<Result<OrderSyncStatusRow>> {
    return safeCall(async () => {
      const rows = await typedExecute<OrderSyncStatusRow>(sql`
        SELECT so.id AS order_id, so.order_number, so.status,
               so.predecessor_order_id,
               pred.order_number AS predecessor_order_number,
               pred.status AS predecessor_status,
               (so.predecessor_order_id IS NULL
                 OR pred.status IN ('ready_for_shipment','shipped','delivered','closed')) AS can_start
        FROM sales_orders so
        LEFT JOIN sales_orders pred ON pred.id = so.predecessor_order_id
        WHERE so.id = ${orderId} AND so.deleted_at IS NULL
        LIMIT 1
      `);
      const row = rows[0];
      if (!row) throw new Error('Buyurtma topilmadi');
      return row;
    }, 'NOT_FOUND');
  }

  async setPredecessor(orderId: number, predecessorOrderId: number | null): Promise<Result<OrderSyncStatusRow>> {
    try {
      if (predecessorOrderId !== null && predecessorOrderId === orderId) {
        return Err(AppErr('VALIDATION', "Buyurtma o'zining predecessori bo'la olmaydi"));
      }

      const self = await typedExecute<{ id: number }>(
        sql`SELECT id FROM sales_orders WHERE id = ${orderId} AND deleted_at IS NULL LIMIT 1`,
      );
      if (!self[0]) return Err(AppErr('NOT_FOUND', 'Buyurtma topilmadi'));

      if (predecessorOrderId !== null) {
        const pred = await typedExecute<{ id: number; predecessor_order_id: number | null }>(
          sql`SELECT id, predecessor_order_id FROM sales_orders WHERE id = ${predecessorOrderId} AND deleted_at IS NULL LIMIT 1`,
        );
        if (!pred[0]) return Err(AppErr('NOT_FOUND', 'Predecessor buyurtma topilmadi'));
        // Reject a direct 2-cycle (A->B while B->A) — the MES sync graph must stay acyclic.
        if (pred[0].predecessor_order_id === orderId) {
          return Err(AppErr('CONFLICT', "Sikl aniqlandi: predecessor allaqachon shu buyurtmaga bog'langan"));
        }
      }

      await typedExecute(
        sql`UPDATE sales_orders SET predecessor_order_id = ${predecessorOrderId}, updated_at = now() WHERE id = ${orderId}`,
      );

      return this.getSyncStatus(orderId);
    } catch (e) {
      this.logger.error('setPredecessor failed', e as Error);
      return Err(AppErr('DB_ERROR', (e as Error)?.message ?? 'Predecessor set failed'));
    }
  }
}
