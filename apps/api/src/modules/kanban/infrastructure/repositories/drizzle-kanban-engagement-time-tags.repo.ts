/**
 * NOTE: Raw SQL retained intentionally — see drizzle-kanban-engagement.repo.ts notes.
 */
/**
 * @module drizzle-kanban-engagement-time-tags.repo
 * @description Engagement mixin: Time Tracking + Tags.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { and, eq, desc, sql } from 'drizzle-orm';
import { db, runQuery } from '@shared/db';
import { kanbanTimeTracks, kanbanTags } from '@shared/db';
import { safeCall, Result } from '@common/result';
import { DrizzleKanbanEngagementBaseRepository } from './drizzle-kanban-engagement-base.repo';

@Injectable()
export class DrizzleKanbanEngagementTimeTagsRepository extends DrizzleKanbanEngagementBaseRepository {

  // ─── Time Tracking ────────────────────────────────────────────────────────

  async startTimeTracking(cardId: string, userId: number, description?: string): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const row = await db.transaction(async (tx) => {
        // Running sessiyani to'xtatish
        await tx.update(kanbanTimeTracks)
          .set({ isRunning: false, endedAt: _time.now(), durationMinutes: sql`EXTRACT(EPOCH FROM (NOW() - started_at)) / 60` })
          .where(and(eq(kanbanTimeTracks.userId, userId), eq(kanbanTimeTracks.isRunning, true)));
        const [inserted] = await tx.insert(kanbanTimeTracks).values({
          cardId,
          userId,
          startedAt: _time.now(),
          isRunning: true,
          description: description ?? null,
        }).returning();
        if (!inserted) throw new Error('Vaqt kuzatuvini boshlashda xato');
        return inserted;
      });
      return row;
    });
  }

  async stopTimeTracking(cardId: string, userId: number): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const [row] = await db.update(kanbanTimeTracks)
        .set({
          isRunning: false,
          endedAt: _time.now(),
          durationMinutes: sql`GREATEST(1, EXTRACT(EPOCH FROM (NOW() - started_at)) / 60)::int`,
        })
        .where(and(
          eq(kanbanTimeTracks.cardId, cardId),
          eq(kanbanTimeTracks.userId, userId),
          eq(kanbanTimeTracks.isRunning, true),
        ))
        .returning();
      return row ?? { cardId, userId, stopped: true };
    });
  }

  async getTimeEntries(cardId: string): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () =>
      db.select().from(kanbanTimeTracks)
        .where(eq(kanbanTimeTracks.cardId, cardId))
        .orderBy(desc(kanbanTimeTracks.startedAt)),
    );
  }

  // ─── Tags ─────────────────────────────────────────────────────────────────

  async getCardTags(cardId: string): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Record<string, unknown>>(sql`
        SELECT t.id, t.name, t.color, ct.card_id, ct.created_at
        FROM kanban_tags t
        JOIN kanban_card_tags ct ON ct.tag_id = t.id::text
        WHERE ct.card_id = ${cardId}
        ORDER BY t.name
      `);
      return rows.rows;
    });
  }

  async addTagToCard(cardId: string, tagData: { name: string; color?: string; boardId?: string }): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      // Teg topish yoki yaratish
      let [tag] = await db.select().from(kanbanTags)
        .where(and(eq(kanbanTags.name, tagData.name), tagData.boardId ? eq(kanbanTags.boardId, tagData.boardId) : sql`TRUE`))
        .limit(1);
      if (!tag) {
        [tag] = await db.insert(kanbanTags).values({
          name: tagData.name,
          color: tagData.color ?? '#3b82f6',
          boardId: tagData.boardId ?? null,
        }).returning();
      }
      if (!tag) throw new Error('Teg yaratishda xato');
      // Karta-teg ulanishi
      const rows = await runQuery<Record<string, unknown>>(sql`
        INSERT INTO kanban_card_tags (card_id, tag_id)
        VALUES (${cardId}, ${tag.id})
        ON CONFLICT (card_id, tag_id) DO NOTHING
        RETURNING *
      `);
      return { tag, cardId, added: true, rows: rows.rows };
    });
  }

  async removeTagFromCard(cardId: string, tagId: string): Promise<Result<void>> {
    return safeCall(async () => {
      await runQuery(sql`
        DELETE FROM kanban_card_tags WHERE card_id = ${cardId} AND tag_id = ${tagId}
      `);
    });
  }
}
