/**
 * @module core-users
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { numericMoney } from "../numeric-money";
import { sql } from "drizzle-orm";
import {
  pgTable, text, varchar, integer, boolean, timestamp, serial,
  type AnyPgColumn, index
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ─── USERS ────────────────────────────────────────────────────────────────────
// DB: serial integer PK — PRESERVED (safety rule: never change PK type)
export const users = pgTable("users", {
  // Existing DB columns (DO NOT CHANGE TYPES)
  id:             serial("id").primaryKey(),
  username:       varchar("username", { length: 50 }).notNull().unique(),
  email:          varchar("email", { length: 100 }).unique(),
  passwordHash:   varchar("password_hash", { length: 255 }).notNull(),
  firstName:      varchar("first_name", { length: 100 }).notNull(),
  lastName:       varchar("last_name", { length: 100 }).notNull(),
  middleName:     varchar("middle_name", { length: 100 }),
  positionId:     integer("position_id").references(() => positions.id, { onDelete: "set null" }),
  departmentId:   integer("department_id").references(() => departments.id, { onDelete: "set null" }),
  phone:          varchar("phone", { length: 20 }),
  avatarUrl:      text("avatar_url"),
  telegramChatId: varchar("telegram_chat_id", { length: 50 }),
  language:       varchar("language", { length: 5 }).default("uz"),
  isActive:       boolean("is_active").default(true).notNull(),
  lastLoginAt:          timestamp("last_login_at"),
  failedLoginAttempts:  integer("failed_login_attempts").default(0),
  lockUntil:            timestamp("locked_until"),
  createdAt:            timestamp("created_at").notNull().defaultNow(),
  updatedAt:            timestamp("updated_at").notNull().defaultNow(),

  // NEW columns added to support route expectations (push-force will ADD these)
  fullName:         text("full_name"),               // Routes use users.fullName
  employeeId:       varchar("employee_id", { length: 50 }).unique(),
  role:             varchar("role", { length: 20 }).notNull().default("employee"),
  status:           varchar("status", { length: 20 }).notNull().default("active"),
  profileImageUrl:  text("profile_image_url"),        // alias of avatar_url col for new routes
  managerId:        integer("manager_id").references((): AnyPgColumn => users.id, { onDelete: "set null" }),
  hierarchyLevel:   varchar("hierarchy_level", { length: 50 }),
  ckpCode:          varchar("ckp_code", { length: 50 }),
  rfidCard:         varchar("rfid_card", { length: 100 }).unique(),
  age:              integer("age"),
  gender:           varchar("gender", { length: 10 }),
  childrenCount:    integer("children_count").default(0),
  maritalStatus:    varchar("marital_status", { length: 20 }),
  childrenEducation: text("children_education"),
  householdSize:    integer("household_size"),
  householdMembers: text("household_members"),
  housingType:      varchar("housing_type", { length: 20 }),
  latitude:         numericMoney("latitude"),
  longitude:        numericMoney("longitude"),
  shift:            varchar("shift", { length: 20 }),
  district:         text("district"),
  salaryType:       varchar("salary_type", { length: 20 }),
  workshopZone:     varchar("workshop_zone", { length: 100 }),
  lang:             varchar("lang", { length: 5 }).default("uz"),
  birthDate:        varchar("birth_date", { length: 10 }),
  hireDate:         varchar("hire_date", { length: 10 }),
  address:          text("address"),
  attestationDate:  varchar("attestation_date", { length: 10 }),
  deletedAt:        timestamp("deleted_at"),
}, (t) => [
  index("idx_users_status").on(t.status),
  index("idx_users_department_id").on(t.departmentId),
  index("idx_users_role").on(t.role),
  index("idx_users_telegram_chat_id").on(t.telegramChatId),
]);

// ─── ADMINS ──────────────────────────────────────────────────────────────────
// DB: varchar UUID PK — PRESERVED
export const admins = pgTable("admins", {
  id:           varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username:     varchar("username", { length: 50 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt:    timestamp("created_at").notNull().defaultNow(),
});

// ─── DEPARTMENTS ─────────────────────────────────────────────────────────────
// DB: serial integer PK — PRESERVED
export const departments = pgTable("departments", {
  // Existing DB columns (DO NOT CHANGE TYPES)
  id:          serial("id").primaryKey(),
  code:        varchar("code", { length: 30 }).notNull(),
  nameUz:      varchar("name_uz", { length: 150 }).notNull(),
  nameRu:      varchar("name_ru", { length: 150 }),
  parentId:    integer("parent_id"),
  managerId:   integer("manager_id"),
  vysotskiyFunction: varchar("vysotskiy_function", { length: 50 }),
  level:       integer("level").default(1),
  sortOrder:   integer("sort_order").default(0),
  isActive:    boolean("is_active").default(true).notNull(),
  description: text("description"),
  createdAt:   timestamp("created_at").notNull().defaultNow(),
  updatedAt:   timestamp("updated_at").notNull().defaultNow(),

  // NEW columns for new schema (push-force will ADD these)
  name:              text("name"),              // Routes use departments.name
  nameEn:            text("name_en"),
  organizationNumber: varchar("organization_number", { length: 10 }),
  descriptionRu:     text("description_ru"),
  vep:               text("vep"),
  vepRu:             text("vep_ru"),
  statisticsType:    varchar("statistics_type", { length: 50 }),
  departmentCode:    varchar("department_code", { length: 20 }),
  icon:              varchar("icon", { length: 50 }),
  color:             varchar("color", { length: 20 }),
});

// ─── POSITIONS ───────────────────────────────────────────────────────────────
// DB: serial integer PK — PRESERVED
export const positions = pgTable("positions", {
  // Existing DB columns (DO NOT CHANGE TYPES)
  id:           serial("id").primaryKey(),
  code:         varchar("code", { length: 50 }).notNull(),
  nameUz:       varchar("name_uz", { length: 150 }).notNull(),
  nameRu:       varchar("name_ru", { length: 150 }),
  departmentId: integer("department_id").references(() => departments.id, { onDelete: "set null" }),
  level:        integer("level").default(1),
  rbacTier:     varchar("rbac_tier", { length: 20 }).default("standard"),
  isManagement: boolean("is_management").default(false),
  minSalary:    integer("min_salary"),
  maxSalary:    integer("max_salary"),
  headcount:    integer("headcount"),
  sortOrder:    integer("sort_order").default(0),
  isActive:     boolean("is_active").default(true).notNull(),
  description:  text("description"),
  createdAt:    timestamp("created_at").notNull().defaultNow(),
  updatedAt:    timestamp("updated_at").notNull().defaultNow(),

  // NEW columns for new schema (push-force will ADD these)
  name:               text("name"),               // Routes use positions.name
  nameEn:             text("name_en"),
  officialTitle:      text("official_title"),
  ckp:                text("ckp"),
  organizationNumber: varchar("organization_number", { length: 10 }),
  aiExamEnabled:      boolean("ai_exam_enabled").default(false),
  descriptionRu:      text("description_ru"),
  vep:                text("vep"),
  vepRu:              text("vep_ru"),
  statisticsType:     varchar("statistics_type", { length: 50 }),
  managerId:          integer("manager_id"),
});

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
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
}, (t) => [
  index("idx_notifications_user_id").on(t.userId),
  index("idx_notifications_read").on(t.read),
  index("idx_notifications_created_at").on(t.createdAt),
]);

// ─── Zod schemas & Types ─────────────────────────────────────────────────────
export const insertUserSchema         = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true } as never);
export const insertAdminSchema        = createInsertSchema(admins).omit({ id: true, createdAt: true } as never);
export const insertDepartmentSchema   = createInsertSchema(departments).omit({ id: true, createdAt: true, updatedAt: true } as never);
export const insertPositionSchema     = createInsertSchema(positions).omit({ id: true, createdAt: true, updatedAt: true } as never);
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true } as never);

export type User                = typeof users.$inferSelect;
export type InsertUser          = z.infer<typeof insertUserSchema>;
export type Admin               = typeof admins.$inferSelect;
export type InsertAdmin         = z.infer<typeof insertAdminSchema>;
export type Department          = typeof departments.$inferSelect;
export type InsertDepartment    = z.infer<typeof insertDepartmentSchema>;
export type Position            = typeof positions.$inferSelect;
export type InsertPosition      = z.infer<typeof insertPositionSchema>;
export type Notification        = typeof notifications.$inferSelect;
export type InsertNotification  = z.infer<typeof insertNotificationSchema>;
