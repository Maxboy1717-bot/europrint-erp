/**
 * @module departments.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Ok, Err, Result } from '@common/result';
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { departments, users } from '@europrint/schemas';
import { eq, count } from 'drizzle-orm';

@Injectable()
export class DepartmentsRepository {
  async findAll(): Promise<Result<Record<string, unknown>[]>> {
    try {
      const rows = await db.select().from(departments);
      return Ok(rows);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async findOne(id: number): Promise<Result<Record<string, unknown> | null>> {
    try {
      const rows = await db.select().from(departments).where(eq(departments.id, String(id)));
      return Ok(rows[0] ?? null);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async create(values: typeof departments.$inferInsert): Promise<Result<Record<string, unknown> | null>> {
    try {
      const result = await db.insert(departments).values(values).returning();
      return Ok(result[0] ?? null);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async update(id: number, values: Partial<typeof departments.$inferInsert>): Promise<Result<Record<string, unknown> | null>> {
    try {
      const result = await db.update(departments).set(values as typeof departments.$inferInsert).where(eq(departments.id, String(id))).returning();
      return Ok(result[0] ?? null);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async countUsersForDepartment(departmentId: number): Promise<Result<number>> {
    try {
      const rows = await db.select({ count: count() }).from(users).where(eq(users.departmentId, departmentId));
      return Ok(Number(rows[0]?.count ?? 0));
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async remove(id: number): Promise<Result<Record<string, unknown> | null>> {
    try {
      const result = await db.delete(departments).where(eq(departments.id, String(id))).returning();
      return Ok(result[0] ?? null);
    } catch (_e) {
      return Err(String(_e));
    }
  }
}
