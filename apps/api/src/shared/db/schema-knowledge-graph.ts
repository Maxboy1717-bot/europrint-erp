/**
 * @module schema-knowledge-graph
 * @description AI Bilim Grafigi (Knowledge Graph) — ERP entity'lar orasidagi
 * tipi bog'lanishlarni saqlaydigan native ("ERP tashqarisida ish YO'Q"
 * qoidasiga mos, Obsidian rad etilgan) graf. `kg_nodes` = polimorfik entity
 * ko'rsatgichi (mijoz/xodim/buyurtma/hujjat/...), `kg_edges` = ular orasidagi
 * yo'naltirilgan aloqa. `entity_id`/`source_id`/`target_id` — varchar
 * (integer-PK VA uuid-PK entity'larni bittasi qamrab olishi uchun;
 * `erp_documents.id` uuid ekani tasdiqlangan, boshqalari serial-int).
 *
 * `embedding` ustuni ATAYLAB yo'q: jonli DB'da pgvector kengaytmasi
 * o'rnatilmagan HAM O'RNATIB BO'LMAYDI (`pg_available_extensions`da yo'q) —
 * `drizzle-attendance.repo.ts:88-98` xuddi shu sababdan `employees.face_embedding`
 * fantom-ustun bo'lib, oddiy xodim qo'shishni ham 500 bilan buzgan edi.
 * Semantik qidiruv kerak bo'lsa (keyingi faza) — `face_embeddings.embedding`
 * naqshiga mos oddiy `text` (JSON) ustun qo'shiladi, `vector()` emas.
 */

import { sql } from 'drizzle-orm';
import {
  pgTable, uuid, varchar, text, jsonb, timestamp, numeric, boolean,
  integer, index, unique, check,
} from 'drizzle-orm/pg-core';

export const kg_nodes = pgTable('kg_nodes', {
  id:                uuid('id').primaryKey().defaultRandom(),
  entity_type:       varchar('entity_type', { length: 50 }).notNull(),
  entity_id:         varchar('entity_id', { length: 64 }).notNull(),
  title:             text('title').notNull(),
  summary:           text('summary'),
  metadata:          jsonb('metadata').notNull().default(sql`'{}'::jsonb`),
  source_updated_at: timestamp('source_updated_at', { withTimezone: true }),
  created_at:        timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at:        timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deleted_at:        timestamp('deleted_at', { withTimezone: true }),
}, (t) => [
  unique('uq_kg_nodes_entity').on(t.entity_type, t.entity_id),
  index('idx_kg_nodes_type').on(t.entity_type),
]);

export const kg_edges = pgTable('kg_edges', {
  id:             uuid('id').primaryKey().defaultRandom(),
  source_type:    varchar('source_type', { length: 50 }).notNull(),
  source_id:      varchar('source_id', { length: 64 }).notNull(),
  target_type:    varchar('target_type', { length: 50 }).notNull(),
  target_id:      varchar('target_id', { length: 64 }).notNull(),
  relation_type:  varchar('relation_type', { length: 50 }).notNull(),
  weight:         numeric('weight', { precision: 5, scale: 4 }).notNull().default('1'),
  is_broken:      boolean('is_broken').notNull().default(false),
  broken_reason:  text('broken_reason'),
  source:         varchar('source', { length: 20 }).notNull().default('system'), // 'system'|'manual'|'ai'
  created_by:     integer('created_by'), // users.id — no FK (2 conflicting `users` schema defs found in shared/db; avoid ambiguity, see schema-knowledge-graph.ts header)
  created_at:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at:     timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deleted_at:     timestamp('deleted_at', { withTimezone: true }),
}, (t) => [
  unique('uq_kg_edges_triple').on(t.source_type, t.source_id, t.target_type, t.target_id, t.relation_type),
  index('idx_kg_edges_source').on(t.source_type, t.source_id),
  index('idx_kg_edges_target').on(t.target_type, t.target_id),
  index('idx_kg_edges_broken').on(t.is_broken),
  check('kg_edges_source_chk', sql`${t.source} IN ('system','manual','ai')`),
]);

export type KgNodeRow = typeof kg_nodes.$inferSelect;
export type KgNodeInsert = typeof kg_nodes.$inferInsert;
export type KgEdgeRow = typeof kg_edges.$inferSelect;
export type KgEdgeInsert = typeof kg_edges.$inferInsert;
