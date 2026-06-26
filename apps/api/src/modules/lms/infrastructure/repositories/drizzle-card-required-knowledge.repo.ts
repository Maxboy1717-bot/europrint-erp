/**
 * @module drizzle-card-required-knowledge.repo
 * @description Repository / data-access layer for card_required_knowledge (EP-ORG-122, T11-03).
 *   KARTAga kerakli domen-bilim ro'yxati. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { card_required_knowledge } from '@shared/db/schema-ext-c-1';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { safeCall, Result } from '@common/result';

export type CardRequiredKnowledgeRow = typeof card_required_knowledge.$inferSelect;
export type CardRequiredKnowledgeInsert = Omit<
  typeof card_required_knowledge.$inferInsert,
  'id' | 'created_at' | 'updated_at' | 'deleted_at'
>;

@Injectable()
export class CardRequiredKnowledgeRepository {
  /** List active (non-deleted) domen-bilim rows for one org-CARD, ordered by sort_order. */
  async findByCard(cardId: number): Promise<Result<CardRequiredKnowledgeRow[]>> {
    return safeCall(async () =>
      db
        .select()
        .from(card_required_knowledge)
        .where(and(eq(card_required_knowledge.card_id, cardId), isNull(card_required_knowledge.deleted_at)))
        .orderBy(asc(card_required_knowledge.sort_order), asc(card_required_knowledge.id)),
    );
  }

  async findById(id: number): Promise<Result<CardRequiredKnowledgeRow | null>> {
    return safeCall(async () => {
      const rows = await db
        .select()
        .from(card_required_knowledge)
        .where(and(eq(card_required_knowledge.id, id), isNull(card_required_knowledge.deleted_at)))
        .limit(1);
      return rows[0] ?? null;
    });
  }

  async insert(data: CardRequiredKnowledgeInsert): Promise<Result<CardRequiredKnowledgeRow>> {
    return safeCall(async () => {
      const rows = await db.insert(card_required_knowledge).values(data).returning();
      return rows[0];
    });
  }

  async update(id: number, data: Partial<CardRequiredKnowledgeInsert>): Promise<Result<CardRequiredKnowledgeRow | null>> {
    return safeCall(async () => {
      const rows = await db
        .update(card_required_knowledge)
        .set({ ...data, updated_at: _time.now() })
        .where(and(eq(card_required_knowledge.id, id), isNull(card_required_knowledge.deleted_at)))
        .returning();
      return rows[0] ?? null;
    });
  }

  /** Soft-delete (deleted_at + is_active=false) so unique idx frees the (card_id, knowledge_name) slot. */
  async softDelete(id: number): Promise<Result<{ id: number } | null>> {
    return safeCall(async () => {
      const rows = await db
        .update(card_required_knowledge)
        .set({ deleted_at: _time.now(), is_active: false, updated_at: _time.now() })
        .where(and(eq(card_required_knowledge.id, id), isNull(card_required_knowledge.deleted_at)))
        .returning({ id: card_required_knowledge.id });
      return rows[0] ?? null;
    });
  }
}
