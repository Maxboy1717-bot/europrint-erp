/**
 * @module drizzle-knowledge-base.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { knowledge_base } from '@shared/db/schema-misc-qc';
import { eq, desc, like, or } from 'drizzle-orm';
import { safeCall, Result } from '@common/result';

export type KnowledgeBaseRow = typeof knowledge_base.$inferSelect;
export type KnowledgeBaseInsert = Omit<typeof knowledge_base.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>;

@Injectable()
export class KnowledgeBaseRepository {
  async findAll(category?: string, search?: string): Promise<Result<KnowledgeBaseRow[]>> {
    return safeCall(async () => {
      const query = db.select().from(knowledge_base);
      if (search) {
        return query.where(or(like(knowledge_base.title, `%${search}%`), like(knowledge_base.content, `%${search}%`))).orderBy(knowledge_base.order, desc(knowledge_base.createdAt));
      }
      if (category) {
        return query.where(eq(knowledge_base.category, category)).orderBy(knowledge_base.order, desc(knowledge_base.createdAt));
      }
      return query.orderBy(knowledge_base.order, desc(knowledge_base.createdAt));
    });
  }

  async findById(id: string): Promise<Result<KnowledgeBaseRow | null>> {
    return safeCall(async () => {
      const rows = await db.select().from(knowledge_base).where(eq(knowledge_base.id, id)).limit(1);
      return rows[0] ?? null;
    });
  }

  async insert(data: KnowledgeBaseInsert): Promise<Result<KnowledgeBaseRow>> {
    return safeCall(async () => {
      const rows = await db.insert(knowledge_base).values(data).returning();
      return rows[0];
    });
  }

  async update(id: string, data: Partial<KnowledgeBaseInsert>): Promise<Result<KnowledgeBaseRow>> {
    return safeCall(async () => {
      const rows = await db
        .update(knowledge_base)
        .set({ ...data, updatedAt: _time.now() })
        .where(eq(knowledge_base.id, id))
        .returning();
      return rows[0];
    });
  }

  async remove(id: string): Promise<Result<{ id: string }>> {
    return safeCall(async () => {
      await db.delete(knowledge_base).where(eq(knowledge_base.id, id));
      return { id };
    });
  }
}
