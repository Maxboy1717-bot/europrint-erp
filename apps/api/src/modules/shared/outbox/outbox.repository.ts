/**
 * @module outbox.repository
 * @description Repository for the domain-events outbox table (PA0-6).
 *
 * Provides:
 *   - `insertBatch` — write events inside an aggregate-save transaction so
 *     persistence + emission intent are atomic.
 *   - `fetchUnpublished` — pulled by `OutboxPublisher` every tick.
 *   - `markPublished` / `markFailed` — bookkeeping after the publisher emits.
 *
 * All methods return `Result<T>` per project Rule 1.
 */

import { Injectable, Logger } from '@nestjs/common';
import { db, domain_events } from '@shared/db';
import { and, eq, isNull, sql, lte } from 'drizzle-orm';
import { Result, Ok, Err, AppErr } from '@common/result';

export interface OutboxRow {
  id: string;
  aggregate_type: string;
  aggregate_id: string;
  event_name: string;
  payload: Record<string, unknown>;
  occurred_at: Date;
  attempts: number;
}

type OutboxInsert = Omit<OutboxRow, 'id' | 'occurred_at' | 'attempts'> & { occurred_at?: Date };

@Injectable()
export class OutboxRepository {
  private readonly logger = new Logger(OutboxRepository.name);

  /**
   * Insert a batch of unpublished events. Pass `tx` to participate in an
   * existing transaction (aggregate save + outbox insert must be atomic).
   *
   * `tx` is typed as `unknown` to accept Drizzle's `PgTransaction` handle from
   * a sibling `db.transaction(async (tx) => ...)` call without leaking that
   * specific generic into the public API. Internally it's cast back to the
   * Drizzle executor shape the repository uses.
   */
  async insertBatch(events: OutboxInsert[], tx?: unknown): Promise<Result<void>> {
    const conn = (tx as typeof db | undefined) ?? db;
    try {
      if (events.length === 0) return Ok(undefined);
      await conn.insert(domain_events).values(
        events.map((e) => ({
          aggregate_type: e.aggregate_type,
          aggregate_id: e.aggregate_id,
          event_name: e.event_name,
          // `payload` is jsonb; Drizzle accepts a plain JS object here.
          payload: e.payload as unknown as Record<string, unknown>,
          occurred_at: e.occurred_at ?? new Date(),
        })),
      );
      return Ok(undefined);
    } catch (err) {
      this.logger.error('Outbox insert failed', err as Error);
      return Err(AppErr('DB_ERROR', 'Outbox insert failed'));
    }
  }

  /**
   * Fetch unpublished events (capped attempts) in occurrence order.
   */
  async fetchUnpublished(limit = 100): Promise<Result<OutboxRow[]>> {
    try {
      const rows = await db
        .select()
        .from(domain_events)
        .where(and(isNull(domain_events.published_at), lte(domain_events.attempts, 10)))
        .orderBy(domain_events.occurred_at)
        .limit(limit);
      return Ok(
        rows.map((r) => ({
          id: r.id,
          aggregate_type: r.aggregate_type,
          aggregate_id: r.aggregate_id,
          event_name: r.event_name,
          payload: (r.payload ?? {}) as Record<string, unknown>,
          occurred_at: r.occurred_at,
          attempts: r.attempts,
        })),
      );
    } catch (err) {
      this.logger.error('Outbox fetch failed', err as Error);
      return Err(AppErr('DB_ERROR', 'Outbox fetch failed'));
    }
  }

  async markPublished(id: string): Promise<Result<void>> {
    try {
      await db
        .update(domain_events)
        .set({ published_at: new Date() })
        .where(eq(domain_events.id, id));
      return Ok(undefined);
    } catch (err) {
      this.logger.error('Outbox mark-published failed', err as Error);
      return Err(AppErr('DB_ERROR', 'Outbox mark failed'));
    }
  }

  async markFailed(id: string, error: string): Promise<Result<void>> {
    try {
      await db
        .update(domain_events)
        .set({
          attempts: sql`${domain_events.attempts} + 1`,
          last_error: error.substring(0, 500),
        })
        .where(eq(domain_events.id, id));
      return Ok(undefined);
    } catch (err) {
      this.logger.error('Outbox mark-failed failed', err as Error);
      return Err(AppErr('DB_ERROR', 'Outbox mark-failed failed'));
    }
  }
}
