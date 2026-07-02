/**
 * @module drizzle-attendance.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { db, runQuery, hrEmployees } from '@shared/db';
import { face_embeddings } from '@shared/db';
import { attendance } from '@europrint/schemas';
import { SQL, SQLWrapper, and, count, desc, eq, gte, isNotNull, lte, sql } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { IAttendanceRepository } from './i-attendance.repo';

import { MAX_QUERY_LIMIT } from '@common/constants/app.constants';
type Row = Record<string, unknown>;
const exec = async (q: SQL | SQLWrapper): Promise<Row[]> => {
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
      const dateStr = String(dto.date ?? _time.now().toISOString().slice(0, 10));
      const now = _time.now();
      const inserted = await db.transaction(async (tx) => {
        const result = await tx.insert(attendance).values({ id: sql`DEFAULT`, employeeId: String(userId), userId, date: dateStr, status: 'present', checkIn: now }).returning();
        const row = result[0] as (Row & { id: number }) | undefined;
        if (!row) return row;
        // Drizzle schema (schema-compat-2.ts) does not model `attendance_date`/`check_in_time` —
        // these DB-only mirror columns are read by HR-rating/PIP/director-dashboard (see
        // hr-rating.reader.ts, hr-dashboard.repository.ts, finance-extended-payroll.service.ts).
        // Keep both column sets in sync so downstream readers see live check-in data.
        await tx.execute(sql`UPDATE attendance SET attendance_date = ${dateStr}, check_in_time = ${now} WHERE id = ${row.id}`);
        return { ...row, attendance_date: dateStr, check_in_time: now };
      });
      return Ok(inserted as Row);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Kirishda xatolik'); }
  }

  async checkOut(userId: number, dto: Row): Promise<Result<Row>> {
    try {
      const dateStr = String(dto.date);
      const now = _time.now();
      const updated = await db.transaction(async (tx) => {
        const result = await tx.update(attendance).set({ checkOut: now }).where(and(eq(attendance.userId, userId), eq(attendance.date, dateStr))).returning();
        const row = result[0] as (Row & { id: number }) | undefined;
        if (!row) return row;
        // Mirror into the DB-only `attendance_date`/`check_out_time` columns (see checkIn note
        // above) so HR-rating/PIP/director-dashboard reads reflect the actual check-out.
        await tx.execute(sql`UPDATE attendance SET attendance_date = COALESCE(attendance_date, ${dateStr}), check_out_time = ${now} WHERE id = ${row.id}`);
        return { ...row, attendance_date: dateStr, check_out_time: now };
      });
      return Ok(updated as Row);
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

  async findAllWithEmbeddings(): Promise<{ id: number; face_embedding: number[] | null }[]> {
    const rows = await db
      .select({ id: hrEmployees.id, face_embedding: hrEmployees.face_embedding })
      .from(hrEmployees)
      .where(isNotNull(hrEmployees.face_embedding));
    return rows.map(r => ({ id: r.id, face_embedding: r.face_embedding as number[] | null }));
  }

  async saveEmployeeFaceEmbedding(
    employeeId: number,
    embedding:  number[],
    confidence: number,
    imageUrl?:  string,
  ): Promise<Result<{ id: number }>> {
    const [existing] = await db
      .select({ face_embedding: hrEmployees.face_embedding })
      .from(hrEmployees)
      .where(eq(hrEmployees.id, employeeId))
      .limit(1);

    let finalEmbedding = embedding;
    if (existing?.face_embedding) {
      const old = existing.face_embedding as number[];
      if (Array.isArray(old) && old.length === embedding.length) {
        const weighted = old.map((v, i) => 0.7 * v + 0.3 * (embedding[i] ?? 0));
        const norm = Math.sqrt(weighted.reduce((s, x) => s + x * x, 0));
        finalEmbedding = norm > 0 ? weighted.map(x => x / norm) : weighted;
      }
    }

    await db
      .update(hrEmployees)
      .set({ face_embedding: finalEmbedding, face_embedding_updated_at: _time.now() } as never)
      .where(eq(hrEmployees.id, employeeId));

    await db
      .update(face_embeddings)
      .set({ isActive: false })
      .where(and(eq(face_embeddings.employeeId, String(employeeId)), eq(face_embeddings.isActive, true)));

    const [inserted] = await db
      .insert(face_embeddings)
      .values({
        employeeId: String(employeeId),
        embedding:  JSON.stringify(finalEmbedding),
        isActive:   true,
        confidence: confidence,
        imageUrl:   imageUrl ?? null,
      })
      .returning({ id: face_embeddings.id });

    if (!inserted) return Err('Failed to insert face_embedding record');
    return Ok({ id: inserted.id });
  }
}
