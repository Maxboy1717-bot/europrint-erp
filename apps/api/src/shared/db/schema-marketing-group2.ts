/**
 * @module schema-marketing-group2
 * @description Marketing GURUH 2 tables used by drizzle-marketing-group2.repo.ts.
 * blog_posts, marketing_budget_lines, marketing_lead_contacts: canonical in lib/db/src/schema/marketing-schema.ts.
 * marketing_calendar_events: local definition until next lib/db build.
 */

import { pgTable, serial, varchar, text, date, timestamp, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Re-export canonical tables from lib/db (available in dist)
export {
  blogPosts, marketingBudgetLines, marketingLeadContacts,
} from '@workspace/db';

export const marketingCalendarEvents = pgTable('marketing_calendar_events', {
  id:          serial('id').primaryKey(),
  title:       text('title').notNull(),
  eventType:   varchar('event_type', { length: 50 }).notNull().default('campaign'),
  startDate:   date('start_date').notNull(),
  endDate:     date('end_date'),
  description: text('description'),
  status:      varchar('status', { length: 50 }).notNull().default('planned'),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  check('mkt_cal_events_type_chk', sql`${t.eventType} IN ('campaign','meeting','deadline','exhibition')`),
  check('mkt_cal_events_status_chk', sql`${t.status} IN ('planned','ongoing','completed','cancelled')`),
]);

export type MarketingCalendarEvent = typeof marketingCalendarEvents.$inferSelect;
export type InsertMarketingCalendarEvent = typeof marketingCalendarEvents.$inferInsert;
