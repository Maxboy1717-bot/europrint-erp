/**
 * @module core-schema
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { numericMoney } from "./numeric-money";
import { sql } from "drizzle-orm";
import { serial, pgTable, text, varchar, integer, boolean, timestamp, jsonb, real, index, check } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { courses } from "./lms-schema";
import { orders, workCenters } from "./pp-schema";

export * from "./core/core-users";
export * from "./core/core-ai";
export * from "./core/core-ai-reports";
export * from "./core/core-rules";
export * from "./core/core-enterprise";

import { users, admins, departments, positions } from "./core/core-users";

// ========== SETTINGS & SUPPORT ==========

export const supportMessages = pgTable("support_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  message: text("message").notNull(),
  response: text("response"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  respondedAt: timestamp("responded_at"),
});

export const insertSupportMessageSchema = createInsertSchema(supportMessages, {
  message: z.string().min(1),
  response: z.string().optional(),
}).omit({ id: true, createdAt: true } as never);

export type SupportMessage = typeof supportMessages.$inferSelect;
export type InsertSupportMessage = z.infer<typeof insertSupportMessageSchema>;

export const contactSettings = pgTable("contact_settings", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 100 }).notNull().default("info@europrint.uz"),
  phone: varchar("phone", { length: 50 }).notNull().default("+998 71 123 45 67"),
  website: varchar("website", { length: 100 }).notNull().default("www.europrint.uz"),
  address: text("address").notNull().default("Toshkent shahar, Yashnobod tumani"),
  addressRu: text("address_ru").notNull().default("г. Ташкент, Яшнабадский район"),
  workingHours: text("working_hours").notNull().default("9:00 - 18:00 (Dushanba - Juma)"),
  workingHoursRu: text("working_hours_ru").notNull().default("9:00 - 18:00 (Понедельник - Пятница)"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertContactSettingsSchema = createInsertSchema(contactSettings).omit({ id: true, updatedAt: true } as never);

export type ContactSettings = typeof contactSettings.$inferSelect;
export type InsertContactSettings = z.infer<typeof insertContactSettingsSchema>;

export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  companyName: varchar("company_name", { length: 100 }).notNull().default("Europrint"),
  defaultLanguage: varchar("default_language", { length: 5 }).notNull().default("uz"),
  notificationsEnabled: boolean("notifications_enabled").notNull().default(true),
  passPercentage: integer("pass_percentage").notNull().default(80),
  maxAttempts: integer("max_attempts").notNull().default(3),
  randomizeQuestions: boolean("randomize_questions").notNull().default(true),
  gptModel: varchar("gpt_model", { length: 50 }).notNull().default("gpt-4o"),
  promptTemplate: text("prompt_template").notNull().default("KONTEKST: Europrint {bo'lim} bo'limi, lavozim: {lavozim}.\nYO'RIQNOMA: {yo'riqnoma_matni}\nRUBRIKA VA VAZNLAR: {rubrika_json}\nTOPSHIRIQ: {savol_matni}\nXODIM JAVOBI: {xodim_javobi}"),
  inpsRate: real("inps_rate").default(0.12),
  minWage: integer("min_wage").default(1120000),
  qqsRate: real("qqs_rate").default(12.0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSystemSettingsSchema = createInsertSchema(systemSettings).omit({ id: true, updatedAt: true } as never);

export type SystemSettings = typeof systemSettings.$inferSelect;
export type InsertSystemSettings = z.infer<typeof insertSystemSettingsSchema>;

// ========== CALENDAR & ROOMS ==========

export const meetingRooms = pgTable("meeting_rooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameRu: text("name_ru"),
  location: text("location"),
  locationRu: text("location_ru"),
  capacity: integer("capacity").notNull(),
  facilities: jsonb("facilities"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const calendarEvents = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  titleRu: text("title_ru"),
  description: text("description"),
  descriptionRu: text("description_ru"),
  type: varchar("type", { length: 20 }).notNull(),
  courseId: integer("course_id").references(() => courses.id, { onDelete: "cascade" }),
  trainerId: integer("trainer_id").references(() => users.id, { onDelete: 'set null' }),
  roomId: integer("room_id").references(() => meetingRooms.id, { onDelete: 'set null' }),
  startDate: varchar("start_date", { length: 10 }).notNull(),
  startTime: varchar("start_time", { length: 8 }).notNull(),
  endDate: varchar("end_date", { length: 10 }).notNull(),
  endTime: varchar("end_time", { length: 8 }).notNull(),
  maxParticipants: integer("max_participants"),
  targetDepartments: text("target_departments").array(),
  targetPositions: text("target_positions").array(),
  status: varchar("status", { length: 20 }).notNull().default("scheduled"),
  createdBy: varchar("created_by").notNull().references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
  deletedAt: timestamp("deleted_at"),
  deletedBy: varchar("deleted_by"),
});

export const eventParticipants = pgTable("event_participants", {
  id: serial("id").primaryKey(),
  eventId: varchar("event_id").notNull().references(() => calendarEvents.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 20 }).notNull().default("registered"),
  registeredAt: timestamp("registered_at").notNull().defaultNow(),
});

export const roomBookings = pgTable("room_bookings", {
  id: serial("id").primaryKey(),
  roomId: varchar("room_id").notNull().references(() => meetingRooms.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  date: varchar("date", { length: 10 }).notNull(),
  startTime: varchar("start_time", { length: 8 }).notNull(),
  endTime: varchar("end_time", { length: 8 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("confirmed"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reminders = pgTable("reminders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 20 }).notNull(),
  relatedId: varchar("related_id"),
  title: text("title").notNull(),
  titleRu: text("title_ru"),
  message: text("message"),
  messageRu: text("message_ru"),
  remindAt: timestamp("remind_at").notNull(),
  sent: boolean("sent").notNull().default(false),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMeetingRoomSchema = createInsertSchema(meetingRooms).omit({ id: true, createdAt: true } as never);
export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({ id: true, createdAt: true } as never);
export const insertEventParticipantSchema = createInsertSchema(eventParticipants).omit({ id: true, registeredAt: true } as never);
export const insertRoomBookingSchema = createInsertSchema(roomBookings).omit({ id: true, createdAt: true } as never);
export const insertReminderSchema = createInsertSchema(reminders).omit({ id: true, createdAt: true } as never);

export type MeetingRoom = typeof meetingRooms.$inferSelect;
export type InsertMeetingRoom = z.infer<typeof insertMeetingRoomSchema>;
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;
export type EventParticipant = typeof eventParticipants.$inferSelect;
export type InsertEventParticipant = z.infer<typeof insertEventParticipantSchema>;
export type RoomBooking = typeof roomBookings.$inferSelect;
export type InsertRoomBooking = z.infer<typeof insertRoomBookingSchema>;
export type Reminder = typeof reminders.$inferSelect;
export type InsertReminder = z.infer<typeof insertReminderSchema>;

// ========== SOCIAL & BROADCASTS ==========

export const broadcasts = pgTable("broadcasts", {
  id: serial("id").primaryKey(),
  message: text("message").notNull(),
  messageRu: text("message_ru"),
  mediaType: varchar("media_type", { length: 20 }),
  mediaPath: text("media_path"),
  mediaCaption: text("media_caption"),
  sentBy: varchar("sent_by").references(() => admins.id, { onDelete: 'set null' }),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  recipientCount: integer("recipient_count").notNull().default(0),
  successCount: integer("success_count").notNull().default(0),
  failedCount: integer("failed_count").notNull().default(0),
});

export const insertBroadcastSchema = createInsertSchema(broadcasts).omit({
  id: true, sentAt: true, recipientCount: true, successCount: true, failedCount: true,
} as never);

export const surveys = pgTable("surveys", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  titleRu: text("title_ru"),
  description: text("description"),
  descriptionRu: text("description_ru"),
  questions: jsonb("questions").notNull(),
  targetDepartments: jsonb("target_departments"),
  targetPositions: jsonb("target_positions"),
  createdBy: varchar("created_by").references(() => admins.id, { onDelete: "set null" }),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  closedAt: timestamp("closed_at"),
  totalRecipients: integer("total_recipients").notNull().default(0),
  totalResponses: integer("total_responses").notNull().default(0),
});

export const surveyResponses = pgTable("survey_responses", {
  id: serial("id").primaryKey(),
  surveyId: varchar("survey_id").notNull().references(() => surveys.id, { onDelete: 'cascade' }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  answers: jsonb("answers").notNull(),
  respondedAt: timestamp("responded_at").notNull().defaultNow(),
});

export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  titleRu: text("title_ru"),
  description: text("description"),
  descriptionRu: text("description_ru"),
  departmentId: integer("department_id").references(() => departments.id, { onDelete: 'set null' }),
  positionId: integer("position_id").references(() => positions.id, { onDelete: 'set null' }),
  questions: jsonb("questions").notNull(),
  dueDays: integer("due_days"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const applicationResponses = pgTable("application_responses", {
  id: serial("id").primaryKey(),
  applicationId: varchar("application_id").notNull().references(() => applications.id, { onDelete: 'cascade' }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  answers: jsonb("answers").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  assignedTo: integer("assigned_to").references(() => users.id, { onDelete: 'set null' }),
  reviewedBy: varchar("reviewed_by").references(() => admins.id, { onDelete: 'set null' }),
  reviewedAt: timestamp("reviewed_at"),
  notes: text("notes"),
  response: text("response"),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  lastNotifiedAt: timestamp("last_notified_at"),
});

export const insertSurveySchema = createInsertSchema(surveys).omit({
  id: true, createdAt: true, closedAt: true, totalRecipients: true, totalResponses: true,
} as never);
export const insertSurveyResponseSchema = createInsertSchema(surveyResponses).omit({ id: true, respondedAt: true } as never);
export const insertApplicationSchema = createInsertSchema(applications).omit({ id: true, createdAt: true } as never).extend({
  dueDays: z.number().int().min(0).max(365).optional(),
});
export const insertApplicationResponseSchema = createInsertSchema(applicationResponses).omit({
  id: true, submittedAt: true, reviewedAt: true,
} as never);

export type Broadcast = typeof broadcasts.$inferSelect;
export type InsertBroadcast = z.infer<typeof insertBroadcastSchema>;
export type Application = typeof applications.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type ApplicationResponse = typeof applicationResponses.$inferSelect;
export type InsertApplicationResponse = z.infer<typeof insertApplicationResponseSchema>;

// ========== ANALYTICS & ROLES ==========

export const kpiResults = pgTable("kpi_results", {
  id: serial("id").primaryKey(),
  kpiName: varchar("kpi_name", { length: 50 }).notNull(),
  calculationDate: varchar("calculation_date", { length: 10 }).notNull(),
  periodType: varchar("period_type", { length: 20 }).notNull(),
  workCenterId: varchar("work_center_id").references(() => workCenters.id, { onDelete: 'set null' }),
  departmentId: integer("department_id").references(() => departments.id, { onDelete: 'set null' }),
  targetValue: numericMoney("target_value"),
  actualValue: numericMoney("actual_value").notNull(),
  variance: numericMoney("variance"),
  variancePercent: numericMoney("variance_percent"),
  status: varchar("status", { length: 20 }).notNull().default("normal"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("kpi_results_status_chk", sql`${t.status} IN ('below_target','normal','above_target')`),
  check("kpi_results_period_type_chk", sql`${t.periodType} IN ('daily','weekly','monthly')`),
]);

export const insertKpiResultSchema = createInsertSchema(kpiResults, {
  kpiName: z.string().min(1, "KPI nomi talab qilinadi"),
  calculationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  periodType: z.enum(["daily", "weekly", "monthly"]),
  actualValue: z.number(),
  status: z.enum(["below_target", "normal", "above_target"]),
}).omit({ id: true, createdAt: true } as never);

export type KpiResult = typeof kpiResults.$inferSelect;
export type InsertKpiResult = z.infer<typeof insertKpiResultSchema>;

export const erpRoles = pgTable("erp_roles", {
  id: serial("id").primaryKey(),
  roleName: varchar("role_name", { length: 50 }).notNull().unique(),
  roleNameRu: varchar("role_name_ru", { length: 50 }),
  description: text("description"),
  permissions: text("permissions").array(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertErpRoleSchema = createInsertSchema(erpRoles, {
  roleName: z.string().min(2, "Rol nomi kamida 2 ta belgidan iborat bo'lishi kerak"),
}).omit({ id: true, createdAt: true } as never);

export type ErpRole = typeof erpRoles.$inferSelect;
export type InsertErpRole = z.infer<typeof insertErpRoleSchema>;

// ========== DAILY REPORTS & COMPANY PLANS ==========

export const dailyReports = pgTable("daily_reports", {
  id: serial("id").primaryKey(),
  reportDate: varchar("report_date", { length: 10 }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'set null' }),
  shift: varchar("shift", { length: 20 }),
  workCenterId: varchar("work_center_id").references(() => workCenters.id, { onDelete: 'set null' }),
  productionOrderId: varchar("production_order_id").references(() => orders.id, { onDelete: 'set null' }),
  planQty: integer("plan_qty").notNull().default(0),
  factQty: integer("fact_qty").notNull().default(0),
  scrapQty: integer("scrap_qty").notNull().default(0),
  downtimeMinutes: integer("downtime_minutes").notNull().default(0),
  downtimeReasonCode: varchar("downtime_reason_code", { length: 50 }),
  comment: text("comment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
  deletedBy: varchar("deleted_by"),
});

export const insertDailyReportSchema = createInsertSchema(dailyReports, {
  reportDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  planQty: z.number().int().nonnegative("Reja miqdori 0 yoki katta bo'lishi kerak"),
  factQty: z.number().int().nonnegative("Fakt miqdori 0 yoki katta bo'lishi kerak"),
  scrapQty: z.number().int().nonnegative("Brak miqdori 0 yoki katta bo'lishi kerak"),
  downtimeMinutes: z.number().int().nonnegative("To'xtash vaqti 0 yoki katta bo'lishi kerak"),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);

export type DailyReport = typeof dailyReports.$inferSelect;
export type InsertDailyReport = z.infer<typeof insertDailyReportSchema>;

export const companyGoals = pgTable("company_goals", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  periodStart: varchar("period_start", { length: 10 }).notNull(),
  periodEnd: varchar("period_end", { length: 10 }).notNull(),
  responsibleDepartmentId: integer("responsible_department_id").references(() => departments.id, { onDelete: 'set null' }),
  targetValue: numericMoney("target_value"),
  kpiCode: varchar("kpi_code", { length: 50 }),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
  deletedBy: varchar("deleted_by"),
}, (t) => [
  check("company_goals_status_chk", sql`${t.status} IN ('active','completed','cancelled')`),
]);

export const insertCompanyGoalSchema = createInsertSchema(companyGoals, {
  title: z.string().min(3, "Maqsad nomi kamida 3 ta belgidan iborat bo'lishi kerak"),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  status: z.enum(["active", "completed", "cancelled"]),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);

export type CompanyGoal = typeof companyGoals.$inferSelect;
export type InsertCompanyGoal = z.infer<typeof insertCompanyGoalSchema>;

export const companyPlanItems = pgTable("company_plan_items", {
  id: serial("id").primaryKey(),
  goalId: varchar("goal_id").references(() => companyGoals.id, { onDelete: 'cascade' }),
  taskTitle: text("task_title").notNull(),
  responsibleUserId: integer("responsible_user_id").references(() => users.id, { onDelete: 'set null' }),
  responsibleDepartmentId: integer("responsible_department_id").references(() => departments.id, { onDelete: 'set null' }),
  dueDate: varchar("due_date", { length: 10 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("planned"),
  priority: varchar("priority", { length: 20 }).notNull().default("normal"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  check("company_plan_items_status_chk", sql`${t.status} IN ('planned','in_progress','completed','delayed')`),
  check("company_plan_items_priority_chk", sql`${t.priority} IN ('low','normal','high','urgent')`),
]);

export const insertCompanyPlanItemSchema = createInsertSchema(companyPlanItems, {
  taskTitle: z.string().min(3, "Vazifa nomi kamida 3 ta belgidan iborat bo'lishi kerak"),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  status: z.enum(["planned", "in_progress", "completed", "delayed"]),
  priority: z.enum(["low", "normal", "high", "urgent"]),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);

export type CompanyPlanItem = typeof companyPlanItems.$inferSelect;
export type InsertCompanyPlanItem = z.infer<typeof insertCompanyPlanItemSchema>;

// ========== ORGANIZATIONAL STRUCTURE ==========

export const orgDepartments = pgTable("org_departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameRu: text("name_ru"),
  description: text("description"),
  descriptionRu: text("description_ru"),
  color: varchar("color", { length: 20 }).notNull().default("#3b82f6"),
  displayOrder: integer("sort_order").notNull().default(0),
  headUserId: integer("head_user_id").references(() => users.id, { onDelete: 'set null' }),
  tskp: text("tskp"),
  tskpRu: text("tskp_ru"),
  parentId: integer("parent_id"),
  hierarchyLevel: integer("level").notNull().default(0),
  nodeType: varchar("node_type", { length: 50 }).notNull().default("department"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOrgDepartmentSchema = createInsertSchema(orgDepartments, {
  name: z.string().min(2, "Bo'lim nomi kamida 2 ta belgidan iborat bo'lishi kerak"),
  displayOrder: z.number().int().nonnegative(),
}).omit({ id: true, createdAt: true } as never);

export type OrgDepartment = typeof orgDepartments.$inferSelect;
export type InsertOrgDepartment = z.infer<typeof insertOrgDepartmentSchema>;

export const orgFunctions = pgTable("org_functions", {
  id: serial("id").primaryKey(),
  departmentId: integer("department_id").references(() => orgDepartments.id, { onDelete: "cascade" }).notNull(),
  subDepartmentName: text("sub_department_name"),
  subDepartmentNameRu: text("sub_department_name_ru"),
  positionName: text("position_name").notNull(),
  positionNameRu: text("position_name_ru"),
  functionDescription: text("function_description"),
  functionDescriptionRu: text("function_description_ru"),
  tskp: text("tskp"),
  tskpRu: text("tskp_ru"),
  tskpTarget: integer("tskp_target"),
  tskpMeasurementUnit: varchar("tskp_measurement_unit", { length: 50 }),
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOrgFunctionSchema = createInsertSchema(orgFunctions, {
  positionName: z.string().min(2, "Lavozim nomi kamida 2 ta belgidan iborat bo'lishi kerak"),
  displayOrder: z.number().int().nonnegative(),
}).omit({ id: true, createdAt: true } as never);

export type OrgFunction = typeof orgFunctions.$inferSelect;
export type InsertOrgFunction = z.infer<typeof insertOrgFunctionSchema>;

export const employeeFunctions = pgTable("employee_functions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  functionId: integer("function_id").references(() => orgFunctions.id, { onDelete: "cascade" }).notNull(),
  isPrimary: boolean("is_primary").notNull().default(false),
  workloadPercent: integer("workload_percent").notNull().default(100),
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const insertEmployeeFunctionSchema = createInsertSchema(employeeFunctions, {
  workloadPercent: z.number().int().min(1).max(100),
}).omit({ id: true, assignedAt: true } as never);

export type EmployeeFunction = typeof employeeFunctions.$inferSelect;
export type InsertEmployeeFunction = z.infer<typeof insertEmployeeFunctionSchema>;

export const employeeOrgDepartments = pgTable("employee_org_departments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  orgDepartmentId: integer("org_department_id").references(() => orgDepartments.id, { onDelete: "cascade" }).notNull(),
  isPrimary: boolean("is_primary").notNull().default(false),
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
});

export const insertEmployeeOrgDepartmentSchema = createInsertSchema(employeeOrgDepartments).omit({ id: true, assignedAt: true } as never);

export type EmployeeOrgDepartment = typeof employeeOrgDepartments.$inferSelect;
export type InsertEmployeeOrgDepartment = z.infer<typeof insertEmployeeOrgDepartmentSchema>;

export const companyTskp = pgTable("company_tskp", {
  id: serial("id").primaryKey(),
  tskp: text("tskp").notNull(),
  tskpRu: text("tskp_ru").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCompanyTskpSchema = createInsertSchema(companyTskp, {
  tskp: z.string().min(10, "ЦКП kamida 10 ta belgidan iborat bo'lishi kerak"),
  tskpRu: z.string().min(10, "ЦКП kamida 10 ta belgidan iborat bo'lishi kerak"),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);

export type CompanyTskp = typeof companyTskp.$inferSelect;
export type InsertCompanyTskp = z.infer<typeof insertCompanyTskpSchema>;

// ========== HR ALUMNI ==========
export const hrAlumni = pgTable("hr_alumni", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'set null' }),
  fullName: varchar("full_name", { length: 200 }).notNull(),
  lastPosition: varchar("last_position", { length: 200 }),
  departmentName: varchar("department_name", { length: 200 }),
  exitDate: varchar("exit_date", { length: 10 }),
  exitType: varchar("exit_type", { length: 50 }).default("resigned"),
  currentEmployer: varchar("current_employer", { length: 200 }),
  contactEmail: varchar("contact_email", { length: 200 }),
  isReturned: boolean("is_returned").default(false),
  collaborationProject: varchar("collaboration_project", { length: 300 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertHrAlumniSchema = createInsertSchema(hrAlumni).omit({ id: true, createdAt: true } as never);
export type HrAlumni = typeof hrAlumni.$inferSelect;
export type InsertHrAlumni = z.infer<typeof insertHrAlumniSchema>;

// ========== HR HEALTH CHECKUPS ==========
export const hrHealthCheckups = pgTable("hr_health_checkups", {
  id: serial("id").primaryKey(),
  departmentId: integer("department_id").references(() => departments.id, { onDelete: "set null" }),
  departmentName: varchar("department_name", { length: 200 }).notNull(),
  totalEmployees: integer("total_employees").default(0),
  examinedCount: integer("examined_count").default(0),
  lastCheckupDate: varchar("last_checkup_date", { length: 10 }),
  nextCheckupDate: varchar("next_checkup_date", { length: 10 }),
  status: varchar("status", { length: 50 }).default("scheduled"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertHrHealthCheckupSchema = createInsertSchema(hrHealthCheckups).omit({ id: true, updatedAt: true } as never);
export type HrHealthCheckup = typeof hrHealthCheckups.$inferSelect;
export type InsertHrHealthCheckup = z.infer<typeof insertHrHealthCheckupSchema>;

// ========== HR ONBOARDING/OFFBOARDING CHECKLISTS ==========
export const hrOnboardingChecklists = pgTable("hr_onboarding_checklists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: varchar("type", { length: 50 }).notNull().default("onboarding"),
  completedItems: integer("completed_items").default(0),
  totalItems: integer("total_items").default(12),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertHrOnboardingChecklistSchema = createInsertSchema(hrOnboardingChecklists).omit({ id: true, updatedAt: true } as never);
export type HrOnboardingChecklist = typeof hrOnboardingChecklists.$inferSelect;
export type InsertHrOnboardingChecklist = z.infer<typeof insertHrOnboardingChecklistSchema>;
