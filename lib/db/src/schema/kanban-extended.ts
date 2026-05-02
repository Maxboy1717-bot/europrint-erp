import { pgTable, serial, integer, varchar, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';
import { kanbanCards } from './kanban-schema';
import { users } from './users';

export const kanbanCardChecklists = pgTable('kanban_card_checklists', {
  id:         serial('id').primaryKey(),
  cardId:     integer('card_id').notNull().references(() => kanbanCards.id, { onDelete: 'cascade' }),
  title:      varchar('title', { length: 200 }).notNull(),
  isDone:     boolean('is_done').notNull().default(false),
  orderIndex: integer('order_index').notNull().default(0),
  createdAt:  timestamp('created_at').notNull().defaultNow(),
});

export const kanbanCardChecklistItems = pgTable('kanban_card_checklist_items', {
  id:          serial('id').primaryKey(),
  checklistId: integer('checklist_id').notNull().references(() => kanbanCardChecklists.id, { onDelete: 'cascade' }),
  text:        varchar('text', { length: 500 }).notNull(),
  isChecked:   boolean('is_checked').notNull().default(false),
  orderIndex:  integer('order_index').notNull().default(0),
  createdAt:   timestamp('created_at').notNull().defaultNow(),
});

export const marketingContentPosts = pgTable('marketing_content_posts', {
  id:           serial('id').primaryKey(),
  platform:     varchar('platform', { length: 30 }).notNull(),
  content:      text('content').notNull(),
  mediaUrls:    jsonb('media_urls').$type<string[]>().default([]),
  scheduledAt:  timestamp('scheduled_at'),
  publishedAt:  timestamp('published_at'),
  status:       varchar('status', { length: 20 }).notNull().default('draft'),
  authorId:     integer('author_id').references(() => users.id, { onDelete: 'set null' }),
  errorMessage: text('error_message'),
  createdAt:    timestamp('created_at').notNull().defaultNow(),
  updatedAt:    timestamp('updated_at').notNull().defaultNow(),
});

export const marketingSocialAccounts = pgTable('marketing_social_accounts', {
  id:             serial('id').primaryKey(),
  platform:       varchar('platform', { length: 30 }).notNull(),
  accountName:    varchar('account_name', { length: 200 }).notNull(),
  accessTokenEnc: text('access_token_enc'),
  isActive:       boolean('is_active').notNull().default(true),
  expiresAt:      timestamp('expires_at'),
  createdAt:      timestamp('created_at').notNull().defaultNow(),
});
