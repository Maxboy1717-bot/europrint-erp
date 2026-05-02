import { pgTable, uuid, text, boolean, integer, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { stub } from './schema-compat-helpers';

export const kanbanFlows = stub(pgTable('kanban_flows', {
  id:          uuid('id').primaryKey().defaultRandom(),
  boardId:     text('board_id'),
  name:        text('name').notNull(),
  description: text('description'),
  status:      text('status').notNull().default('active'),
  config:      jsonb('config').default({}),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index('kanban_flows_board_idx').on(t.boardId)]));

export const kanbanRobots = stub(pgTable('kanban_robots', {
  id:          uuid('id').primaryKey().defaultRandom(),
  boardId:     text('board_id'),
  name:        text('name').notNull(),
  trigger:     text('trigger').notNull().default('card_moved'),
  actions:     jsonb('actions').default([]),
  isActive:    boolean('is_active').notNull().default(true),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index('kanban_robots_board_idx').on(t.boardId)]));

export const kanbanChecklists = stub(pgTable('kanban_checklists', {
  id:        uuid('id').primaryKey().defaultRandom(),
  cardId:    text('card_id').notNull(),
  title:     text('title').notNull(),
  position:  integer('position').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index('kanban_checklists_card_idx').on(t.cardId)]));

export const kanbanChecklistItems = stub(pgTable('kanban_checklist_items', {
  id:           uuid('id').primaryKey().defaultRandom(),
  checklistId:  text('checklist_id').notNull(),
  title:        text('title').notNull(),
  isCompleted:  boolean('is_completed').notNull().default(false),
  assigneeId:   integer('assignee_id'),
  dueDate:      text('due_date'),
  position:     integer('position').notNull().default(0),
  createdAt:    timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index('kanban_checklist_items_checklist_idx').on(t.checklistId)]));

export const kanbanCardComments = stub(pgTable('kanban_card_comments', {
  id:        uuid('id').primaryKey().defaultRandom(),
  cardId:    text('card_id').notNull(),
  userId:    integer('user_id').notNull(),
  content:   text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index('kanban_card_comments_card_idx').on(t.cardId)]));

export const kanbanCardWatchers = stub(pgTable('kanban_card_watchers', {
  id:        uuid('id').primaryKey().defaultRandom(),
  cardId:    text('card_id').notNull(),
  userId:    integer('user_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}));
