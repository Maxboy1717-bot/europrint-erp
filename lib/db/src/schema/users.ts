/**
 * @module users
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { pgTable, serial, varchar, integer, boolean, timestamp, text, index, check, numeric, date } from "drizzle-orm/pg-core";
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
  // Convergence additions (live-DB superset)
  fullName: text("full_name"),
  employeeId: integer("employee_id"),
  role: varchar("role", { length: 50 }).default("employee"),
  status: varchar("status", { length: 20 }).default("active"),
  profileImageUrl: text("profile_image_url"),
  managerId: integer("manager_id"),
  hierarchyLevel: integer("hierarchy_level"),
  ckpCode: varchar("ckp_code", { length: 100 }),
  rfidCard: varchar("rfid_card", { length: 100 }),
  age: integer("age"),
  gender: varchar("gender", { length: 20 }),
  childrenCount: integer("children_count"),
  maritalStatus: varchar("marital_status", { length: 30 }),
  childrenEducation: text("children_education"),
  householdSize: integer("household_size"),
  householdMembers: text("household_members"),
  housingType: varchar("housing_type", { length: 50 }),
  latitude: numeric("latitude"),
  longitude: numeric("longitude"),
  shift: varchar("shift", { length: 50 }),
  district: varchar("district", { length: 100 }),
  salaryType: varchar("salary_type", { length: 50 }),
  workshopZone: varchar("workshop_zone", { length: 50 }),
  lang: varchar("lang", { length: 5 }),
  birthDate: date("birth_date"),
  hireDate: date("hire_date"),
  address: text("address"),
  attestationDate: date("attestation_date"),
  deletedAt: timestamp("deleted_at"),
  failedLoginAttempts: integer("failed_login_attempts").default(0),
  lockedUntil: timestamp("locked_until"),
  telegramId: varchar("telegram_id", { length: 50 }),
  orgDepartmentId: integer("org_department_id"),
  orgFunctionId: integer("org_function_id"),
  department: varchar("department", { length: 100 }),
  // KARTA-MARKAZ (IJRO-REJA T1/A1): birlamchi karta to'g'ridan link (org_departments.id).
  // card_id NULL => login/oylik YO'Q (admin/super_admin/director istisno). FK DB-darajada migration'da.
  cardId: integer("card_id"),
}, (t) => [
  index("idx_users_position_id").on(t.positionId),
  index("idx_users_department_id").on(t.departmentId),
  index("idx_users_is_active").on(t.isActive),
  index("idx_users_card_id").on(t.cardId),
  check("users_language_chk", sql`${t.language} IS NULL OR ${t.language} IN ('uz','ru','en')`),
]);

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true } as never);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
