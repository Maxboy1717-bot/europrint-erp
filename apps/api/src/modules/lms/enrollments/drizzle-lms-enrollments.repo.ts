import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { assignments, courses } from '@europrint/schemas';
import { eq, and , sql } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { ILmsEnrollmentsRepository } from './i-lms-enrollments.repo';

type Row = Record<string, unknown>;
@Injectable()
export class DrizzleLmsEnrollmentsRepository implements ILmsEnrollmentsRepository {
  async findCourseById(courseId: number): Promise<Result<any | null>> {
    try {
      const rows = await db.select().from(courses).where(sql`id = ${courseId}`).limit(1).offset(0);
      return Ok((rows)[0] || null);
    } catch (e: unknown) { return Err((e as Error)?.message || `Kurs #${courseId} topilmadi`); }
  }

  async findExistingEnrollment(userId: number, courseId: number): Promise<Result<any | null>> {
    try {
      const rows = await db.select().from(assignments).where(and(eq(assignments.userId, userId), eq(assignments.courseId, courseId))).limit(1).offset(0);
      return Ok((rows)[0] || null);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yozuv tekshirishda xatolik'); }
  }

  async enroll(dto: { userId: number; courseId: number; dueAt?: Date | null }): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.insert(assignments).values({
        id:           sql`DEFAULT`,
        enrollmentId: `ENRL-${Date.now()}-${dto.userId}`,
        userId:       dto.userId,
        courseId:     dto.courseId,
      }).returning();
      return Ok((result[0] as Record<string, unknown>));
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yozilishda xatolik'); }
  }

  async findAll(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>> {
    try {
      const rows = await db.select().from(assignments);
      return Ok({ data: rows.slice(offset, offset + limit), count: rows.length });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yozuvlar topilmadi'); }
  }

  async findById(id: number): Promise<Result<any | null>> {
    try {
      const rows = await db.select().from(assignments).where(sql`id = ${id}`).limit(1).offset(0);
      return Ok((rows)[0] || null);
    } catch (e: unknown) { return Err((e as Error)?.message || `Yozuv #${id} topilmadi`); }
  }

  async update(id: number, dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.update(assignments).set(dto as Partial<typeof assignments.$inferInsert>).where(sql`id = ${id}`).returning();
      return Ok((result[0] as Record<string, unknown>));
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yangilashda xatolik'); }
  }

  async remove(id: number): Promise<Result<void>> {
    try {
      await db.delete(assignments).where(sql`id = ${id}`);
      return Ok(undefined);
    } catch (e: unknown) { return Err((e as Error)?.message || "O'chirishda xatolik"); }
  }
}
