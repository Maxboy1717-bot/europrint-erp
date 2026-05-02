import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { db, runQuery, hrEmployees } from '@shared/db';
import { attendance } from '@europrint/schemas';
import { sql, eq, and, count, desc, gte, lte, isNotNull } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { IAttendanceRepository } from './i-attendance.repo';

import { MAX_QUERY_LIMIT } from '@common/constants/app.constants';
type Row = Record<string, unknown>;
const exec = async (q: Parameters<typeof db.execute>[0]): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

@Injectable()
export class DrizzleAttendanceRepository implements IAttendanceRepository {
  private readonly logger = new Logger(DrizzleAttendanceRepository.name);

  async findTodayAll(): Promise<Result<Row[]>> {
    try {
      const today = _time.now().toISOString().split('T')[0];
      const data = await exec(sql`SELECT a.id, a.employee_id, a.attendance_date, a.check_in_time, a.check_out_time, a.status, a.late_minutes, a.overtime_minutes, COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,'') AS employee_name, (a.check_in_time IS NOT NULL AND a.check_in_time::time > '09:15:00'::time) AS is_late FROM attendance a JOIN employees e ON e.id = a.employee_id WHERE a.attendance_date = ${today} LIMIT ${MAX_QUERY_LIMIT}`);
      return Ok(data.map((r) => ({ ...r, isLate: Boolean(r.is_late) })));
    } catch (e: unknown) { this.logger.warn(`findTodayAll: ${(e as Error).message}`); return Err((e as Error).message); }
  }

  async findAll(opts: { limit: number; offset: number; userId?: number; date?: string; status?: string; fromDate?: string; toDate?: string }): Promise<Result<{ data: Row[]; count: number }>> {
    try {
      const { limit, offset, userId, date, status, fromDate, toDate } = opts;
      const conditions = [];
      if (userId) conditions.push(eq(attendance.userId, userId));
      if (date) conditions.push(eq(attendance.date, date));
      if (status) conditions.push(eq(attendance.status, status));
      if (fromDate) conditions.push(gte(attendance.date, fromDate));
      if (toDate) conditions.push(lte(attendance.date, toDate));
      const wh = conditions.length > 0 ? and(...conditions) : undefined;
      const [data, countResult] = await Promise.all([
        wh ? db.select().from(attendance).where(wh).orderBy(desc(attendance.createdAt)).limit(limit).offset(offset) : db.select().from(attendance).orderBy(desc(attendance.createdAt)).limit(limit).offset(offset),
        wh ? db.select({ count: count() }).from(attendance).where(wh).limit(1).offset(0) : db.select({ count: count() }).from(attendance).limit(1).offset(0),
      ]);
      return Ok({ data, count: Number(countResult[0]?.count || 0) });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Davomat topilmadi'); }
  }

  async checkIn(userId: number, dto: Row): Promise<Result<Row>> {
    try {
      const result = await db.insert(attendance).values({ id: sql`DEFAULT`, employeeId: String(userId), userId, date: String(dto.date ?? _time.now().toISOString().slice(0, 10)), status: 'present', checkIn: _time.now() }).returning();
      return Ok(result[0] as Row);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Kirishda xatolik'); }
  }

  async checkOut(userId: number, dto: Row): Promise<Result<Row>> {
    try {
      const result = await db.update(attendance).set({ checkOut: _time.now() }).where(and(eq(attendance.userId, userId), eq(attendance.date, String(dto.date)))).returning();
      return Ok(result[0] as Row);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Chiqishda xatolik'); }
  }

  async findEmployeeByEmbedding(
    vectorLiteral: string,
    threshold: number,
  ): Promise<Result<{ id: number | null; distance: number }>> {
    try {
      const distExpr = sql<number>`(${hrEmployees.face_embedding} <=> ${vectorLiteral}::vector(512))`;
      const rows = await db
        .select({ id: hrEmployees.id, distance: distExpr })
        .from(hrEmployees)
        .where(isNotNull(hrEmployees.face_embedding))
        .orderBy(distExpr)
        .limit(1);
      const row = rows[0];
      if (!row) return Ok({ id: null, distance: 1 });
      const dist = Number(row.distance ?? 1);
      if (1 - dist < threshold) return Ok({ id: null, distance: dist });
      return Ok({ id: Number(row.id), distance: dist });
    } catch (e: unknown) {
      this.logger.warn('findEmployeeByEmbedding failed: %s', (e as Error)?.message);
      return Err((e as Error)?.message || 'Embedding search failed');
    }
  }
}
