import { eq, isNull, db } from '@workspace/db';
import { Injectable } from '@nestjs/common';
import { posMovementTypes, posMovements } from '@workspace/db';
import { Result, Ok, Err } from '@common/result';
import { IPosSvcRepository } from './i-pos-svc.repo';

@Injectable()
export class DrizzlePosSvcRepository implements IPosSvcRepository {
  async findMovementTypes(): Promise<Result<object[]>> {
    try {
      const rows = await db.select().from(posMovementTypes).where(eq(posMovementTypes.isActive, true)).orderBy(posMovementTypes.id);
      return Ok(rows);
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Harakat turlari topilmadi');
    }
  }

  async findMovementTypeByCode(code: string): Promise<Result<any | null>> {
    try {
      const rows = await db.select().from(posMovementTypes).where(eq(posMovementTypes.code, code));
      return Ok((rows)[0] || null);
    } catch (e: unknown) {
      return Err((e as Error)?.message || `Harakat turi '${code}' topilmadi`);
    }
  }

  async createMovementType(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const row: Omit<typeof posMovementTypes.$inferInsert, 'id'> = {
        name: (dto.name as string | undefined) ?? '',
        code: (dto.code as string | undefined) ?? 'CODE',
        direction: (dto.direction as string | undefined) ?? 'in',
        isActive: true,
      };
      const result = await db.insert(posMovementTypes).values(row as typeof posMovementTypes.$inferInsert).returning();
      return Ok((result[0] as Record<string, unknown>));
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Yaratishda xatolik');
    }
  }

  async findMovements(limit: number, offset: number): Promise<Result<object[]>> {
    try {
      const rows = await db.select().from(posMovements).where(isNull(posMovements.deletedAt)).limit(limit).offset(offset);
      return Ok(rows);
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Harakatlar topilmadi');
    }
  }

  async findMovementById(id: number): Promise<Result<any | null>> {
    try {
      const rows = await db.select().from(posMovements).where(eq(posMovements.id, id));
      return Ok((rows)[0] || null);
    } catch (e: unknown) {
      return Err((e as Error)?.message || `Harakat #${id} topilmadi`);
    }
  }

  async createMovement(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      type MovInsert = typeof posMovements.$inferInsert;
      const insert = {
        movementNumber: String(dto['movementNumber'] ?? `MOV-${Date.now()}`),
        movementType: String(dto['movementTypeId'] ?? dto['movementType'] ?? 'EXTERNAL_IN') as MovInsert['movementType'],
        toWarehouseId: (dto['destinationWarehouseId'] ?? dto['toWarehouseId']) != null ? String(dto['destinationWarehouseId'] ?? dto['toWarehouseId']) : null,
        fromWarehouseId: (dto['sourceWarehouseId'] ?? dto['fromWarehouseId']) != null ? String(dto['sourceWarehouseId'] ?? dto['fromWarehouseId']) : null,
        status: 'draft' as MovInsert['status'],
        createdBy: (dto['createdBy'] as number | undefined) ?? 0,
      } satisfies Partial<MovInsert>;
      const result = await db.insert(posMovements).values(insert as MovInsert).returning();
      return Ok((result[0] as Record<string, unknown>));
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Yaratishda xatolik');
    }
  }

  async updateMovementStatus(id: number, status: string): Promise<Result<Record<string, unknown>>> {
    try {
      type MovStatus = typeof posMovements.$inferInsert['status'];
      const result = await db.update(posMovements).set({ status: status as MovStatus }).where(eq(posMovements.id, id)).returning();
      return Ok((result[0] as Record<string, unknown>));
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Holat yangilashda xatolik');
    }
  }
}
