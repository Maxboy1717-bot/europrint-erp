/**
 * @module hr-questionnaire
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, serial, check } from "drizzle-orm/pg-core";
import { positions } from "./core-schema";
import { vacancies, questionnaireTemplates } from "./recruitment";
import { employees } from "./employees";

// Re-exports from canonical modules (deduplication)
export { vacancies, candidates, interviews } from "./recruitment";

// Questionnaire + job template tables are canonical in recruitment.ts (circular-dep avoidance)
export { questionnaireTemplates, questionnaireQuestions, jobTemplates } from "./recruitment";

// ── certificates — canonical definition ────────────────────────────────────
export const certificates = pgTable("certificates", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  issuedBy: varchar("issued_by", { length: 255 }),
  issuedAt: timestamp("issued_at"),
  expiryDate: timestamp("expiry_date"),
  documentUrl: text("document_url"),
  certificateNumber: varchar("certificate_number", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});


// NOTE: questionnaireTemplates and questionnaireQuestions are canonical in recruitment.ts
// Re-exported above to avoid circular dependency (hr-questionnaire imports vacancies from recruitment)


// Questionnaire Responses (from new employees)
export const questionnaireResponses = pgTable("questionnaire_responses", {
  id: serial("id").primaryKey(),
  templateId: varchar("template_id").references(() => questionnaireTemplates.id, { onDelete: "set null" }), // Qaysi shablon orqali to'ldirilgan
  fullName: text("full_name").notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  telegramChatId: varchar("telegram_chat_id", { length: 50 }).notNull(),
  lang: varchar("lang", { length: 5 }).notNull().default("uz"),
  positionId: integer("position_id").references(() => positions.id, { onDelete: "set null" }), // Qaysi lavozimga murojaat qilgani
  vacancyId: varchar("vacancy_id").references(() => vacancies.id, { onDelete: "set null" }), // Qaysi vakansiya uchun (agar mavjud bo'lsa)
  responses: jsonb("responses").notNull(), // [{questionId, question, answer}]
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, approved, rejected, converted_to_candidate
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  check("questionnaire_responses_status_chk", sql`${t.status} IN ('pending','approved','rejected','converted_to_candidate')`),
  check("questionnaire_responses_lang_chk", sql`${t.lang} IN ('uz','ru','en')`),
]);


// NOTE: jobTemplates is canonical in recruitment.ts — re-exported above


