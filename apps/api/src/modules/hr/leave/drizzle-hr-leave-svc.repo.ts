/**
 * @module drizzle-hr-leave-svc.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { leaveRequests, users, hr_leave_balances, hrEmployees } from '@shared/db';
import { eq, and, isNull, count, desc, sql } from 'drizzle-orm';
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

  async findById(id: number): Promise<Result<Row | null>> {
    try {
      const rows = await db.select().from(leaveRequests).where(and(eq(leaveRequests.id, id), isNull(leaveRequests.deletedAt))).limit(1).offset(0);
      return Ok(((rows)[0] || null) as Row | null);
    } catch (e: unknown) { return Err((e as Error)?.message || `So'rov #${id} topilmadi`); }
  }

  async findUserById(userId: number): Promise<Result<Row | null>> {
    try {
      const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1).offset(0);
      return Ok(((rows)[0] || null) as Row | null);
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

  // ─── Leave balance accrual (T7.5) ──────────────────────────────────────
  async listActiveEmployeesWithHireDate(): Promise<Result<Array<{ id: number; hireDate: string | null }>>> {
    try {
      const rows = await db
        .select({ id: hrEmployees.id, hireDate: hrEmployees.hire_date, isActive: hrEmployees.is_active })
        .from(hrEmployees)
        .where(eq(hrEmployees.is_active, true));
      const arr = Array.isArray(rows) ? rows : [];
      const out = arr.map((r) => ({
        id: Number(r.id),
        hireDate: r.hireDate ? (r.hireDate instanceof Date ? r.hireDate.toISOString().split('T')[0]! : String(r.hireDate)) : null,
      }));
      return Ok(out);
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Faol xodimlar topilmadi');
    }
  }

  async findBalance(employeeId: number, leaveType: string, year: number): Promise<Result<Row | null>> {
    try {
      const rows = await db
        .select()
        .from(hr_leave_balances)
        .where(and(
          eq(hr_leave_balances.employee_id, employeeId),
          eq(hr_leave_balances.leave_type, leaveType),
          eq(hr_leave_balances.year, year),
        ))
        .limit(1);
      return Ok(((Array.isArray(rows) ? rows[0] : null) ?? null) as Row | null);
    } catch (e: unknown) {
      return Err((e as Error)?.message || `Balans topilmadi: emp=${employeeId} type=${leaveType}`);
    }
  }

  async upsertBalance(input: { employeeId: number; leaveType: string; year: number; total_days: number; used_days: number; remaining_days: number }): Promise<Result<Row>> {
    try {
      const existing = await db
        .select({ id: hr_leave_balances.id })
        .from(hr_leave_balances)
        .where(and(
          eq(hr_leave_balances.employee_id, input.employeeId),
          eq(hr_leave_balances.leave_type, input.leaveType),
          eq(hr_leave_balances.year, input.year),
        ))
        .limit(1);
      const existingId = Array.isArray(existing) && existing[0] ? Number(existing[0].id) : null;

      if (existingId) {
        const updated = await db
          .update(hr_leave_balances)
          .set({
            total_days:     Math.round(input.total_days),
            used_days:      Math.round(input.used_days),
            remaining_days: Math.round(input.remaining_days),
            updated_at:     sql`now()`,
          })
          .where(eq(hr_leave_balances.id, existingId))
          .returning();
        return Ok(((Array.isArray(updated) ? updated[0] : {}) ?? {}) as Row);
      }

      const inserted = await db
        .insert(hr_leave_balances)
        .values({
          employee_id:    input.employeeId,
          leave_type:     input.leaveType,
          year:           input.year,
          total_days:     Math.round(input.total_days),
          used_days:      Math.round(input.used_days),
          remaining_days: Math.round(input.remaining_days),
        })
        .returning();
      return Ok(((Array.isArray(inserted) ? inserted[0] : {}) ?? {}) as Row);
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Balansni yangilashda xatolik');
    }
  }
}
