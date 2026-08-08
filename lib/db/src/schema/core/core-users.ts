/**
 * @module core-users
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 *
 * users / departments / positions are defined in their canonical top-level files.
 * This file re-exports them for backward-compatibility and adds core-only tables.
 */

import { sql } from "drizzle-orm";
import {
  pgTable, text, varchar, integer, boolean, timestamp, serial, jsonb,
  index
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "../users";

// ─── RE-EXPORTS from canonical top-level files ────────────────────────────────
export { users, insertUserSchema } from "../users";
export type { InsertUser, User } from "../users";
export { departments, insertDepartmentSchema } from "../departments";
export type { InsertDepartment, Department } from "../departments";
export { positions, insertPositionSchema } from "../positions";
export type { InsertPosition, Position } from "../positions";

// ─── ADMINS ──────────────────────────────────────────────────────────────────
// DB: varchar UUID PK — PRESERVED
export const admins = pgTable("admins", {
  id:           varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username:     varchar("username", { length: 50 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt:    timestamp("created_at").notNull().defaultNow(),
});

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
// NOTE (Q-29 re-verify 2026-07-02): kept — re-exported live via
// apps/api/src/shared/db/schema-business-a-1.ts (`notifications as notificationsApp`
// from '@workspace/db'). NOT orphan.
export const notifications = pgTable("notifications", {
  id:        serial("id").primaryKey(),
  userId:    integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type:      varchar("type", { length: 50 }).notNull(),
  title:     text("title").notNull(),
  titleRu:   text("title_ru"),
  message:   text("message").notNull(),
  messageRu: text("message_ru"),
  read:      boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // ─── live-DB superset columns (ADD-ONLY) ───
  body:              text("body"),
  isRead:            boolean("is_read").default(false),
  referenceId:       varchar("reference_id"),
  referenceType:     varchar("reference_type", { length: 50 }),
  entityType:        varchar("entity_type", { length: 50 }),
  entityId:          varchar("entity_id"),
  updatedAt:         timestamp("updated_at"),
  documentId:        varchar("document_id"),
  priority:          varchar("priority", { length: 20 }),
  titleUz:           text("title_uz"),
  messageUz:         text("message_uz"),
  readAt:            timestamp("read_at"),
  sentViaTelegram:   boolean("sent_via_telegram").default(false),
  telegramMessageId: varchar("telegram_message_id", { length: 100 }),
  notificationType:  varchar("notification_type", { length: 50 }),
  metadata:          jsonb("metadata"),
}, (t) => [
  index("idx_notifications_user_id").on(t.userId),
  index("idx_notifications_read").on(t.read),
  index("idx_notifications_created_at").on(t.createdAt),
]);

// ─── Zod schemas & Types ─────────────────────────────────────────────────────
export const insertAdminSchema        = createInsertSchema(admins).omit({ id: true, createdAt: true } as never);
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true } as never);

export type Admin               = typeof admins.$inferSelect;
export type InsertAdmin         = z.infer<typeof insertAdminSchema>;
export type Notification        = typeof notifications.$inferSelect;
export type InsertNotification  = z.infer<typeof insertNotificationSchema>;
