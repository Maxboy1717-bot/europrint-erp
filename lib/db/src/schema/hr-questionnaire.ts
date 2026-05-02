import { numericMoney } from "./numeric-money";
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, serial, unique, uuid, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { Admin, Position, admins, departments, positions, users } from "./core-schema";
import { cameraZones, cameras } from "./iot-schema";
import { Mentor, courses, progress, skills } from "./lms-schema";
import { workCenters } from "./pp-schema";


// Questionnaire Templates (Anketa shablonlari - lavozimlar uchun)
export const questionnaireTemplates = pgTable("questionnaire_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameRu: text("name_ru").notNull(),
  description: text("description"),
  descriptionRu: text("description_ru"),
  positionId: integer("position_id").references(() => positions.id), // Qaysi lavozim uchun (null = umumiy)
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


// Questionnaire Questions (for new employee onboarding)
export const questionnaireQuestions = pgTable("questionnaire_questions", {
  id: serial("id").primaryKey(),
  templateId: varchar("template_id").references(() => questionnaireTemplates.id, { onDelete: "cascade" }), // Qaysi shablonga tegishli
  question: text("question").notNull(),
  questionRu: text("question_ru").notNull(),
  questionType: varchar("question_type", { length: 20 }).notNull().default("text"), // text, multiple_choice, yes_no
  options: jsonb("options"), // For multiple choice: ["Variant 1", "Variant 2"]
  order: integer("order").notNull(),
  isRequired: boolean("is_required").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});


// Questionnaire Responses (from new employees)
export const questionnaireResponses = pgTable("questionnaire_responses", {
  id: serial("id").primaryKey(),
  templateId: varchar("template_id").references(() => questionnaireTemplates.id), // Qaysi shablon orqali to'ldirilgan
  fullName: text("full_name").notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  telegramChatId: varchar("telegram_chat_id", { length: 50 }).notNull(),
  lang: varchar("lang", { length: 5 }).notNull().default("uz"),
  positionId: integer("position_id").references(() => positions.id), // Qaysi lavozimga murojaat qilgani
  vacancyId: varchar("vacancy_id").references(() => vacancies.id), // Qaysi vakansiya uchun (agar mavjud bo'lsa)
  responses: jsonb("responses").notNull(), // [{questionId, question, answer}]
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, approved, rejected, converted_to_candidate
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});


// Job Templates (Vakansiya shablonlari - lavozimlar uchun)
export const jobTemplates = pgTable("job_templates", {
  id: serial("id").primaryKey(),
  positionId: varchar("position_id").notNull().references(() => positions.id, { onDelete: 'set null' }),
  templateName: text("template_name").notNull(),
  templateNameRu: text("template_name_ru").notNull(),
  description: text("description"),
  descriptionRu: text("description_ru"),
  
  // Detallashtirilgan talablar (default qiymatlar)
  experienceYears: integer("experience_years"),
  experienceYearsRu: text("experience_years_ru"),
  educationLevel: text("education_level"),
  educationLevelRu: text("education_level_ru"),
  technicalSkills: text("technical_skills").array(),
  technicalSkillsRu: text("technical_skills_ru").array(),
  softSkills: text("soft_skills").array(),
  softSkillsRu: text("soft_skills_ru").array(),
  languageRequirements: jsonb("language_requirements"),
  certifications: text("certifications"),
  certificationsRu: text("certifications_ru"),
  otherRequirements: text("other_requirements"),
  otherRequirementsRu: text("other_requirements_ru"),
  
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
  deletedBy: varchar("deleted_by"),
});


// Vacancies (Rekruter bo'limi - ochiq lavozimlar)
export const vacancies = pgTable("vacancies", {
  id: serial("id").primaryKey(),
  positionId: integer("position_id").references(() => positions.id, { onDelete: 'set null' }),
  title: text("title").notNull(),
  titleRu: text("title_ru"),
  description: text("description"),
  descriptionRu: text("description_ru"),
  departmentId: integer("department_id").references(() => departments.id, { onDelete: 'set null' }),
  
  // Detallashtirilgan talablar
  experienceYears: integer("experience_years"), // Tajriba (yillar)
  experienceYearsRu: text("experience_years_ru"), // Tajriba matni (RU)
  educationLevel: text("education_level"), // Ta'lim darajasi (uz)
  educationLevelRu: text("education_level_ru"), // Ta'lim darajasi (ru)
  technicalSkills: text("technical_skills").array(), // Texnik ko'nikmalar massiv
  technicalSkillsRu: text("technical_skills_ru").array(), // Texnik ko'nikmalar (RU)
  softSkills: text("soft_skills").array(), // Soft skills massiv
  softSkillsRu: text("soft_skills_ru").array(), // Soft skills (RU)
  languageRequirements: jsonb("language_requirements"), // [{language: "English", level: "B2"}]
  certifications: text("certifications"), // Sertifikatlar (uz)
  certificationsRu: text("certifications_ru"), // Sertifikatlar (ru)
  otherRequirements: text("other_requirements"), // Boshqa talablar (uz)
  otherRequirementsRu: text("other_requirements_ru"), // Boshqa talablar (ru)
  
  // Eski maydonlar (backward compatibility uchun)
  requirements: text("requirements"), // Talablar
  requirementsRu: text("requirements_ru"),
  
  openPositions: integer("open_positions").notNull().default(1), // Ochiq o'rinlar soni
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, closed, on_hold
  createdAt: timestamp("created_at").notNull().defaultNow(),
  closedAt: timestamp("closed_at"),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
  deletedAt: timestamp("deleted_at"),
  deletedBy: varchar("deleted_by"),
});


// Candidates (Nomzodlar)
export const candidates = pgTable("candidates", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 100 }),
  telegramChatId: varchar("telegram_chat_id", { length: 50 }), // Telegram chat ID
  departmentId: integer("department_id").references(() => departments.id), // Qaysi bo'limga murojaat qilgani
  positionId: integer("position_id").references(() => positions.id), // Qaysi lavozimga murojaat qilgani
  vacancyId: varchar("vacancy_id").references(() => vacancies.id), // Agar konkret vakansiya bo'lsa
  questionnaireResponseId: varchar("questionnaire_response_id").references(() => questionnaireResponses.id),
  resumeUrl: text("resume_url"), // CV fayl URL
  source: varchar("source", { length: 50 }), // hh.uz, telegram, referral, questionnaire
  status: varchar("status", { length: 20 }).notNull().default("new"), // new, screening, interview, offer, hired, rejected
  notes: text("notes"), // Izohlar
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
  deletedBy: varchar("deleted_by"),
});


// Interviews (Intervyular)
export const interviews = pgTable("interviews", {
  id: serial("id").primaryKey(),
  candidateId: varchar("candidate_id").notNull().references(() => candidates.id, { onDelete: "cascade" }),
  vacancyId: varchar("vacancy_id").references(() => vacancies.id),
  scheduledDate: varchar("scheduled_date", { length: 10 }).notNull(), // YYYY-MM-DD
  scheduledTime: varchar("scheduled_time", { length: 5 }).notNull(), // HH:MM
  interviewerIds: jsonb("interviewer_ids").notNull(), // [userId1, userId2] - Intervyu oluvchilar
  type: varchar("type", { length: 20 }).notNull().default("phone"), // phone, video, in_person
  status: varchar("status", { length: 20 }).notNull().default("scheduled"), // scheduled, completed, cancelled, rescheduled
  notes: text("notes"), // Intervyu natijalari
  rating: integer("rating"), // 1-10 baho
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
  deletedAt: timestamp("deleted_at"),
  deletedBy: varchar("deleted_by"),
});


// Certificates (for course completion)
export const certificates = pgTable("certificates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseId: varchar("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  certificateNumber: varchar("certificate_number", { length: 50 }).notNull().unique(),
  score: integer("score"), // Final score for the course
  bonusAmount: numericMoney("bonus_amount").default(0), // Bonus amount for salary (in currency units)
  issuedAt: timestamp("issued_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"), // Optional expiration date
});


// Employee Passports