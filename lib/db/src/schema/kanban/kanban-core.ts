
import { sql } from "drizzle-orm";
import { serial, pgTable, text, varchar, integer, boolean, timestamp, uuid, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "../core-schema";

// ========== KANBAN DOSKA MODULI - CORE TABLES ==========

// Kanban Boards (Kanban doskalari)
export const kanbanBoards = pgTable("kanban_boards", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // "Savdo pipeline", "Ichki vazifalar", "Ishlab chiqarish tasklari"
  type: varchar("type", { length: 20 }).notNull().default("custom"), // crm_deals, tasks, custom
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
  deletedAt: timestamp("deleted_at"),
  deletedBy: varchar("deleted_by"),
});


export const insertKanbanBoardSchema = createInsertSchema(kanbanBoards, {
  name: z.string().min(3, "Board nomi kamida 3 ta belgidan iborat bo'lishi kerak"),
  type: z.enum(["crm_deals", "tasks", "custom"]),
}).omit({ id: true, createdAt: true } as never);


export type KanbanBoard = typeof kanbanBoards.$inferSelect;

export type InsertKanbanBoard = z.infer<typeof insertKanbanBoardSchema>;


// Kanban Columns (Ustunlar)
export const kanbanColumns = pgTable("kanban_columns", {
  id: serial("id").primaryKey(),
  boardId: varchar("board_id").references(() => kanbanBoards.id).notNull(),
  name: text("name").notNull(), // To Do, In Progress, Done
  sortOrder: integer("sort_order").notNull().default(0),
  color: varchar("color", { length: 20 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
  deletedAt: timestamp("deleted_at"),
  deletedBy: varchar("deleted_by"),
});


export const insertKanbanColumnSchema = createInsertSchema(kanbanColumns, {
  name: z.string().min(2, "Ustun nomi kamida 2 ta belgidan iborat bo'lishi kerak"),
  sortOrder: z.number().int().nonnegative(),
}).omit({ id: true, createdAt: true } as never);


export type KanbanColumn = typeof kanbanColumns.$inferSelect;

export type InsertKanbanColumn = z.infer<typeof insertKanbanColumnSchema>;


// Kanban Cards (Kartalar)
export const kanbanCards = pgTable("kanban_cards", {
  id: serial("id").primaryKey(),
  boardId: varchar("board_id").references(() => kanbanBoards.id).notNull(),
  columnId: varchar("column_id").references(() => kanbanColumns.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  relatedType: varchar("related_type", { length: 20 }), // deal, order, task, none
  relatedId: varchar("related_id", { length: 100 }), // crm_deals.id yoki boshqa
  ownerUserId: varchar("owner_user_id").references(() => users.id),
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
  acceptedById: varchar("accepted_by_id").references(() => users.id),
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
  cardId: varchar("card_id").references(() => kanbanCards.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


export const insertKanbanCommentSchema = createInsertSchema(kanbanComments, {
  comment: z.string().min(1, "Komment bo'sh bo'lmasligi kerak"),
}).omit({ id: true, createdAt: true } as never);


export type KanbanComment = typeof kanbanComments.$inferSelect;

export type InsertKanbanComment = z.infer<typeof insertKanbanCommentSchema>;
