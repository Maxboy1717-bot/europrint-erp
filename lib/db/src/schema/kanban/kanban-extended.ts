/**
 * @module kanban-extended
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */


import { sql } from "drizzle-orm";
import { serial, pgTable, text, varchar, integer, boolean, timestamp, check, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "../core-schema";
import { kanbanCards, kanbanBoards, kanbanColumns } from "./kanban-core";

// ============================================
// KANBAN KENGAYTIRILGAN FUNKSIYALAR
// ============================================

// Podvazifalar (Subtasks) - Kartaga tegishli kichik vazifalar
export const taskSubtasks = pgTable("task_subtasks", {
  id: serial("id").primaryKey(),
  parentCardId: varchar("parent_card_id").references(() => kanbanCards.id, { onDelete: 'cascade' }).notNull(),
  title: text("title").notNull(),
  completed: boolean("completed").notNull().default(false),
  assigneeId: varchar("assignee_id").references(() => users.id, { onDelete: "set null" }),
  dueDate: varchar("due_date", { length: 10 }),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  index("idx_task_subtasks_parent_card_id").on(t.parentCardId),
  index("idx_task_subtasks_assignee_id").on(t.assigneeId),
]);


export const insertTaskSubtaskSchema = createInsertSchema(taskSubtasks, {
  title: z.string().min(1, "Podvazifa nomi bo'sh bo'lmasligi kerak"),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak").optional(),
  sortOrder: z.number().int().nonnegative(),
}).omit({ id: true, createdAt: true } as never);


export type TaskSubtask = typeof taskSubtasks.$inferSelect;

export type InsertTaskSubtask = z.infer<typeof insertTaskSubtaskSchema>;


// Chek-listlar - Karta ichidagi tekshirish ro'yxati
export const taskChecklists = pgTable("task_checklists", {
  id: serial("id").primaryKey(),
  cardId: varchar("card_id").references(() => kanbanCards.id, { onDelete: 'cascade' }).notNull(),
  title: text("title").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_task_checklists_card_id").on(t.cardId),
]);


export const insertTaskChecklistSchema = createInsertSchema(taskChecklists, {
  title: z.string().min(1, "Chek-list nomi bo'sh bo'lmasligi kerak"),
  sortOrder: z.number().int().nonnegative(),
}).omit({ id: true, createdAt: true } as never);


export type TaskChecklist = typeof taskChecklists.$inferSelect;

export type InsertTaskChecklist = z.infer<typeof insertTaskChecklistSchema>;


// Chek-list elementlari - Chek-list ichidagi alohida bandlar
export const taskChecklistItems = pgTable("task_checklist_items", {
  id: serial("id").primaryKey(),
  checklistId: varchar("checklist_id").references(() => taskChecklists.id, { onDelete: 'cascade' }).notNull(),
  title: text("title").notNull(),
  completed: boolean("completed").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  index("idx_task_checklist_items_checklist_id").on(t.checklistId),
]);


export const insertTaskChecklistItemSchema = createInsertSchema(taskChecklistItems, {
  title: z.string().min(1, "Element nomi bo'sh bo'lmasligi kerak"),
  sortOrder: z.number().int().nonnegative(),
}).omit({ id: true, createdAt: true } as never);


export type TaskChecklistItem = typeof taskChecklistItems.$inferSelect;

export type InsertTaskChecklistItem = z.infer<typeof insertTaskChecklistItemSchema>;


// Teglar - Kartalarni guruhlash uchun rangli teglar
export const taskTags = pgTable("task_tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: varchar("color", { length: 20 }).notNull().default("#3b82f6"),
  boardId: varchar("board_id").references(() => kanbanBoards.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


export const insertTaskTagSchema = createInsertSchema(taskTags, {
  name: z.string().min(1, "Teg nomi bo'sh bo'lmasligi kerak"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Rang hex formatida bo'lishi kerak (masalan: #3b82f6)"),
}).omit({ id: true, createdAt: true } as never);


export type TaskTag = typeof taskTags.$inferSelect;

export type InsertTaskTag = z.infer<typeof insertTaskTagSchema>;


// Karta-teg bog'lanishlari - Ko'p-ko'plik uchun oraliq jadval
export const taskCardTags = pgTable("task_card_tags", {
  id: serial("id").primaryKey(),
  cardId: varchar("card_id").references(() => kanbanCards.id, { onDelete: 'cascade' }).notNull(),
  tagId: varchar("tag_id").references(() => taskTags.id, { onDelete: 'cascade' }).notNull(),
}, (t) => [
  index("idx_task_card_tags_card_id").on(t.cardId),
  index("idx_task_card_tags_tag_id").on(t.tagId),
]);


export const insertTaskCardTagSchema = createInsertSchema(taskCardTags).omit({ id: true } as never);


export type TaskCardTag = typeof taskCardTags.$inferSelect;

export type InsertTaskCardTag = z.infer<typeof insertTaskCardTagSchema>;


// Eslatmalar - Vazifa muddati yaqinlashganda xabar berish
export const taskReminders = pgTable("task_reminders", {
  id: serial("id").primaryKey(),
  cardId: varchar("card_id").references(() => kanbanCards.id, { onDelete: 'cascade' }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  reminderAt: timestamp("reminder_at").notNull(),
  sent: boolean("sent").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  index("idx_task_reminders_card_id").on(t.cardId),
  index("idx_task_reminders_user_id").on(t.userId),
  index("idx_task_reminders_reminder_at").on(t.reminderAt),
]);


export const insertTaskReminderSchema = createInsertSchema(taskReminders).omit({ id: true, createdAt: true } as never);


export type TaskReminder = typeof taskReminders.$inferSelect;

export type InsertTaskReminder = z.infer<typeof insertTaskReminderSchema>;


// Vaqt kuzatuvi - Vazifa ustida ishlangan vaqtni qayd qilish
export const taskTimeEntries = pgTable("task_time_entries", {
  id: serial("id").primaryKey(),
  cardId: varchar("card_id").references(() => kanbanCards.id, { onDelete: 'cascade' }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  startedAt: timestamp("started_at").notNull(),
  endedAt: timestamp("ended_at"),
  durationMinutes: integer("duration_minutes"),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  index("idx_task_time_entries_card_id").on(t.cardId),
  index("idx_task_time_entries_user_id").on(t.userId),
]);


export const insertTaskTimeEntrySchema = createInsertSchema(taskTimeEntries, {
  durationMinutes: z.number().int().nonnegative().optional(),
  description: z.string().max(500, "Tavsif 500 belgidan oshmasligi kerak").optional(),
}).omit({ id: true, createdAt: true } as never);


export type TaskTimeEntry = typeof taskTimeEntries.$inferSelect;

export type InsertTaskTimeEntry = z.infer<typeof insertTaskTimeEntrySchema>;


// Hamkorlar va kuzatuvchilar - Vazifaga tayinlangan yoki kuzatuvchi foydalanuvchilar
export const taskCollaborators = pgTable("task_collaborators", {
  id: serial("id").primaryKey(),
  cardId: varchar("card_id").references(() => kanbanCards.id, { onDelete: 'cascade' }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  role: varchar("role", { length: 20 }).notNull(), // 'collaborator', 'observer'
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("task_collaborators_role_chk", sql`${t.role} IN ('collaborator','observer')`),
  index("idx_task_collaborators_card_id").on(t.cardId),
  index("idx_task_collaborators_user_id").on(t.userId),
]);


export const insertTaskCollaboratorSchema = createInsertSchema(taskCollaborators, {
  role: z.enum(["collaborator", "observer"], { errorMap: () => ({ message: "Rol 'collaborator' yoki 'observer' bo'lishi kerak" }) }),
}).omit({ id: true, createdAt: true } as never);


export type TaskCollaborator = typeof taskCollaborators.$inferSelect;

export type InsertTaskCollaborator = z.infer<typeof insertTaskCollaboratorSchema>;


// Vazifa shablonlari - Tez vazifa yaratish uchun oldindan tayyorlangan shablonlar
export const taskTemplates = pgTable("task_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  priority: varchar("priority", { length: 20 }).notNull().default("normal"),
  checklistItems: text("checklist_items").array(),
  boardId: varchar("board_id").references(() => kanbanBoards.id, { onDelete: "set null" }),
  createdById: integer("created_by_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
  deletedAt: timestamp("deleted_at"),
  deletedBy: varchar("deleted_by"),
}, (t) => [
  check("task_templates_priority_chk", sql`${t.priority} IN ('low','normal','high','urgent')`),
]);


export const insertTaskTemplateSchema = createInsertSchema(taskTemplates, {
  name: z.string().min(1, "Shablon nomi bo'sh bo'lmasligi kerak"),
  title: z.string().min(1, "Vazifa sarlavhasi bo'sh bo'lmasligi kerak"),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  checklistItems: z.array(z.string()).optional(),
}).omit({ id: true, createdAt: true } as never);


export type TaskTemplate = typeof taskTemplates.$inferSelect;

export type InsertTaskTemplate = z.infer<typeof insertTaskTemplateSchema>;


// Vazifa fayllari - Kartaga biriktirilgan hujjatlar va rasmlar
export const taskFiles = pgTable("task_files", {
  id: serial("id").primaryKey(),
  cardId: varchar("card_id").references(() => kanbanCards.id, { onDelete: 'cascade' }).notNull(),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type", { length: 100 }),
  uploadedById: varchar("uploaded_by_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  index("idx_task_files_card_id").on(t.cardId),
  index("idx_task_files_uploaded_by_id").on(t.uploadedById),
]);


export const insertTaskFileSchema = createInsertSchema(taskFiles, {
  fileName: z.string().min(1, "Fayl nomi bo'sh bo'lmasligi kerak"),
  fileUrl: z.string().url("Fayl URL manzili noto'g'ri"),
  fileSize: z.number().int().positive("Fayl hajmi musbat bo'lishi kerak").optional(),
  mimeType: z.string().max(100, "MIME turi 100 belgidan oshmasligi kerak").optional(),
}).omit({ id: true, createdAt: true } as never);


export type TaskFile = typeof taskFiles.$inferSelect;

export type InsertTaskFile = z.infer<typeof insertTaskFileSchema>;


// Vazifa holati tarixi - Kartaning ustunlar orasida ko'chishi va holat o'zgarishlarini kuzatish
export const taskStatusHistory = pgTable("task_status_history", {
  id: serial("id").primaryKey(),
  cardId: varchar("card_id").references(() => kanbanCards.id, { onDelete: 'cascade' }).notNull(),
  fromColumnId: varchar("from_column_id").references(() => kanbanColumns.id, { onDelete: "set null" }),
  toColumnId: varchar("to_column_id").references(() => kanbanColumns.id, { onDelete: "set null" }),
  fromStatus: varchar("from_status", { length: 50 }),
  toStatus: varchar("to_status", { length: 50 }),
  changedById: varchar("changed_by_id").references(() => users.id, { onDelete: "set null" }),
  changedAt: timestamp("changed_at").notNull().defaultNow(),
}, (t) => [
  index("idx_task_status_history_card_id").on(t.cardId),
  index("idx_task_status_history_changed_at").on(t.changedAt),
]);


export const insertTaskStatusHistorySchema = createInsertSchema(taskStatusHistory, {
  fromStatus: z.string().max(50, "Holat nomi 50 belgidan oshmasligi kerak").optional(),
  toStatus: z.string().max(50, "Holat nomi 50 belgidan oshmasligi kerak").optional(),
}).omit({ id: true, changedAt: true } as never);


export type TaskStatusHistory = typeof taskStatusHistory.$inferSelect;

export type InsertTaskStatusHistory = z.infer<typeof insertTaskStatusHistorySchema>;


// Vazifa natijalari - Bajarilgan ishlarning yakuniy natijalari va tavsifi
export const taskResults = pgTable("task_results", {
  id: serial("id").primaryKey(),
  cardId: varchar("card_id").references(() => kanbanCards.id, { onDelete: 'cascade' }).notNull(),
  description: text("description"),
  createdById: integer("created_by_id").references(() => users.id, { onDelete: "restrict" }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});


export const insertTaskResultSchema = createInsertSchema(taskResults, {
  description: z.string().optional(),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);


export type TaskResult = typeof taskResults.$inferSelect;

export type InsertTaskResult = z.infer<typeof insertTaskResultSchema>;


// Natija fayllari - Vazifa natijalariga biriktirilgan hujjatlar
export const taskResultFiles = pgTable("task_result_files", {
  id: serial("id").primaryKey(),
  resultId: varchar("result_id").references(() => taskResults.id, { onDelete: 'cascade' }).notNull(),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type", { length: 100 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


export const insertTaskResultFileSchema = createInsertSchema(taskResultFiles, {
  fileName: z.string().min(1, "Fayl nomi bo'sh bo'lmasligi kerak"),
  fileUrl: z.string().url("Fayl URL manzili noto'g'ri"),
  fileSize: z.number().int().positive("Fayl hajmi musbat bo'lishi kerak").optional(),
  mimeType: z.string().max(100, "MIME turi 100 belgidan oshmasligi kerak").optional(),
}).omit({ id: true, createdAt: true } as never);


export type TaskResultFile = typeof taskResultFiles.$inferSelect;

export type InsertTaskResultFile = z.infer<typeof insertTaskResultFileSchema>;


// Vazifa chat xabarlari - Vazifa ichidagi muloqot va faoliyat xabarlari
export const taskChatMessages = pgTable("task_chat_messages", {
  id: serial("id").primaryKey(),
  cardId: varchar("card_id").references(() => kanbanCards.id, { onDelete: 'cascade' }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  message: text("message").notNull(),
  messageType: varchar("message_type", { length: 20 }).notNull().default("user"), // user, system, activity
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("task_chat_messages_type_chk", sql`${t.messageType} IN ('user','system','activity')`),
]);


export const insertTaskChatMessageSchema = createInsertSchema(taskChatMessages, {
  message: z.string().min(1, "Xabar bo'sh bo'lmasligi kerak"),
  messageType: z.enum(["user", "system", "activity"]).default("user"),
}).omit({ id: true, createdAt: true } as never);


export type TaskChatMessage = typeof taskChatMessages.$inferSelect;

export type InsertTaskChatMessage = z.infer<typeof insertTaskChatMessageSchema>;


// Chat xabarlari fayllari - Chat xabarlariga biriktirilgan fayllar
export const taskChatMessageFiles = pgTable("task_chat_message_files", {
  id: serial("id").primaryKey(),
  messageId: varchar("message_id").references(() => taskChatMessages.id, { onDelete: 'cascade' }).notNull(),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type", { length: 100 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


export const insertTaskChatMessageFileSchema = createInsertSchema(taskChatMessageFiles, {
  fileName: z.string().min(1, "Fayl nomi bo'sh bo'lmasligi kerak"),
  fileUrl: z.string().url("Fayl URL manzili noto'g'ri"),
  fileSize: z.number().int().positive("Fayl hajmi musbat bo'lishi kerak").optional(),
  mimeType: z.string().max(100, "MIME turi 100 belgidan oshmasligi kerak").optional(),
}).omit({ id: true, createdAt: true } as never);


export type TaskChatMessageFile = typeof taskChatMessageFiles.$inferSelect;

export type InsertTaskChatMessageFile = z.infer<typeof insertTaskChatMessageFileSchema>;


// Vaqt kuzatuvi - Vazifa uchun sarflangan vaqtni kuzatish va hisoblab borish
export const taskTimeTracks = pgTable("task_time_tracks", {
  id: serial("id").primaryKey(),
  cardId: varchar("card_id").references(() => kanbanCards.id, { onDelete: 'cascade' }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  startedAt: timestamp("started_at").notNull(),
  endedAt: timestamp("ended_at"),
  durationMinutes: integer("duration_minutes"),
  targetMinutes: integer("target_minutes"), // rejalashtirilgan vaqt
  isRunning: boolean("is_running").notNull().default(false),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


export const insertTaskTimeTrackSchema = createInsertSchema(taskTimeTracks, {
  durationMinutes: z.number().int().nonnegative("Vaqt davomiyligi manfiy bo'lmasligi kerak").optional(),
  targetMinutes: z.number().int().positive("Rejalashtirilgan vaqt musbat bo'lishi kerak").optional(),
  description: z.string().optional(),
}).omit({ id: true, createdAt: true } as never);


export type TaskTimeTrack = typeof taskTimeTracks.$inferSelect;

export type InsertTaskTimeTrack = z.infer<typeof insertTaskTimeTrackSchema>;


// Vazifa kuzatuvchilari (Nablyudateli) - Vazifani kuzatuvchi foydalanuvchilar
export const taskObservers = pgTable("task_observers", {
  id: serial("id").primaryKey(),
  cardId: varchar("card_id").references(() => kanbanCards.id, { onDelete: 'cascade' }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  addedById: varchar("added_by_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


export const insertTaskObserverSchema = createInsertSchema(taskObservers, {}).omit({ id: true, createdAt: true } as never);


export type TaskObserver = typeof taskObservers.$inferSelect;

export type InsertTaskObserver = z.infer<typeof insertTaskObserverSchema>;


// Vazifa hamijrochilari (Soispolniteli) - Vazifada qatnashuvchi qo'shimcha ijrochilar
export const taskCoExecutors = pgTable("task_co_executors", {
  id: serial("id").primaryKey(),
  cardId: varchar("card_id").references(() => kanbanCards.id, { onDelete: 'cascade' }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  addedById: varchar("added_by_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


export const insertTaskCoExecutorSchema = createInsertSchema(taskCoExecutors, {}).omit({ id: true, createdAt: true } as never);


export type TaskCoExecutor = typeof taskCoExecutors.$inferSelect;

export type InsertTaskCoExecutor = z.infer<typeof insertTaskCoExecutorSchema>;


// Loyihalar - Vazifalarni guruhlash va boshqarish uchun loyihalar
export const taskProjects = pgTable("task_projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  color: varchar("color", { length: 20 }).notNull().default("#3b82f6"),
  startDate: varchar("start_date", { length: 10 }),
  endDate: varchar("end_date", { length: 10 }),
  ownerId: varchar("owner_id").references(() => users.id, { onDelete: "set null" }),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, completed, archived
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
  deletedAt: timestamp("deleted_at"),
  deletedBy: varchar("deleted_by"),
}, (t) => [
  check("task_projects_status_chk", sql`${t.status} IN ('active','completed','archived')`),
]);


export const insertTaskProjectSchema = createInsertSchema(taskProjects, {
  name: z.string().min(1, "Loyiha nomi bo'sh bo'lmasligi kerak"),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Rang formati noto'g'ri (hex)").default("#3b82f6"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana formati YYYY-MM-DD bo'lishi kerak").optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana formati YYYY-MM-DD bo'lishi kerak").optional(),
  status: z.enum(["active", "completed", "archived"]).default("active"),
}).omit({ id: true, createdAt: true } as never);


export type TaskProject = typeof taskProjects.$inferSelect;

export type InsertTaskProject = z.infer<typeof insertTaskProjectSchema>;


// Loyiha a'zolari - Loyihaga tayinlangan xodimlar va ularning rollari
export const taskProjectMembers = pgTable("task_project_members", {
  id: serial("id").primaryKey(),
  projectId: varchar("project_id").references(() => taskProjects.id, { onDelete: 'cascade' }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("member"), // owner, admin, member
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("task_project_members_role_chk", sql`${t.role} IN ('owner','admin','member')`),
]);


export const insertTaskProjectMemberSchema = createInsertSchema(taskProjectMembers, {
  role: z.enum(["owner", "admin", "member"]).default("member"),
}).omit({ id: true, createdAt: true } as never);


export type TaskProjectMember = typeof taskProjectMembers.$inferSelect;

export type InsertTaskProjectMember = z.infer<typeof insertTaskProjectMemberSchema>;


// Avtomatlashtirish robotlari - Vazifalar uchun avtomatik harakatlar va triggerlar
export const automationRobots = pgTable("automation_robots", {
  id: serial("id").primaryKey(),
  boardId: varchar("board_id").references(() => kanbanBoards.id, { onDelete: 'cascade' }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  triggerType: varchar("trigger_type", { length: 50 }).notNull(), // on_create, on_move, on_complete, on_deadline
  triggerColumnId: varchar("trigger_column_id").references(() => kanbanColumns.id, { onDelete: "set null" }),
  actionType: varchar("action_type", { length: 50 }).notNull(), // move_to_column, send_notification, assign_user, add_tag
  actionConfig: text("action_config"), // JSON config
  isActive: boolean("is_active").notNull().default(true),
  createdById: integer("created_by_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
  deletedAt: timestamp("deleted_at"),
  deletedBy: varchar("deleted_by"),
}, (t) => [
  check("automation_robots_trigger_chk", sql`${t.triggerType} IN ('on_create','on_move','on_complete','on_deadline')`),
  check("automation_robots_action_chk", sql`${t.actionType} IN ('move_to_column','send_notification','assign_user','add_tag')`),
]);


export const insertAutomationRobotSchema = createInsertSchema(automationRobots, {
  name: z.string().min(1, "Robot nomi bo'sh bo'lmasligi kerak"),
  description: z.string().optional(),
  triggerType: z.enum(["on_create", "on_move", "on_complete", "on_deadline"]),
  actionType: z.enum(["move_to_column", "send_notification", "assign_user", "add_tag"]),
  actionConfig: z.string().optional(),
}).omit({ id: true, createdAt: true } as never);


export type AutomationRobot = typeof automationRobots.$inferSelect;

export type InsertAutomationRobot = z.infer<typeof insertAutomationRobotSchema>;


// Task Flows (Potoki) - Avtomatik vazifa tayinlash oqimlari
export const taskFlows = pgTable("task_flows", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  boardId: varchar("board_id").references(() => kanbanBoards.id, { onDelete: "set null" }),
  assignmentType: varchar("assignment_type", { length: 20 }).notNull(), // 'round_robin', 'least_busy', 'random'
  userIds: text("user_ids").array(), // Array of user IDs in the flow
  lastAssignedIndex: integer("last_assigned_index").notNull().default(0), // For round-robin tracking
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("task_flows_assignment_chk", sql`${t.assignmentType} IN ('round_robin','least_busy','random')`),
]);


export const insertTaskFlowSchema = createInsertSchema(taskFlows, {
  name: z.string().min(1, "Oqim nomi bo'sh bo'lmasligi kerak"),
  assignmentType: z.enum(["round_robin", "least_busy", "random"]),
  userIds: z.array(z.string()).min(1, "Kamida bitta foydalanuvchi tanlang"),
}).omit({ id: true, createdAt: true, lastAssignedIndex: true } as never);


export type TaskFlow = typeof taskFlows.$inferSelect;

export type InsertTaskFlow = z.infer<typeof insertTaskFlowSchema>;


// Vazifa bildirishnomalari - Foydalanuvchilarga vazifa bo'yicha xabarlar
export const taskNotifications = pgTable("task_notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  cardId: varchar("card_id").references(() => kanbanCards.id, { onDelete: 'cascade' }),
  type: varchar("type", { length: 50 }).notNull(), // task_assigned, deadline_reminder, comment_added, status_changed
  title: text("title").notNull(),
  message: text("message"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  check("task_notifications_type_chk", sql`${t.type} IN ('task_assigned','deadline_reminder','comment_added','status_changed')`),
]);


export const insertTaskNotificationSchema = createInsertSchema(taskNotifications, {
  type: z.enum(["task_assigned", "deadline_reminder", "comment_added", "status_changed"]),
  title: z.string().min(1, "Bildirishnoma sarlavhasi bo'sh bo'lmasligi kerak"),
  message: z.string().optional(),
}).omit({ id: true, createdAt: true } as never);


export type TaskNotification = typeof taskNotifications.$inferSelect;

export type InsertTaskNotification = z.infer<typeof insertTaskNotificationSchema>;


// Ko'rinish sozlamalari - Foydalanuvchining shaxsiy filter va ko'rinish parametrlari
export const taskViewPreferences = pgTable("task_view_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  boardId: varchar("board_id").references(() => kanbanBoards.id, { onDelete: "set null" }),
  viewType: varchar("view_type", { length: 20 }).notNull().default("kanban"), // kanban, list, calendar, gantt, my_plan
  filters: text("filters"), // JSON filters
  sortBy: varchar("sort_by", { length: 50 }),
  sortOrder: varchar("sort_order", { length: 10 }).default("asc"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  check("task_view_prefs_view_type_chk", sql`${t.viewType} IN ('kanban','list','calendar','gantt','my_plan')`),
  check("task_view_prefs_sort_order_chk", sql`${t.sortOrder} IS NULL OR ${t.sortOrder} IN ('asc','desc')`),
]);


export const insertTaskViewPreferenceSchema = createInsertSchema(taskViewPreferences, {
  viewType: z.enum(["kanban", "list", "calendar", "gantt", "my_plan"]).default("kanban"),
  filters: z.string().optional(),
  sortBy: z.string().max(50, "Saralash maydoni 50 belgidan oshmasligi kerak").optional(),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);


export type TaskViewPreference = typeof taskViewPreferences.$inferSelect;

export type InsertTaskViewPreference = z.infer<typeof insertTaskViewPreferenceSchema>;
