import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { users } from '@europrint/schemas';
import { eq, and, isNull, ilike, count, desc } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { IEmployeesRepository } from './i-employees.repo';

type Row = Record<string, unknown>;
@Injectable()
export class DrizzleEmployeesRepository implements IEmployeesRepository {
  async findAll(opts: { limit: number; offset: number; search?: string; departmentId?: number; status?: string }): Promise<Result<{ data: Row[]; count: number }>> {
    try {
      const { limit, offset, search, departmentId, status } = opts;
      const conditions = [isNull(users.deletedAt)];
      if (search) conditions.push(ilike(users.fullName, `%${search}%`));
      if (departmentId) conditions.push(eq(users.departmentId, departmentId));
      if (status) conditions.push(eq(users.status, status));
      const wh = and(...conditions);
      const [countResult, data] = await Promise.all([
        db.select({ count: count() }).from(users).where(wh).limit(1).offset(0),
        db.select().from(users).where(wh).orderBy(desc(users.createdAt)).limit(limit).offset(offset),
      ]);
      return Ok({ data, count: Number(countResult[0]?.count || 0) });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Xodimlar topilmadi'); }
  }

  async findById(id: number): Promise<Result<any | null>> {
    try {
      const rows = await db.select().from(users).where(and(eq(users.id, id), isNull(users.deletedAt))).limit(1).offset(0);
      return Ok((rows)[0] || null);
    } catch (e: unknown) { return Err((e as Error)?.message || `Xodim #${id} topilmadi`); }
  }

  async findByDepartment(departmentId: number, limit: number, offset: number, search?: string, status?: string): Promise<Result<{ data: Row[]; count: number }>> {
    try {
      const conditions = [isNull(users.deletedAt)];
      if (departmentId) conditions.push(eq(users.departmentId, departmentId));
      if (search) conditions.push(ilike(users.fullName, `%${search}%`));
      if (status) conditions.push(eq(users.status, status));
      const wh = and(...conditions);
      const [countResult, data] = await Promise.all([
        db.select({ count: count() }).from(users).where(wh).limit(1).offset(0),
        db.select().from(users).where(wh).orderBy(desc(users.createdAt)).limit(limit).offset(offset),
      ]);
      return Ok({ data, count: Number(countResult[0]?.count || 0) });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Bo\'lim xodimlari topilmadi'); }
  }

  async findSelf(userId: number, limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>> {
    try {
      const wh = and(isNull(users.deletedAt), eq(users.id, userId));
      const [countResult, data] = await Promise.all([
        db.select({ count: count() }).from(users).where(wh).limit(1).offset(0),
        db.select().from(users).where(wh).orderBy(desc(users.createdAt)).limit(limit).offset(offset),
      ]);
      return Ok({ data, count: Number(countResult[0]?.count || 0) });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Xodim topilmadi'); }
  }

  async create(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.insert(users).values({ ...dto, status: dto.status || 'active' } as typeof users.$inferInsert).returning();
      return Ok((result[0] as Record<string, unknown>));
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yaratishda xatolik'); }
  }

  async update(id: number, dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.update(users).set(dto as Partial<typeof users.$inferInsert>).where(eq(users.id, id)).returning();
      return Ok((result[0] as Record<string, unknown>));
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yangilashda xatolik'); }
  }

  async softDelete(id: number): Promise<Result<void>> {
    try {
      await db.update(users).set({ deletedAt: _time.now() }).where(eq(users.id, id));
      return Ok(undefined);
    } catch (e: unknown) { return Err((e as Error)?.message || 'O\'chirishda xatolik'); }
  }
}
