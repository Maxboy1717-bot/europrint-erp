/**
 * @module schema-outbox
 * @description Outbox pattern persistence table for domain events (PA0-6).
 *
 * Every aggregate save MUST atomically insert its domain events into this
 * table inside the same DB transaction. A scheduled publisher then picks up
 * unpublished rows and re-emits via EventEmitter2 / CQRS EventBus, marking
 * `published_at` on success. This makes domain-event delivery survive process
 * crashes between aggregate persistence and in-process event emission.
 *
 * See `apps/api/src/modules/shared/outbox/` for the repository + publisher.
 */

import { pgTable, uuid, text, jsonb, timestamp, integer, index } from 'drizzle-orm/pg-core';

export const domain_events = pgTable(
  'domain_events',
  {
    // id is a uuid column; let Postgres generate it (gen_random_uuid). The previous
    // $defaultFn(() => createId()) produced a cuid2 string, which is invalid for a uuid
    // column and made every outbox insert (inside aggregate-save txns) fail at runtime.
    id: uuid('id').primaryKey().defaultRandom(),
    aggregate_type: text('aggregate_type').notNull(),
    aggregate_id: text('aggregate_id').notNull(),
    event_name: text('event_name').notNull(),
    payload: jsonb('payload').notNull(),
    occurred_at: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
    published_at: timestamp('published_at', { withTimezone: true }),
    attempts: integer('attempts').notNull().default(0),
    last_error: text('last_error'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    unpublishedIdx: index('idx_domain_events_unpublished').on(table.published_at, table.occurred_at),
  }),
);
