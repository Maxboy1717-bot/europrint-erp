/**
 * @module positions.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Ok, Err, Result } from '@common/result';
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { positions, users } from '@europrint/schemas';
import { eq, count } from 'drizzle-orm';

import { MAX_QUERY_LIMIT } from '@common/constants/app.constants';
@Injectable()
export class PositionsRepository {
  async findAll(): Promise<Result<Record<string, unknown>[]>> {
    try {
      const rows = await db.select().from(positions).limit(MAX_QUERY_LIMIT);
      return Ok(rows);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async findOne(id: number): Promise<Result<Record<string, unknown> | null>> {
    try {
      const rows = await db.select().from(positions).where(eq(positions.id, id));
      return Ok(rows[0] ?? null);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async create(values: typeof positions.$inferInsert): Promise<Result<Record<string, unknown> | null>> {
    try {
      const result = await db.insert(positions).values(values).returning();
      return Ok(result[0] ?? null);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async update(id: number, values: Partial<typeof positions.$inferInsert>): Promise<Result<Record<string, unknown> | null>> {
    try {
      const result = await db.update(positions).set(values as typeof positions.$inferInsert).where(eq(positions.id, id)).returning();
      return Ok(result[0] ?? null);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async countUsersForPosition(positionId: number): Promise<Result<number>> {
    try {
      const rows = await db.select({ count: count() }).from(users).where(eq(users.positionId, positionId));
      return Ok(Number(rows[0]?.count ?? 0));
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async remove(id: number): Promise<Result<Record<string, unknown> | null>> {
    try {
      const result = await db.delete(positions).where(eq(positions.id, id)).returning();
      return Ok(result[0] ?? null);
    } catch (_e) {
      return Err(String(_e));
    }
  }
}
