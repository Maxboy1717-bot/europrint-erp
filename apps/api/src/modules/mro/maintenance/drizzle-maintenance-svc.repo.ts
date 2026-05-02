import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { equipmentMaintenance } from '@europrint/schemas';
import { eq, isNull, desc } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { IMaintenanceSvcRepository } from './i-maintenance-svc.repo';

@Injectable()
export class DrizzleMaintenanceSvcRepository implements IMaintenanceSvcRepository {
  async findAll(): Promise<Result<object[]>> {
    try {
      const rows = await db.select().from(equipmentMaintenance).where(isNull(equipmentMaintenance.deletedAt)).orderBy(desc(equipmentMaintenance.createdAt));
      return Ok(rows);
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Texnik xizmatlar topilmadi');
    }
  }

  async findById(id: number): Promise<Result<any | null>> {
    try {
      const rows = await db.select().from(equipmentMaintenance).where(eq(equipmentMaintenance.id, id));
      return Ok((rows)[0] || null);
    } catch (e: unknown) {
      return Err((e as Error)?.message || `Texnik xizmat #${id} topilmadi`);
    }
  }

  async create(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.insert(equipmentMaintenance).values({ ...dto } as typeof equipmentMaintenance.$inferInsert).returning();
      return Ok((result[0] as Record<string, unknown>));
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Yaratishda xatolik');
    }
  }
}
