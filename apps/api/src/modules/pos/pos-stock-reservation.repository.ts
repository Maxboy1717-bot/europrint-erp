/**
 * @module pos-stock-reservation.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();

import { Injectable, Logger } from '@nestjs/common';
import { stockReservations, db, sql, eq, and } from '@workspace/db';
import { safeCall, Result } from '@common/result';

type Row = Record<string, unknown>;
type ReservationRow = typeof stockReservations.$inferSelect;
const exec = async (q: Parameters<typeof db.execute>[0]): Promise<Row[]> => {
  return (await db.execute(q)).rows as Row[];
};

@Injectable()
export class PosStockReservationRepository {
  private readonly logger = new Logger(PosStockReservationRepository.name);

  async getAvailableStock(materialCardId: number, warehouseId: string): Promise<Result<{ on_hand: number; already_reserved: number }>> {
    return safeCall(async () => {
      const r = await exec(sql`SELECT COALESCE(cs.quantity_on_hand, 0) AS on_hand, COALESCE((SELECT SUM(reserved_qty) FROM stock_reservations WHERE material_card_id = ${materialCardId} AND warehouse_id = ${warehouseId} AND status = 'ACTIVE'), 0) AS already_reserved FROM current_stock cs WHERE cs.material_card_id = ${materialCardId} AND cs.warehouse_id = ${warehouseId} LIMIT 1`);
      const row = r[0] ?? {};
      return { on_hand: Number(row.on_hand ?? 0), already_reserved: Number(row.already_reserved ?? 0) };
      }, 'DB_ERROR');
  }

  async createReservation(data: Omit<typeof stockReservations.$inferInsert, 'id'>): Promise<Result<ReservationRow | undefined>> {
    return safeCall(async () => {
      const [reservation] = await db.insert(stockReservations).values(data).returning();
      return reservation;
      }, 'DB_ERROR');
  }

  async findById(reservationId: number): Promise<Result<ReservationRow | null>> {
    return safeCall(async () => {
      const [reservation] = await db.select().from(stockReservations).where(eq(stockReservations.id, reservationId));
      return reservation ?? null;
      }, 'DB_ERROR');
  }

  async cancelById(reservationId: number): Promise<Result<ReservationRow | undefined>> {
    return safeCall(async () => {
      const [updated] = await db.update(stockReservations).set({ status: 'CANCELLED' }).where(eq(stockReservations.id, reservationId)).returning();
      return updated;
      }, 'DB_ERROR');
  }

  async fulfillByMovementId(posMovementId: number): Promise<void> {
    await db.update(stockReservations).set({ status: 'FULFILLED', issuedAt: _time.now() }).where(and(sql`${stockReservations}.pos_movement_id = ${posMovementId}`, eq(stockReservations.status, 'ACTIVE')));
  }

  async expireOldReservations(): Promise<Result<number>> {
    return safeCall(async () => {
      const r = await exec(sql`UPDATE stock_reservations SET status = 'EXPIRED', updated_at = NOW() WHERE status = 'ACTIVE' AND expires_at < NOW() RETURNING id`);
      const count = r.length;
      if (count > 0) this.logger.log(`Muddati o'tgan bron tozalandi: ${count} ta`);
      return count;
      }, 'DB_ERROR');
  }
}
