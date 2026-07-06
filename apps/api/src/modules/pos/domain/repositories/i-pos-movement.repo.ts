/**
 * @module i-pos-movement.repo
 * @description Domain repository interface for POS movements (transfers,
 *   issuances, damage links). Decouples `PosMovementService` from the
 *   concrete Drizzle implementation (DDD C.19).
 * @layer Domain (POS)
 */

import type { Result } from '@common/result';
import type { posMovements, posMovementLines, posMovementTypes, posMovementContext } from '@workspace/db';

type PosMovement       = typeof posMovements.$inferSelect;
type PosMovementLine   = typeof posMovementLines.$inferSelect;
type PosMovementType   = typeof posMovementTypes.$inferSelect;
type PosMovementCtxRow = typeof posMovementContext.$inferSelect;
export type PosMovementContextInsert = Omit<typeof posMovementContext.$inferInsert, 'id'>;
type WarehouseTypeRow = { type: string | null };
type WarehouseIds     = { fromWarehouseId: string | null; toWarehouseId: string | null };

export const POS_MOVEMENT_REPO = Symbol('POS_MOVEMENT_REPO');

export interface IPosMovementRepository {
  findMovementType(id: number): Promise<Result<PosMovementType | null>>;
  findMovementTypeByCode(code: string): Promise<Result<PosMovementType | null>>;
  findWarehouseType(id: string): Promise<Result<WarehouseTypeRow | null>>;
  countMovements(): Promise<Result<number>>;
  insertMovement(movRow: Omit<typeof posMovements.$inferInsert, 'id'>): Promise<Result<PosMovement>>;
  /** Idempotency (2026-07-01): double-tap/retry himoyasi uchun kalit bo'yicha izlash. */
  findMovementByIdempotencyKey(idempotencyKey: string): Promise<Result<PosMovement | null>>;
  getMaxLineSequence(movementId: number): Promise<Result<number>>;
  insertLines(values: Omit<typeof posMovementLines.$inferInsert, 'id'>[]): Promise<Result<PosMovementLine[]>>;
  findMovementWarehouseIds(movementId: number): Promise<Result<WarehouseIds | null>>;
  updateMovementStatus(id: number, status: string): Promise<Result<void>>;
  insertDamageQcLink(
    damageMovementId: number,
    originalMovementId: number,
    materialCardId: number,
    damagedQty: number,
    damageDescription: string,
  ): Promise<Result<void>>;
  /**
   * ADDITIVE (2026-06-27): yangi harakat turlari (WASTE_IN / LAB_SAMPLE_OUT /
   * PARTIAL_RECEIPT / CUSTOMER_MATERIAL) uchun qo'shimcha kontekst saqlash.
   * movement_id UNIQUE — qayta yozishda upsert.
   */
  upsertMovementContext(row: PosMovementContextInsert): Promise<Result<PosMovementCtxRow>>;
  /**
   * G2-1 QABUL-TOLERANS (2026-07-04, SB0544): PO qatoridagi buyurtma
   * miqdorini o'qiydi (EXTERNAL_IN qabul-toleransini hisoblash uchun).
   */
  findPoLineQty(poId: number, materialCardId: number): Promise<Result<number | null>>;
  /**
   * F6 sub-fix 3 (ACCOUNTING-STANDARDS-AUDIT-2026-07-06): latest currency->UZS rate from the
   * canonical `exchange_rates` table (mirrors cashier-hub's findLatestExchangeRate). Returns null
   * when no rate row exists — the caller then GATES rather than fabricating a 1:1 rate.
   */
  findLatestExchangeRate(currency: string): Promise<Result<number | null>>;
}
