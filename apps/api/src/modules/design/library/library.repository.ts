/**
 * @module library.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Ok, Err, Result } from '@common/result';
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { designLibraryItems } from '@europrint/schemas';
import { eq, and, isNull, count, desc, sql } from 'drizzle-orm';

@Injectable()
export class LibraryRepository {
  async findAll(page: number, limit: number): Promise<Result<Record<string, unknown>>> {
    try {
      const [countResult, data] = await Promise.all([
        db.select({ count: count() }).from(designLibraryItems).where(isNull(designLibraryItems.deletedAt)),
        db.select().from(designLibraryItems)
          .where(isNull(designLibraryItems.deletedAt))
          .orderBy(desc(designLibraryItems.createdAt))
          .limit(limit)
          .offset((page - 1) * limit),
      ]);
      return Ok({ data, total: Number(countResult[0]?.count ?? 0) });
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async findOne(id: number): Promise<Result<Record<string, unknown> | null>> {
    try {
      const rows = await db.select().from(designLibraryItems)
        .where(and(eq(designLibraryItems.id, id), isNull(designLibraryItems.deletedAt)));
      return Ok(rows[0] ?? null);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async create(values: typeof designLibraryItems.$inferInsert): Promise<Result<Record<string, unknown>>> {
    try {
      // design_library_items.id is a plain `integer PRIMARY KEY` with no DEFAULT/sequence
      // (verified live via \d design_library_items) — generate the next id ourselves,
      // same COALESCE(MAX(id)+1) convention used elsewhere in this codebase for
      // no-default integer PKs (e.g. crm_custom_fields.order_index).
      const result = await db.insert(designLibraryItems).values({
        ...values,
        id: sql`(SELECT COALESCE(MAX(id), 0) + 1 FROM design_library_items)`,
      }).returning();
      return Ok(result[0] as Record<string, unknown>);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async update(id: number, values: Partial<typeof designLibraryItems.$inferInsert>): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.update(designLibraryItems)
        .set(values)
        .where(eq(designLibraryItems.id, id))
        .returning();
      return Ok(result[0] as Record<string, unknown>);
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async softDelete(id: number): Promise<Result<Record<string, unknown> | null>> {
    try {
      await db.update(designLibraryItems)
        .set({ deletedAt: _time.now() })
        .where(eq(designLibraryItems.id, id));
      return Ok(null);
    } catch (_e) {
      return Err(String(_e));
    }
  }
}
