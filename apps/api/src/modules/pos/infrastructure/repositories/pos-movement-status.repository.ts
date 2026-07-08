/**
 * @module pos-movement-status.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Ok, Err, Result, AppErr, AppErrorCode } from '@common/result';
import { Injectable } from '@nestjs/common';
import { posMovements, posMovementLines, posMovementTypes, materialCards, db, eq, sql } from '@workspace/db';
import { execCurrentStockUpsert, execCurrentStockDecrement } from '@common/database/queries-remaining';

type PosMovement     = typeof posMovements.$inferSelect;
type PosMovementLine = typeof posMovementLines.$inferSelect;
type PosMovementType = typeof posMovementTypes.$inferSelect;

@Injectable()
export class PosMovementStatusRepository {
  async findMovement(movementId: number): Promise<Result<PosMovement | null>> {
    try {
      const [movement] = await db.select().from(posMovements).where(eq(posMovements.id, movementId));
      return Ok(movement ?? null);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async updateMovementStatus(movementId: number, updateData: Partial<typeof posMovements.$inferInsert>): Promise<Result<PosMovement>> {
    try {
      const [updated] = await db.update(posMovements).set(updateData).where(eq(posMovements.id, movementId)).returning();
      return Ok(updated);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async updateQcDecision(movementId: number, updateData: Partial<typeof posMovements.$inferInsert>): Promise<Result<PosMovement>> {
    try {
      const [updated] = await db.update(posMovements).set(updateData).where(eq(posMovements.id, movementId)).returning();
      return Ok(updated);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async getMovementLines(movementId: number): Promise<Result<PosMovementLine[]>> {
    try {
      return Ok(await db.select().from(posMovementLines).where(eq(posMovementLines.movementId, movementId)));
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async getMovementType(typeId: number): Promise<Result<PosMovementType | null>> {
    try {
      const [movType] = await db.select().from(posMovementTypes).where(eq(posMovementTypes.id, typeId));
      return Ok(movType ?? null);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async upsertStockIn(matId: number, warehouseId: unknown, qty: number): Promise<Result<void>> {
    try {
      await execCurrentStockUpsert(matId, warehouseId, qty);
      return Ok();
    } catch (_e) {
      return Err(String(_e));
    }
  }

  /**
   * VISION-3340 #57: execCurrentStockDecrement() now performs a guarded conditional UPDATE
   * (`available_quantity >= qty ... RETURNING id`) instead of an unconditional floor-at-0
   * write. When the guard fails (overdraw / concurrent movement already consumed the stock)
   * it returns `false` — surface that here as Err(INSUFFICIENT_STOCK) instead of the old
   * behaviour of silently returning Ok() no matter what happened in the DB.
   */
  async decrementStock(matId: number, warehouseId: unknown, qty: number): Promise<Result<void>> {
    try {
      const updated = await execCurrentStockDecrement(matId, warehouseId, qty);
      if (!updated) {
        return Err(AppErr(
          'INSUFFICIENT_STOCK' as AppErrorCode,
          `Yetarli qoldiq yo'q: material=${matId}, ombor=${String(warehouseId)}, miqdor=${qty}`,
        ));
      }
      return Ok();
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async getMaterialMinInterval(matId: number): Promise<Result<number | null>> {
    try {
      const [card] = await db.select({ minIntervalDays: sql<number>`0` }).from(materialCards).where(eq(materialCards.id, matId));
      return Ok(card?.minIntervalDays ?? null);
    } catch (_e) {
      return Err(String(_e));
    }
  }
}
