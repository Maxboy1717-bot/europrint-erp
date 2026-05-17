/**
 * @module i-pos-movement.repo
 * @description Domain repository interface for POS movements (transfers,
 *   issuances, damage links). Decouples `PosMovementService` from the
 *   concrete Drizzle implementation (DDD C.19).
 * @layer Domain (POS)
 */

import type { Result } from '@common/result';
import type { posMovements, posMovementLines, posMovementTypes } from '@workspace/db';

type PosMovement      = typeof posMovements.$inferSelect;
type PosMovementLine  = typeof posMovementLines.$inferSelect;
type PosMovementType  = typeof posMovementTypes.$inferSelect;
type WarehouseTypeRow = { type: string | null };
type WarehouseIds     = { fromWarehouseId: string | null; toWarehouseId: string | null };

export const POS_MOVEMENT_REPO = Symbol('POS_MOVEMENT_REPO');

export interface IPosMovementRepository {
  findMovementType(id: number): Promise<Result<PosMovementType | null>>;
  findMovementTypeByCode(code: string): Promise<Result<PosMovementType | null>>;
  findWarehouseType(id: string): Promise<Result<WarehouseTypeRow | null>>;
  countMovements(): Promise<Result<number>>;
  insertMovement(movRow: Omit<typeof posMovements.$inferInsert, 'id'>): Promise<Result<PosMovement>>;
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
}
