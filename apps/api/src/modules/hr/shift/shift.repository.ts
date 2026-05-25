/**
 * @module shift.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Ok, Err, Result } from '@common/result';
import { Injectable } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db } from '@shared/db';
import { eq, and, gte, lt, isNotNull, sql } from 'drizzle-orm';
import { shiftSchedules, leaveRequestsApp, hrEmployees, hrDepartments } from '@shared/db';

@Injectable()
export class ShiftRepository {
  async assignShift(dto: {
    employeeId: number;
    shiftDate: string;
    shiftType: string;
    startTime: string;
    endTime: string;
    notes?: string;
  }): Promise<Result<Record<string, unknown>>> {
    try {
      const [row] = await db
        .insert(shiftSchedules)
        .values({
          employeeId: dto.employeeId,
          shiftDate: dto.shiftDate,
          shiftType: dto.shiftType,
          startTime: dto.startTime,
          endTime: dto.endTime,
          status: 'scheduled',
          notes: dto.notes ?? null,
        })
        .onConflictDoUpdate({
          target: [shiftSchedules.employeeId, shiftSchedules.shiftDate],
          set: {
            shiftType: dto.shiftType,
            startTime: dto.startTime,
            endTime: dto.endTime,
            status: 'scheduled',
            notes: dto.notes ?? null,
          },
        })
        .returning();
      return Ok(castTo<Record<string, unknown>>(row));
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async findShiftById(id: number): Promise<Result<Record<string, unknown> | null>> {
    try {
      const [row] = await db
        .select()
        .from(shiftSchedules)
        .where(eq(shiftSchedules.id, id))
        .limit(1);
      return Ok(row ? castTo<Record<string, unknown>>(row) : null);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async findSwapPendingShift(id: number): Promise<Result<Record<string, unknown> | null>> {
    try {
      const [row] = await db
        .select()
        .from(shiftSchedules)
        .where(and(eq(shiftSchedules.id, id), eq(shiftSchedules.status, 'swap_pending')))
        .limit(1);
      return Ok(row ? castTo<Record<string, unknown>>(row) : null);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async checkLeaveConflict(employeeId: number, shiftDate: unknown): Promise<Result<boolean>> {
    try {
      const rows = await db
        .select({ found: sql<number>`1` })
        .from(leaveRequestsApp)
        .where(
          and(
            eq(leaveRequestsApp.employee_id, employeeId),
            eq(leaveRequestsApp.status, 'approved'),
            sql`${shiftDate}::date BETWEEN ${leaveRequestsApp.start_date}::date AND ${leaveRequestsApp.end_date}::date`,
          ),
        )
        .limit(1);
      return Ok(rows.length > 0);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async updateShiftStatus(id: number, status: string, notes: string | null): Promise<Result<void>> {
    try {
      await db
        .update(shiftSchedules)
        .set({ status, notes })
        .where(eq(shiftSchedules.id, id));
      return Ok(undefined);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async findEmployeeShiftOnDate(employeeId: number, shiftDate: unknown): Promise<Result<Record<string, unknown> | null>> {
    try {
      const [row] = await db
        .select()
        .from(shiftSchedules)
        .where(and(eq(shiftSchedules.employeeId, employeeId), sql`${shiftSchedules.shiftDate} = ${shiftDate}`))
        .limit(1);
      return Ok(row ? castTo<Record<string, unknown>>(row) : null);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async swapEmployees(shiftId: number, toEmployeeId: number, toShiftId: number, fromEmployeeId: unknown): Promise<Result<void>> {
    try {
      await db
        .update(shiftSchedules)
        .set({ employeeId: toEmployeeId, status: 'scheduled', notes: null })
        .where(eq(shiftSchedules.id, shiftId));
      await db
        .update(shiftSchedules)
        .set({ employeeId: fromEmployeeId as number, status: 'scheduled' })
        .where(eq(shiftSchedules.id, toShiftId));
      return Ok(undefined);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async moveShiftToEmployee(shiftId: number, toEmployeeId: number): Promise<Result<void>> {
    try {
      await db
        .update(shiftSchedules)
        .set({ employeeId: toEmployeeId, status: 'scheduled', notes: null })
        .where(eq(shiftSchedules.id, shiftId));
      return Ok(undefined);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async clearShiftPending(shiftId: number): Promise<Result<void>> {
    try {
      await db
        .update(shiftSchedules)
        .set({ status: 'scheduled', notes: null })
        .where(eq(shiftSchedules.id, shiftId));
      return Ok(undefined);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async getSchedule(weekStart: string, weekEnd: string, employeeId?: number, departmentId?: number): Promise<Result<Record<string, unknown>[]>> {
    try {
      const rows = await db
        .select({
          id: shiftSchedules.id,
          employee_id: shiftSchedules.employeeId,
          shift_date: shiftSchedules.shiftDate,
          shift_type: shiftSchedules.shiftType,
          start_time: shiftSchedules.startTime,
          end_time: shiftSchedules.endTime,
          status: shiftSchedules.status,
          notes: shiftSchedules.notes,
          employee_name: sql<string>`${hrEmployees.first_name} || ' ' || ${hrEmployees.last_name}`,
          department_id: hrEmployees.department_id,
          department_name: hrDepartments.name,
        })
        .from(shiftSchedules)
        .innerJoin(hrEmployees, eq(hrEmployees.id, shiftSchedules.employeeId))
        .leftJoin(hrDepartments, eq(hrDepartments.id, hrEmployees.department_id))
        .where(
          and(
            gte(shiftSchedules.shiftDate, weekStart),
            lt(shiftSchedules.shiftDate, weekEnd),
            employeeId ? eq(shiftSchedules.employeeId, employeeId) : undefined,
            departmentId ? eq(hrEmployees.department_id, departmentId) : undefined,
          ),
        )
        .orderBy(shiftSchedules.shiftDate, shiftSchedules.startTime);
      return Ok(castTo<Record<string, unknown>[]>(rows));
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async getSwapRequests(): Promise<Result<Record<string, unknown>[]>> {
    try {
      const rows = await db
        .select({
          id: shiftSchedules.id,
          from_employee_id: shiftSchedules.employeeId,
          shift_date: shiftSchedules.shiftDate,
          notes: shiftSchedules.notes,
          status: sql<string>`'pending'`,
          created_at: shiftSchedules.createdAt,
          from_employee_name: sql<string>`COALESCE(${hrEmployees.first_name}, '') || ' ' || COALESCE(${hrEmployees.last_name}, '')`,
        })
        .from(shiftSchedules)
        .leftJoin(hrEmployees, eq(hrEmployees.id, shiftSchedules.employeeId))
        .where(eq(shiftSchedules.status, 'swap_pending'))
        .orderBy(sql`${shiftSchedules.createdAt} DESC`)
        .limit(50);
      return Ok(castTo<Record<string, unknown>[]>(rows));
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async deleteShift(id: number): Promise<Result<void>> {
    try {
      await db.delete(shiftSchedules).where(eq(shiftSchedules.id, id));
      return Ok(undefined);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async getUpcomingShifts(todayStr: string, minMinutes: number, maxMinutes: number): Promise<Result<Record<string, unknown>[]>> {
    try {
      const rows = await db
        .select({
          employee_id: shiftSchedules.employeeId,
          shift_type: shiftSchedules.shiftType,
          start_time: shiftSchedules.startTime,
          shift_date: shiftSchedules.shiftDate,
          telegram_chat_id: hrEmployees.telegram_chat_id,
        })
        .from(shiftSchedules)
        .innerJoin(hrEmployees, eq(hrEmployees.id, shiftSchedules.employeeId))
        .where(
          and(
            sql`${shiftSchedules.shiftDate} = ${todayStr}::date`,
            eq(shiftSchedules.status, 'scheduled'),
            isNotNull(hrEmployees.telegram_chat_id),
            sql`(EXTRACT(hour FROM ${shiftSchedules.startTime}::time) * 60 + EXTRACT(minute FROM ${shiftSchedules.startTime}::time)) BETWEEN ${minMinutes} AND ${maxMinutes}`,
          ),
        );
      return Ok(castTo<Record<string, unknown>[]>(rows));
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async findEmployeeByUserId(userId: string): Promise<Result<number | undefined>> {
    try {
      const [row] = await db
        .select({ id: hrEmployees.id })
        .from(hrEmployees)
        .where(sql`${hrEmployees.user_id}::text = ${userId}`)
        .limit(1);
      return Ok(row?.id !== undefined ? Number(row.id) : undefined);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async findShiftByEmployeeAndDate(employeeId: number, shiftDate: string): Promise<Result<number | undefined>> {
    try {
      const [row] = await db
        .select({ id: shiftSchedules.id })
        .from(shiftSchedules)
        .where(and(eq(shiftSchedules.employeeId, employeeId), sql`${shiftSchedules.shiftDate} = ${shiftDate}`))
        .limit(1);
      return Ok(row?.id !== undefined ? Number(row.id) : undefined);
    } catch (_e) {
      return Err(String(_e));
    }
  }
}
