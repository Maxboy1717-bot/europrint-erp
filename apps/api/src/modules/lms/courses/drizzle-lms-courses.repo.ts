/**
 * @module drizzle-lms-courses.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { courses, modules, tests } from '@europrint/schemas';
import { eq, isNull, count, desc } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { ILmsCoursesRepository } from './i-lms-courses.repo';

type Row = Record<string, unknown>;
@Injectable()
export class DrizzleLmsCoursesRepository implements ILmsCoursesRepository {
  async findAll(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>> {
    try {
      const [data, countResult] = await Promise.all([
        db.select().from(courses).where(isNull(courses.deletedAt)).limit(limit).offset(offset),
        db.select({ count: count() }).from(courses).where(isNull(courses.deletedAt)).limit(1).offset(0),
      ]);
      return Ok({ data, count: Number(countResult[0]?.count || 0) });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Kurslar topilmadi'); }
  }

  async findById(id: number): Promise<Result<any | null>> {
    try {
      const rows = await db.select().from(courses).where(eq(courses.id, id)).limit(1).offset(0);
      return Ok((rows)[0] || null);
    } catch (e: unknown) { return Err((e as Error)?.message || `Kurs #${id} topilmadi`); }
  }

  async findModulesByCourseId(courseId: number): Promise<Result<object[]>> {
    try {
      const rows = await db.select().from(modules).where(eq(modules.courseId, courseId)).limit(100).offset(0);
      return Ok(rows);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Modullar topilmadi'); }
  }

  async findTestsByCourseId(courseId: number): Promise<Result<object[]>> {
    try {
      const rows = await db.select().from(tests).where(eq(tests.courseId, courseId)).limit(100).offset(0);
      return Ok(rows);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Testlar topilmadi'); }
  }

  async create(dto: Record<string, unknown>, createdBy?: number): Promise<Result<Record<string, unknown>>> {
    try {
      const row: Omit<typeof courses.$inferInsert, 'id'> = {
        title: (dto.title as string | undefined) ?? '',
        description: dto.description as string | undefined,
        category: dto.category as string | undefined,
        status: (dto.status as string | undefined) ?? 'active',
        instructorId: dto.instructorId as string | undefined,
        coverUrl: dto.coverUrl as string | undefined,
        ...(createdBy ? { createdBy: String(createdBy) } : {}),
      };
      const result = await db.insert(courses).values(row as typeof courses.$inferInsert).returning();
      return Ok((result[0] as Record<string, unknown>));
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yaratishda xatolik'); }
  }

  async update(id: number, dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.update(courses).set(dto as Partial<typeof courses.$inferInsert>).where(eq(courses.id, id)).returning();
      return Ok((result[0] as Record<string, unknown>));
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yangilashda xatolik'); }
  }

  async softDelete(id: number): Promise<Result<void>> {
    try {
      await db.update(courses).set({ deletedAt: _time.now() }).where(eq(courses.id, id));
      return Ok(undefined);
    } catch (e: unknown) { return Err((e as Error)?.message || "O'chirishda xatolik"); }
  }
}
