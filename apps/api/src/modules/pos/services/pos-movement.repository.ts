import { Ok, Err, Result } from '@common/result';
import { Injectable } from '@nestjs/common';
import { posMovements, posMovementLines, posMovementTypes, warehouses, db, eq, sql } from '@workspace/db';
import { execPosDamageQcLinkInsert } from '@common/database/queries-remaining';

type PosMovement     = typeof posMovements.$inferSelect;
type PosMovementLine = typeof posMovementLines.$inferSelect;
type PosMovementType = typeof posMovementTypes.$inferSelect;
type WarehouseTypeRow = { type: string | null };
type WarehouseIds = { fromWarehouseId: string | null; toWarehouseId: string | null };

@Injectable()
export class PosMovementRepository {
  async findMovementType(id: number): Promise<Result<PosMovementType | null>> {
    try {
      const [movType] = await db.select().from(posMovementTypes).where(eq(posMovementTypes.id, id));
      return Ok(movType ?? null);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async findMovementTypeByCode(code: string): Promise<Result<PosMovementType | null>> {
    try {
      const [movType] = await db.select().from(posMovementTypes).where(eq(posMovementTypes.code, code));
      return Ok(movType ?? null);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async findWarehouseType(id: string): Promise<Result<WarehouseTypeRow | null>> {
    try {
      const [wh] = await db.select({ type: warehouses.type }).from(warehouses).where(eq(warehouses.id, id));
      return Ok(wh ?? null);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async countMovements(): Promise<Result<number>> {
    try {
      const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(posMovements);
      return Ok(Number(count));
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async insertMovement(movRow: Omit<typeof posMovements.$inferInsert, 'id'>): Promise<Result<PosMovement>> {
    try {
      const [movement] = await db.insert(posMovements).values(movRow).returning();
      return Ok(movement);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async getMaxLineSequence(movementId: number): Promise<Result<number>> {
    try {
      const [{ maxSeq }] = await db.select({ maxSeq: sql<number>`COALESCE(MAX(fifo_sequence), 0)` }).from(posMovementLines).where(eq(posMovementLines.movementId, movementId));
      return Ok(Number(maxSeq));
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async insertLines(values: Omit<typeof posMovementLines.$inferInsert, 'id'>[]): Promise<Result<PosMovementLine[]>> {
    try {
      return Ok(await db.insert(posMovementLines).values(values).returning());
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async findMovementWarehouseIds(movementId: number): Promise<Result<WarehouseIds | null>> {
    try {
      const [movement] = await db.select({ fromWarehouseId: posMovements.fromWarehouseId, toWarehouseId: posMovements.toWarehouseId }).from(posMovements).where(eq(posMovements.id, movementId));
      return Ok(movement ?? null);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async updateMovementStatus(id: number, status: string): Promise<Result<void>> {
    try {
      type MovStatus = typeof posMovements.$inferInsert['status'];
      await db.update(posMovements).set({ status: status as MovStatus }).where(eq(posMovements.id, id));
      return Ok(undefined);
    } catch (e) {
      return Err(String(e));
    }
  }

  async insertDamageQcLink(damageMovementId: number, originalMovementId: number, materialCardId: number, damagedQty: number, damageDescription: string): Promise<Result<void>> {
    try {
      await execPosDamageQcLinkInsert(damageMovementId, originalMovementId, materialCardId, damagedQty, damageDescription);
      return Ok();
    } catch (_e) {
      return Err(String(_e));
    }
  }
}
