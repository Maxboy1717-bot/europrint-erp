/**
 * NOTE: Raw SQL retained intentionally — Drizzle ORM cannot express:
 *   - EXTRACT(EPOCH FROM (NOW() - started_at)) / 60 duration computation
 *     inside UPDATE ... SET for time-tracking (interval-to-minutes arithmetic
 *     using GREATEST(1, ...)::int cannot be composed via Drizzle helpers).
 *   - id::text cast joins between kanban_tags.id and kanban_card_tags.tag_id
 *     where types differ (uuid vs text) — Drizzle requires column-level type
 *     parity and exposes no inline cast operator.
 *   - INSERT ... ON CONFLICT (card_id, tag_id) DO NOTHING RETURNING * on a
 *     composite-key junction table with a name-based tag lookup.
 *   - COALESCE(NULLIF(TRIM(first_name || ' ' || last_name), ''), email, 'Foydalanuvchi')
 *     denormalised full-name projection used by observer/co-executor lists.
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */
/**
 * @module drizzle-kanban-engagement.repo
 * @description Engagement kanban repository facade: Notifications, Templates,
 * Time Tracking, Tags, Observers, Co-Executors. Composed via inheritance from
 * sub-repo mixins (base, time-tags) plus inline Observer/Co-Executor methods.
 */

import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { safeCall, Result } from '@common/result';
import { DrizzleKanbanEngagementTimeTagsRepository } from './drizzle-kanban-engagement-time-tags.repo';

@Injectable()
export class DrizzleKanbanEngagementRepository extends DrizzleKanbanEngagementTimeTagsRepository {

  // ─── Observers ────────────────────────────────────────────────────────────

  async getObservers(cardId: string): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Record<string, unknown>>(sql`
        SELECT o.id, o.card_id, o.user_id, o.created_at,
               COALESCE(NULLIF(TRIM(COALESCE(u.first_name,'') || ' ' || COALESCE(u.last_name,'')), ''), u.email, 'Foydalanuvchi') AS full_name,
               u.email,
               u.profile_image_url
        FROM kanban_observers o
        LEFT JOIN users u ON u.id::text = o.user_id::text
        WHERE o.card_id = ${cardId}
        ORDER BY o.created_at
      `);
      return rows.rows;
    });
  }

  async addObserver(cardId: string, userId: number): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const rows = await runQuery<Record<string, unknown>>(sql`
        INSERT INTO kanban_observers (card_id, user_id)
        VALUES (${cardId}, ${userId})
        ON CONFLICT (card_id, user_id) DO NOTHING
        RETURNING *
      `);
      return rows.rows[0] ?? { cardId, userId, added: true };
    });
  }

  async removeObserver(cardId: string, observerId: string): Promise<Result<void>> {
    return safeCall(async () => {
      await runQuery(sql`
        DELETE FROM kanban_observers WHERE card_id = ${cardId} AND user_id = ${observerId}
      `);
    });
  }

  // ─── Co-Executors ─────────────────────────────────────────────────────────

  async getCoExecutors(cardId: string): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Record<string, unknown>>(sql`
        SELECT ce.id, ce.card_id, ce.user_id, ce.created_at,
               COALESCE(NULLIF(TRIM(COALESCE(u.first_name,'') || ' ' || COALESCE(u.last_name,'')), ''), u.email, 'Foydalanuvchi') AS full_name,
               u.email,
               u.profile_image_url
        FROM kanban_co_executors ce
        LEFT JOIN users u ON u.id::text = ce.user_id::text
        WHERE ce.card_id = ${cardId}
        ORDER BY ce.created_at
      `);
      return rows.rows;
    });
  }

  async addCoExecutor(cardId: string, userId: number): Promise<Result<Record<string, unknown>>> {
    return safeCall(async () => {
      const rows = await runQuery<Record<string, unknown>>(sql`
        INSERT INTO kanban_co_executors (card_id, user_id)
        VALUES (${cardId}, ${userId})
        ON CONFLICT (card_id, user_id) DO NOTHING
        RETURNING *
      `);
      return rows.rows[0] ?? { cardId, userId, added: true };
    });
  }

  async removeCoExecutor(cardId: string, coExecutorId: string): Promise<Result<void>> {
    return safeCall(async () => {
      await runQuery(sql`
        DELETE FROM kanban_co_executors WHERE card_id = ${cardId} AND user_id = ${coExecutorId}
      `);
    });
  }
}
