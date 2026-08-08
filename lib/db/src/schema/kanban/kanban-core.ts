/**
 * @module kanban-core
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */


import { sql } from "drizzle-orm";
import { serial, pgTable, text, varchar, integer, boolean, timestamp, uuid, index, check } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "../core-schema";

// ========== KANBAN DOSKA MODULI - CORE TABLES ==========
// NOTE: `kanbanBoards` (kanban_boards) and `kanbanColumns` (kanban_columns) pgTables
// removed 2026-07-02 — orphan in lib/db (no consumer via @workspace/db or
// @europrint/schemas). Dependent tables below keep their board_id/column_id columns
// but no longer hold a Drizzle-level FK to the deleted tables.

// Kanban Cards (Kartalar)
export const kanbanCards = pgTable("kanban_cards", {
  id: serial("id").primaryKey(),
  boardId: varchar("board_id").notNull(),
  columnId: varchar("column_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  relatedType: varchar("related_type", { length: 20 }), // deal, order, task, none
  relatedId: varchar("related_id", { length: 100 }), // crm_deals.id yoki boshqa
  ownerUserId: varchar("owner_user_id").references(() => users.id, { onDelete: "set null" }),
  priority: varchar("priority", { length: 20 }).notNull().default("normal"), // low, normal, high, urgent
  dueDate: varchar("due_date", { length: 10 }), // YYYY-MM-DD
  sortOrder: integer("sort_order").notNull().default(0),
  // Self-reference: parentCardId links to parent kanban card for nested card hierarchy
  // Using comments instead of .references() due to Drizzle ORM circular type inference limitations
  parentCardId: varchar("parent_card_id"),
  projectId: varchar("project_id"), // Loyiha ID (task_projects jadvaliga)
  estimatedTime: integer("estimated_time"), // Rejalashtirilgan vaqt (soatda)
  startDate: varchar("start_date", { length: 10 }), // Boshlanish sanasi YYYY-MM-DD
  recurrencePattern: varchar("recurrence_pattern", { length: 20 }), // 'daily', 'weekly', 'monthly', 'yearly', null
  recurrenceInterval: integer("recurrence_interval").default(1), // Every N days/weeks/months
  recurrenceEndDate: varchar("recurrence_end_date", { length: 10 }), // YYYY-MM-DD
  lastRecurrenceCreated: timestamp("last_recurrence_created"),
  // Telegram integratsiya maydonlari
  source: varchar("source", { length: 20 }).notNull().default("kanban"), // kanban, telegram, email
  telegramMessageId: varchar("telegram_message_id", { length: 100 }),
  telegramChatId: varchar("telegram_chat_id", { length: 100 }),
  // Qabul qilish/bajarish workflow
  acceptedAt: timestamp("accepted_at"),
  acceptedById: varchar("accepted_by_id").references(() => users.id, { onDelete: "set null" }),
  completedAt: timestamp("completed_at"),
  completionReport: text("completion_report"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  index("idx_kanban_cards_board_id").on(t.boardId),
  index("idx_kanban_cards_column_id").on(t.columnId),
  index("idx_kanban_cards_owner_user_id").on(t.ownerUserId),
  index("idx_kanban_cards_priority").on(t.priority),
  index("idx_kanban_cards_created_at").on(t.createdAt),
  index("idx_kanban_cards_deleted_at").on(t.deletedAt),
  check("kanban_cards_priority_chk", sql`${t.priority} IN ('low','normal','high','urgent')`),
  check("kanban_cards_source_chk", sql`${t.source} IN ('kanban','telegram','email')`),
  check("kanban_cards_related_type_chk", sql`${t.relatedType} IS NULL OR ${t.relatedType} IN ('deal','order','task','none')`),
  check("kanban_cards_recurrence_chk", sql`${t.recurrencePattern} IS NULL OR ${t.recurrencePattern} IN ('daily','weekly','monthly','yearly')`),
]);


export const insertKanbanCardSchema = createInsertSchema(kanbanCards, {
  title: z.string().min(3, "Karta nomi kamida 3 ta belgidan iborat bo'lishi kerak"),
  relatedType: z.enum(["deal", "order", "task", "none"]).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak").optional(),
  estimatedTime: z.number().int().positive().optional().nullable(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak").optional().nullable(),
  recurrencePattern: z.enum(["daily", "weekly", "monthly", "yearly"]).optional().nullable(),
  recurrenceInterval: z.number().int().positive().optional(),
  recurrenceEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak").optional().nullable(),
  source: z.enum(["kanban", "telegram", "email"]).optional(),
  completionReport: z.string().optional().nullable(),
}).omit({ id: true, createdAt: true, updatedAt: true, lastRecurrenceCreated: true, acceptedAt: true, completedAt: true } as never);


export type KanbanCard = typeof kanbanCards.$inferSelect;

export type InsertKanbanCard = z.infer<typeof insertKanbanCardSchema>;


// Kanban Comments (Kommentlar)
export const kanbanComments = pgTable("kanban_comments", {
  id: serial("id").primaryKey(),
  cardId: varchar("card_id").references(() => kanbanCards.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_kanban_comments_card_id").on(t.cardId),
  index("idx_kanban_comments_user_id").on(t.userId),
]);


export const insertKanbanCommentSchema = createInsertSchema(kanbanComments, {
  comment: z.string().min(1, "Komment bo'sh bo'lmasligi kerak"),
}).omit({ id: true, createdAt: true } as never);


export type KanbanComment = typeof kanbanComments.$inferSelect;

export type InsertKanbanComment = z.infer<typeof insertKanbanCommentSchema>;
