/**
 * @module schema-kanban
 * @description Source module. See exports for details.
 */

import { pgTable, uuid, text, varchar, boolean, integer, jsonb, timestamp, index, serial } from 'drizzle-orm/pg-core';

// ── Kanban Boards / Columns / Cards (canonical) ───────────────────────────────
// Moved here from apps/api/src/modules/kanban/infrastructure/kanban-tables.ts
// per P3-27. Domain/infra files must import these — never re-declare them.
export const kanbanBoards = pgTable('kanban_boards', {
  id:          serial('id').primaryKey(),
  name:        text('name').notNull(),
  type:        varchar('type', { length: 20 }).notNull().default('custom'),
  description: text('description'),
  created_at:  timestamp('created_at').notNull().defaultNow(),
  updated_at:  timestamp('updated_at'),
  deleted_at:  timestamp('deleted_at'),
});

export const kanbanColumns = pgTable('kanban_columns', {
  id:         serial('id').primaryKey(),
  board_id:   integer('board_id').notNull(),
  name:       text('name').notNull(),
  sort_order: integer('sort_order').notNull().default(0),
  color:      varchar('color', { length: 20 }),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at'),
  deleted_at: timestamp('deleted_at'),
});

export const kanbanCards = pgTable('kanban_cards', {
  id:               serial('id').primaryKey(),
  board_id:         integer('board_id').notNull(),
  column_id:        integer('column_id').notNull(),
  title:            text('title').notNull(),
  description:      text('description'),
  priority:         varchar('priority', { length: 20 }).notNull().default('normal'),
  related_type:     varchar('related_type', { length: 20 }),
  related_id:       varchar('related_id', { length: 100 }),
  // G4: UUID manbalar (cc_documents) uchun — related_id INTEGER (jonli DB), UUID sig'maydi.
  related_ref:      text('related_ref'),
  owner_user_id:    integer('owner_user_id'),       // assignee (bajaruvchi)
  assigner_user_id: integer('assigner_user_id'),    // EP-KAN-027: topshiruvchi (assigner)
  sort_order:       integer('sort_order').notNull().default(0),
  created_at:       timestamp('created_at').notNull().defaultNow(),
  updated_at:       timestamp('updated_at').notNull().defaultNow(),
  deleted_at:       timestamp('deleted_at'),
});

export const kanbanFlows = pgTable('kanban_flows', {
  id:          uuid('id').primaryKey().defaultRandom(),
  boardId:     text('board_id'),
  name:        text('name').notNull(),
  description: text('description'),
  status:      text('status').notNull().default('active'),
  config:      jsonb('config').default({}),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index('kanban_flows_board_idx').on(t.boardId)]);

export const kanbanRobots = pgTable('kanban_robots', {
  id:          uuid('id').primaryKey().defaultRandom(),
  boardId:     text('board_id'),
  name:        text('name').notNull(),
  trigger:     text('trigger').notNull().default('card_moved'),
  actions:     jsonb('actions').default([]),
  isActive:    boolean('is_active').notNull().default(true),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index('kanban_robots_board_idx').on(t.boardId)]);

// ── Kanban Extended Tables ────────────────────────────────────────────────────
export const kanbanChecklists = pgTable('kanban_checklists', {
  id:        uuid('id').primaryKey().defaultRandom(),
  cardId:    text('card_id').notNull(),
  title:     text('title').notNull(),
  position:  integer('position').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index('kanban_checklists_card_idx').on(t.cardId)]);

export const kanbanChecklistItems = pgTable('kanban_checklist_items', {
  id:           uuid('id').primaryKey().defaultRandom(),
  checklistId:  text('checklist_id').notNull(),
  title:        text('title').notNull(),
  isCompleted:  boolean('is_completed').notNull().default(false),
  assigneeId:   integer('assignee_id'),
  dueDate:      text('due_date'),
  position:     integer('position').notNull().default(0),
  createdAt:    timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index('kanban_checklist_items_checklist_idx').on(t.checklistId)]);

export const kanbanCardComments = pgTable('kanban_card_comments', {
  id:        uuid('id').primaryKey().defaultRandom(),
  cardId:    text('card_id').notNull(),
  userId:    integer('user_id').notNull(),
  content:   text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index('kanban_card_comments_card_idx').on(t.cardId)]);

export const kanbanCardWatchers = pgTable('kanban_card_watchers', {
  id:        uuid('id').primaryKey().defaultRandom(),
  cardId:    text('card_id').notNull(),
  userId:    integer('user_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ── Bildirishnomalar ──────────────────────────────────────────────────────────
export const kanbanNotifications = pgTable('kanban_notifications', {
  id:        uuid('id').primaryKey().defaultRandom(),
  userId:    integer('user_id').notNull(),
  cardId:    text('card_id'),
  boardId:   text('board_id'),
  type:      text('type').notNull().default('task_assigned'),
  title:     text('title').notNull(),
  message:   text('message'),
  isRead:    boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index('kanban_notif_user_idx').on(t.userId), index('kanban_notif_read_idx').on(t.isRead)]);

// ── Shablonlar ────────────────────────────────────────────────────────────────
export const kanbanTemplates = pgTable('kanban_templates', {
  id:             uuid('id').primaryKey().defaultRandom(),
  name:           text('name').notNull(),
  description:    text('description'),
  priority:       text('priority').notNull().default('normal'),
  boardId:        text('board_id'),
  checklistItems: jsonb('checklist_items').default([]),
  columnsConfig:  jsonb('columns_config').default([]),
  createdById:    integer('created_by_id'),
  createdAt:      timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:      timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt:      timestamp('deleted_at', { withTimezone: true }),
}, (t) => [index('kanban_templates_board_idx').on(t.boardId)]);

// ── Vaqt kuzatuvi ─────────────────────────────────────────────────────────────
export const kanbanTimeTracks = pgTable('kanban_time_tracks', {
  id:              uuid('id').primaryKey().defaultRandom(),
  cardId:          text('card_id').notNull(),
  userId:          integer('user_id').notNull(),
  startedAt:       timestamp('started_at', { withTimezone: true }).notNull(),
  endedAt:         timestamp('ended_at', { withTimezone: true }),
  durationMinutes: integer('duration_minutes'),
  targetMinutes:   integer('target_minutes'),
  isRunning:       boolean('is_running').notNull().default(false),
  description:     text('description'),
  createdAt:       timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index('kanban_time_card_idx').on(t.cardId), index('kanban_time_user_idx').on(t.userId)]);

// ── Teglar ────────────────────────────────────────────────────────────────────
export const kanbanTags = pgTable('kanban_tags', {
  id:        uuid('id').primaryKey().defaultRandom(),
  name:      text('name').notNull(),
  color:     text('color').notNull().default('#3b82f6'),
  boardId:   text('board_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index('kanban_tags_board_idx').on(t.boardId)]);

export const kanbanCardTags = pgTable('kanban_card_tags', {
  id:        serial('id').primaryKey(),
  cardId:    text('card_id').notNull(),
  tagId:     text('tag_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index('kanban_card_tags_card_idx').on(t.cardId)]);

// ── Natijalar ─────────────────────────────────────────────────────────────────
export const kanbanResults = pgTable('kanban_results', {
  id:          uuid('id').primaryKey().defaultRandom(),
  cardId:      text('card_id').notNull(),
  description: text('description'),
  createdById: integer('created_by_id').notNull(),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index('kanban_results_card_idx').on(t.cardId)]);

export const kanbanResultFiles = pgTable('kanban_result_files', {
  id:        uuid('id').primaryKey().defaultRandom(),
  resultId:  text('result_id').notNull(),
  fileName:  text('file_name').notNull(),
  fileUrl:   text('file_url').notNull(),
  fileSize:  integer('file_size'),
  mimeType:  text('mime_type'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index('kanban_result_files_result_idx').on(t.resultId)]);

// ── Kuzatuvchilar va hamijrochilar ────────────────────────────────────────────
export const kanbanObservers = pgTable('kanban_observers', {
  id:        uuid('id').primaryKey().defaultRandom(),
  cardId:    text('card_id').notNull(),
  userId:    integer('user_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index('kanban_observers_card_idx').on(t.cardId)]);

export const kanbanCoExecutors = pgTable('kanban_co_executors', {
  id:        uuid('id').primaryKey().defaultRandom(),
  cardId:    text('card_id').notNull(),
  userId:    integer('user_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index('kanban_co_exec_card_idx').on(t.cardId)]);

// ── Fayl birikmalari ──────────────────────────────────────────────────────────
export const kanbanFiles = pgTable('kanban_files', {
  id:           uuid('id').primaryKey().defaultRandom(),
  cardId:       text('card_id').notNull(),
  fileName:     text('file_name').notNull(),
  fileUrl:      text('file_url').notNull(),
  fileSize:     integer('file_size'),
  mimeType:     text('mime_type'),
  uploadedById: integer('uploaded_by_id'),
  createdAt:    timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt:    timestamp('deleted_at', { withTimezone: true }),
}, (t) => [index('kanban_files_card_idx').on(t.cardId)]);
