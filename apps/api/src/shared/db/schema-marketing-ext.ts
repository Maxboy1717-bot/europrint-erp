/**
 * @module schema-marketing-ext
 * @description Source module. See exports for details.
 */

import { pgTable, uuid, text, boolean, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { stub } from './schema-compat-helpers';

export const marketingContentPosts = stub(pgTable('marketing_content_posts', {
  id:           uuid('id').primaryKey().defaultRandom(),
  title:        text('title').notNull(),
  content:      text('content'),
  postType:     text('post_type').notNull().default('blog'),
  status:       text('status').notNull().default('draft'),
  publishedAt:  timestamp('published_at', { withTimezone: true }),
  scheduledAt:  timestamp('scheduled_at', { withTimezone: true }),
  authorId:     integer('author_id'),
  tags:         text('tags'),
  category:     text('category'),
  createdAt:    timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index('mkt_posts_status_idx').on(t.status)]));

export const marketingSocialAccounts = stub(pgTable('marketing_social_accounts', {
  id:           uuid('id').primaryKey().defaultRandom(),
  platform:     text('platform').notNull(),
  accountName:  text('account_name').notNull(),
  accountId:    text('account_id'),
  isActive:     boolean('is_active').notNull().default(true),
  createdAt:    timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}));

export const marketingSocialPosts = stub(pgTable('marketing_social_posts', {
  id:         uuid('id').primaryKey().defaultRandom(),
  accountId:  text('account_id'),
  content:    text('content').notNull(),
  platform:   text('platform').notNull(),
  status:     text('status').notNull().default('draft'),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  postedAt:   timestamp('posted_at', { withTimezone: true }),
  createdAt:  timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index('mkt_social_posts_status_idx').on(t.status)]));

export const marketingEmailTemplates = stub(pgTable('marketing_email_templates', {
  id:          uuid('id').primaryKey().defaultRandom(),
  name:        text('name').notNull(),
  subject:     text('subject').notNull(),
  body:        text('body').notNull(),
  templateType: text('template_type').notNull().default('newsletter'),
  isActive:    boolean('is_active').notNull().default(true),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}));
