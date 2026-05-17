/**
 * @module users
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { pgTable, serial, varchar, integer, boolean, timestamp, text, index, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { positions } from "./positions";
import { departments } from "./departments";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 100 }).unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  middleName: varchar("middle_name", { length: 100 }),
  positionId: integer("position_id").references(() => positions.id, { onDelete: "set null" }),
  departmentId: integer("department_id").references(() => departments.id, { onDelete: "set null" }),
  phone: varchar("phone", { length: 20 }),
  avatarUrl: text("avatar_url"),
  telegramChatId: varchar("telegram_chat_id", { length: 50 }),
  language: varchar("language", { length: 5 }).default("uz"),
  isActive: boolean("is_active").default(true).notNull(),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("idx_users_position_id").on(t.positionId),
  index("idx_users_department_id").on(t.departmentId),
  index("idx_users_is_active").on(t.isActive),
  check("users_language_chk", sql`${t.language} IS NULL OR ${t.language} IN ('uz','ru','en')`),
]);

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true } as never);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
