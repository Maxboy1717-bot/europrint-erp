/**
 * @module schema-marketing-ext
 * @description Source module. See exports for details.
 */

import { pgTable, uuid, text, varchar, serial, boolean, integer, timestamp, index } from 'drizzle-orm/pg-core';

export const marketingContentPosts = pgTable('marketing_content_posts', {
  id:           serial('id').primaryKey(),
  title:        text('title').notNull(),
  platform:     varchar('platform', { length: 30 }).notNull(),
  content:      text('content').notNull(),
  postType:     text('post_type').notNull().default('blog'),
  status:       text('status').notNull().default('draft'),
  publishedAt:  timestamp('published_at', { withTimezone: true }),
  scheduledAt:  timestamp('scheduled_at', { withTimezone: true }),
  authorId:     integer('author_id'),
  tags:         text('tags'),
  category:     text('category'),
  createdAt:    timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index('mkt_posts_status_idx').on(t.status)]);

export const marketingSocialAccounts = pgTable('marketing_social_accounts', {
  id:           uuid('id').primaryKey().defaultRandom(),
  platform:     text('platform').notNull(),
  accountName:  text('account_name').notNull(),
  accountId:    text('account_id'),
  isActive:     boolean('is_active').notNull().default(true),
  accessToken:  text('access_token'),
  createdAt:    timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const marketingSocialPosts = pgTable('marketing_social_posts', {
  id:         uuid('id').primaryKey().defaultRandom(),
  accountId:  text('account_id'),
  content:    text('content').notNull(),
  platform:   text('platform').notNull(),
  status:     text('status').notNull().default('draft'),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  postedAt:   timestamp('posted_at', { withTimezone: true }),
  createdAt:  timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index('mkt_social_posts_status_idx').on(t.status)]);

export const marketingEmailTemplates = pgTable('marketing_email_templates', {
  id:          uuid('id').primaryKey().defaultRandom(),
  name:        text('name').notNull(),
  subject:     text('subject').notNull(),
  body:        text('body').notNull(),
  templateType: text('template_type').notNull().default('newsletter'),
  isActive:    boolean('is_active').notNull().default(true),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
