/**
 * @module drizzle-hr-leave-svc.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { leaveRequests, users } from '@europrint/schemas';
import { eq, and, isNull, count, desc } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { IHrLeaveSvcRepository } from './i-hr-leave-svc.repo';

type Row = Record<string, unknown>;
@Injectable()
export class DrizzleHrLeaveSvcRepository implements IHrLeaveSvcRepository {
  async findAll(opts: { limit: number; offset: number; userId?: number; status?: string; leaveType?: string }): Promise<Result<{ data: Row[]; count: number }>> {
    try {
      const { limit, offset, userId, status, leaveType } = opts;
      const conditions = [isNull(leaveRequests.deletedAt)];
      if (userId) conditions.push(eq(leaveRequests.userId, userId));
      if (status) conditions.push(eq(leaveRequests.status, status));
      if (leaveType) conditions.push(eq(leaveRequests.leaveType, leaveType));
      const wh = and(...conditions);
      const [data, countResult] = await Promise.all([
        db.select().from(leaveRequests).where(wh).orderBy(desc(leaveRequests.createdAt)).limit(limit).offset(offset),
        db.select({ count: count() }).from(leaveRequests).where(wh).limit(1).offset(0),
      ]);
      return Ok({ data, count: Number(countResult[0]?.count || 0) });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Ta\'til so\'rovlari topilmadi'); }
  }

  async findById(id: number): Promise<Result<any | null>> {
    try {
      const rows = await db.select().from(leaveRequests).where(and(eq(leaveRequests.id, id), isNull(leaveRequests.deletedAt))).limit(1).offset(0);
      return Ok((rows)[0] || null);
    } catch (e: unknown) { return Err((e as Error)?.message || `So'rov #${id} topilmadi`); }
  }

  async findUserById(userId: number): Promise<Result<any | null>> {
    try {
      const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1).offset(0);
      return Ok((rows)[0] || null);
    } catch (e: unknown) { return Err((e as Error)?.message || `Foydalanuvchi #${userId} topilmadi`); }
  }

  async create(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const row: Omit<typeof leaveRequests.$inferInsert, 'id'> = {
        employeeId: (dto.employeeId as string | undefined) ?? '',
        leaveType: (dto.leaveType as string | undefined) ?? 'annual',
        startDate: (dto.startDate as string | undefined) ?? '',
        endDate: (dto.endDate as string | undefined) ?? '',
        status: 'pending',
        reason: dto.reason as string | undefined,
        userId: dto.userId as number | undefined,
      };
      const result = await db.insert(leaveRequests).values(row as typeof leaveRequests.$inferInsert).returning();
      return Ok((result[0] as Record<string, unknown>));
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yaratishda xatolik'); }
  }

  async approve(id: number): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.update(leaveRequests).set({ status: 'approved' }).where(eq(leaveRequests.id, id)).returning();
      return Ok((result[0] as Record<string, unknown>));
    } catch (e: unknown) { return Err((e as Error)?.message || 'Tasdiqlashda xatolik'); }
  }

  async reject(id: number): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.update(leaveRequests).set({ status: 'rejected' }).where(eq(leaveRequests.id, id)).returning();
      return Ok((result[0] as Record<string, unknown>));
    } catch (e: unknown) { return Err((e as Error)?.message || 'Rad etishda xatolik'); }
  }
}
