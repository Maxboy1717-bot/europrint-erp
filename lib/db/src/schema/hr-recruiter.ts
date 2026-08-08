/**
 * HR Recruiter — HR CAPITAL "Усилитель мощности владельца" metodologiyasi asosida
 * 7 qadam: Portret → Qadoqlash → Oqim → Tez qayta ishlash → Baholash → Kiritish → Kuchaytirish
 * Tool Test: A-J 10 ta shaxsiyat ko'rsatkichi (-100 dan +100 gacha)
 * Nomzod kategoriyalari: FLAGMAN | PROTSESSNIK | TRABLDAYKER
 */

import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  jsonb,
  serial,
  uuid,
  index,
  check,
  pgEnum,
  date,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { departments, positions, users } from "./core-schema";
import { vacancies, candidates } from "./hr-questionnaire";

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────────────────────

export const recruitmentFunnelStageEnum = pgEnum("recruitment_funnel_stage", [
  "NEW",                   // Yangi nomzod
  "QUESTIONNAIRE_SENT",    // Anketa yuborildi (yon-bosqich, asosiy yo'lda emas)
  "PHONE_SCREENING",       // Telefon suhbati
  "INTERVIEW_SCHEDULED",   // Intervyu rejalashtirildi
  "INTERVIEWED",           // Intervyu o'tkazildi
  "TEST_SENT",             // Tool Test yuborildi
  "TEST_ANALYSIS",         // Test natijalari tahlili
  "REFERENCES_CHECK",      // Navedenie spravok
  "PROBATION",             // Sinov muddati boshlandi
  "OFFER_SENT",            // Ish taklifi yuborildi
  "HIRED",                 // Qabul qilindi
  "REJECTED",              // Rad etildi
]);

export const productivityCategoryEnum = pgEnum("productivity_category", [
  "FLAGMAN",       // Natijaga yo'naltirilgan, mustaqil ishlaydi
  "PROTSESSNIK",   // Jarayonga yo'naltirilgan, ko'rsatma kerak
  "TRABLDAYKER",   // Na natija, na jarayon (muammo keltirib chiqaruvchi)
  "UNKNOWN",       // Hali baholanmagan
]);

export const candidateSourceEnum = pgEnum("candidate_source", [
  "HH_UZ",        // hh.uz
  "OLX_UZ",       // OLX.uz
  "TELEGRAM",     // Telegram kanal/bot
  "INSTAGRAM",    // Instagram
  "FACEBOOK",     // Facebook
  "LINKEDIN",     // LinkedIn
  "REFERRAL",     // Tavsiya (ichki)
  "PRINT",        // Gazeta/jurnal
  "WEBSITE",      // Kompaniya sayti
  "OTHER",        // Boshqa
]);

export const vacancyStatusEnum = pgEnum("vacancy_status_enum", [
  "DRAFT",    // Qoralama
  "ACTIVE",   // Faol (nomzodlar qabul qilinmoqda)
  "PAUSED",   // To'xtatildi
  "CLOSED",   // Yopildi (yig'ildi yoki bekor qilindi)
]);

// ─────────────────────────────────────────────────────────────────────────────
// 1. VACANCY PORTRAIT — HR CAPITAL: Nomzod portreti (7 qadam, 1-qadam)
// ─────────────────────────────────────────────────────────────────────────────

export const hrVacancyProfiles = pgTable("hr_vacancy_profiles", {
  id: serial("id").primaryKey(),
  vacancyId: integer("vacancy_id").notNull().references(() => vacancies.id, { onDelete: "cascade" }),

  // Nomzod portreti (HR CAPITAL Material #45)
  candidatePortrait: jsonb("candidate_portrait").$type<{
    preferredCategory: "FLAGMAN" | "PROTSESSNIK" | "ANY";
    ageFrom?: number;
    ageTo?: number;
    genderPreference?: "MALE" | "FEMALE" | "ANY";
    educationRequired?: string;        // "oliy", "o'rta maxsus", "farqi yo'q"
    experienceYearsMin?: number;
    languageRequirements?: string[];   // ["uz", "ru", "en"]
    personalityTraits?: string[];      // ["tashabbuskor", "mas'uliyatli"]
    dealbreakers?: string[];           // Qabul qilinmaydigan xususiyatlar
  }>(),

  // Tool Test minimal talablari (HR CAPITAL Material #15, #20, #25, #35)
  requiredToolTest: jsonb("required_tool_test").$type<{
    A?: { min?: number; max?: number }; // Внимание (Diqqat)
    B?: { min?: number; max?: number }; // Стратегия (Strategiya)
    C?: { min?: number; max?: number }; // Контроль (Nazorat)
    D?: { min?: number; max?: number }; // Уверенность (Ishonch)
    E?: { min?: number; max?: number }; // Энергия (Energiya)
    F?: { min?: number; max?: number }; // Решительность (Qat'iyat)
    G?: { min?: number; max?: number }; // Оборона (Himoya)
    H?: { min?: number; max?: number }; // Тактика (Taktika)
    I?: { min?: number; max?: number }; // Эмпатия (Empatiya)
    J?: { min?: number; max?: number }; // Общение (Muloqot)
  }>(),

  // Ideal profil (pozitsiyaga qarab oldindan sozlangan)
  idealProfile: jsonb("ideal_profile").$type<{
    positionKey: string;   // 'SALES_MANAGER', 'ACCOUNTANT', 'HR_MANAGER' va h.k.
    notes?: string;
  }>(),

  // Lavozim tavsifi (Material #55 uchun asos)
  jobDescription: text("job_description"),
  jobDescriptionRu: text("job_description_ru"),
  keyResponsibilities: text("key_responsibilities").array(),
  kpiMetrics: jsonb("kpi_metrics").$type<Array<{
    name: string;
    target: string;
    unit: string;
  }>>(),

  // Ish sharoiti (HR CAPITAL: "qadoqlash" - 2-qadam)
  salaryFrom: integer("salary_from"),
  salaryTo: integer("salary_to"),
  bonusSystem: text("bonus_system"),
  workSchedule: varchar("work_schedule", { length: 50 }), // "5/2", "6/1", "smenali"
  workLocation: varchar("work_location", { length: 30 }), // "ofis", "uzoqdan", "gibrid"
  probationDays: integer("probation_days").default(90),
  probationStart: date("probation_start"),
  probationEnd: date("probation_end"),
  channels: jsonb("channels").$type<Array<string | Record<string, unknown>>>(),
  perks: text("perks").array(), // ["ovqat", "transport", "sog'liqni saqlash"]

  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. RECRUITMENT FUNNEL — HR CAPITAL: 7 qadam funnel
// ─────────────────────────────────────────────────────────────────────────────

export const hrCandidateFunnels = pgTable("hr_candidate_funnels", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").notNull().references(() => candidates.id, { onDelete: "cascade" }),
  vacancyId: integer("vacancy_id").references(() => vacancies.id, { onDelete: "set null" }),

  // Joriy funnel bosqichi
  funnelStage: recruitmentFunnelStageEnum("funnel_stage").notNull().default("NEW"),

  // Nomzod kategoriyasi (produktivlik bahosi)
  productivityCategory: productivityCategoryEnum("productivity_category").notNull().default("UNKNOWN"),

  // Manba (HR CAPITAL Material #50)
  source: candidateSourceEnum("source").default("OTHER"),
  sourceDetails: text("source_details"), // Masalan: "Telegram @europrint_jobs kanali"
  referredById: integer("referred_by_id").references(() => users.id, { onDelete: "set null" }), // Tavsiya qilgan xodim

  // Tezkor qayta ishlash ma'lumotlari (4-qadam)
  initialScreeningNotes: text("initial_screening_notes"),
  screeningScore: integer("screening_score"), // 1-10 (tez baholash)
  isQuickRejected: boolean("is_quick_rejected").notNull().default(false),
  quickRejectionReason: text("quick_rejection_reason"),

  // Umumiy holat
  isActive: boolean("is_active").notNull().default(true),
  rejectionReason: text("rejection_reason"),
  hiredAt: timestamp("hired_at"),
  rejectedAt: timestamp("rejected_at"),

  // Mas'ul rekruter
  assignedRecruiterId: integer("assigned_recruiter_id").references(() => users.id, { onDelete: "set null" }),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  // Convergence additions (live-DB superset)
  checklistData: jsonb("checklist_data"),
  stage: varchar("stage", { length: 50 }),
  notes: text("notes"),
  movedAt: timestamp("moved_at"),
  funnelId: integer("funnel_id"),
  metadata: jsonb("metadata"),
}, (t) => ({
  candidateIdx: index("hr_candidate_funnels_candidate_idx").on(t.candidateId),
  stageIdx: index("hr_candidate_funnels_stage_idx").on(t.funnelStage),
  recruiterIdx: index("hr_candidate_funnels_recruiter_idx").on(t.assignedRecruiterId),
}));

// ─────────────────────────────────────────────────────────────────────────────
// 3. TOOL TEST — HR CAPITAL: A-J 10 ta shaxsiyat ko'rsatkichi
//    (Material #15, #20, #25, #35)
// ─────────────────────────────────────────────────────────────────────────────

export const hrToolTestResults = pgTable("hr_tool_test_results", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").notNull().references(() => candidates.id, { onDelete: "cascade" }),
  vacancyId: integer("vacancy_id").references(() => vacancies.id, { onDelete: "set null" }),
  funnelId: integer("funnel_id").references(() => hrCandidateFunnels.id, { onDelete: "set null" }),

  // 10 ta shaxsiyat ko'rsatkichi (-100 dan +100 gacha)
  pointA: integer("point_a"), // Внимание  — Diqqat
  pointB: integer("point_b"), // Стратегия — Strategiya
  pointC: integer("point_c"), // Контроль  — Nazorat
  pointD: integer("point_d"), // Уверенность — Ishonch
  pointE: integer("point_e"), // Энергия   — Energiya
  pointF: integer("point_f"), // Решительность — Qat'iyat
  pointG: integer("point_g"), // Оборона   — Himoya
  pointH: integer("point_h"), // Тактика   — Taktika
  pointI: integer("point_i"), // Эмпатия   — Empatiya
  pointJ: integer("point_j"), // Общение   — Muloqot

  // Kompulsiv nuqtalar (ikkala tomonga kuchli moyillik)
  compulsivePoints: text("compulsive_points").array(), // ['B', 'E'] — kompulsiv nuqtalar

  // Umumiy baho
  totalScore: integer("total_score"), // Barcha nuqtalar yig'indisi
  categoryResult: productivityCategoryEnum("category_result").default("UNKNOWN"),

  // Lavozimga moslik (%)
  positionMatchScore: integer("position_match_score"), // 0-100 (ideal profilga nisbatan)
  positionMatchNotes: text("position_match_notes"),

  // Tekshirish ma'lumotlari
  testedById: integer("tested_by_id").references(() => users.id, { onDelete: "set null" }), // Tekshiruvchi
  testDate: timestamp("test_date").notNull().defaultNow(),
  isValid: boolean("is_valid").notNull().default(true),
  invalidReason: text("invalid_reason"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. JOB DESCRIPTIONS — HR CAPITAL: Должностные инструкции (Session 5)
// ─────────────────────────────────────────────────────────────────────────────

export const hrJobDescriptions = pgTable("hr_job_descriptions", {
  id: serial("id").primaryKey(),
  positionId: integer("position_id").notNull().references(() => positions.id, { onDelete: "cascade" }),
  version: integer("version").notNull().default(1),
  isCurrentVersion: boolean("is_current_version").notNull().default(true),

  // Asosiy ma'lumot
  title: varchar("title", { length: 200 }).notNull(),
  titleRu: varchar("title_ru", { length: 200 }),
  department: varchar("department", { length: 100 }),
  reportsTo: varchar("reports_to", { length: 200 }),
  supervises: text("supervises").array(),

  // Lavozim maqsadi (1-2 jumlada)
  positionPurpose: text("position_purpose").notNull(),
  positionPurposeRu: text("position_purpose_ru"),

  // Asosiy vazifalar
  keyResponsibilities: jsonb("key_responsibilities").$type<Array<{
    responsibility: string;
    responsibilityRu?: string;
    timePercent?: number; // Vaqtning qancha foizi
  }>>(),

  // KPI va o'lchov mezonlari
  kpiMetrics: jsonb("kpi_metrics").$type<Array<{
    name: string;
    nameRu?: string;
    target: string;
    measurementPeriod: "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY";
    unit: string;
  }>>(),

  // Talablar
  requirements: jsonb("requirements").$type<{
    education: string;
    experience: string;
    technicalSkills: string[];
    softSkills: string[];
    languages: string[];
    certifications?: string[];
  }>(),

  // Ideal Tool Test profili ushbu lavozim uchun
  idealToolTestProfile: jsonb("ideal_tool_test_profile").$type<{
    A?: { min?: number; max?: number; description?: string };
    B?: { min?: number; max?: number; description?: string };
    C?: { min?: number; max?: number; description?: string };
    D?: { min?: number; max?: number; description?: string };
    E?: { min?: number; max?: number; description?: string };
    F?: { min?: number; max?: number; description?: string };
    G?: { min?: number; max?: number; description?: string };
    H?: { min?: number; max?: number; description?: string };
    I?: { min?: number; max?: number; description?: string };
    J?: { min?: number; max?: number; description?: string };
  }>(),

  // Mukofot tizimi
  compensationStructure: jsonb("compensation_structure").$type<{
    baseSalaryMin?: number;
    baseSalaryMax?: number;
    bonusType?: "FIXED" | "PERCENTAGE" | "KPI_BASED";
    bonusDescription?: string;
  }>(),

  approvedById: integer("approved_by_id").references(() => users.id, { onDelete: "set null" }),
  approvedAt: timestamp("approved_at"),
  createdById: integer("created_by_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  // Convergence additions (live-DB superset)
  content: text("content"),
  isActive: boolean("is_active").default(true),
  orgFunctionId: integer("org_function_id"),
}, (t) => ({
  positionVersionIdx: index("hr_job_desc_position_version_idx").on(t.positionId, t.version),
}));

// ─────────────────────────────────────────────────────────────────────────────
// 8. HR WEEKLY STATISTICS — Rekruter haftalik statistikasi (Session 4 o'yinlari)
// ─────────────────────────────────────────────────────────────────────────────

export const hrWeeklyStatistics = pgTable("hr_weekly_statistics", {
  id: serial("id").primaryKey(),
  recruiterId: integer("recruiter_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  weekStart: timestamp("week_start").notNull(),  // Dushanba
  weekEnd: timestamp("week_end").notNull(),      // Yakshanba

  // Funnel statistikasi (HR CAPITAL gamification)
  newCandidates: integer("new_candidates").notNull().default(0),
  questionnairesSent: integer("questionnaires_sent").notNull().default(0),
  phoneScreeningsDone: integer("phone_screenings_done").notNull().default(0),
  testsSent: integer("tests_sent").notNull().default(0),
  interviewsScheduled: integer("interviews_scheduled").notNull().default(0),
  interviewsConducted: integer("interviews_conducted").notNull().default(0),
  offersSent: integer("offers_sent").notNull().default(0),
  hired: integer("hired").notNull().default(0),
  rejected: integer("rejected").notNull().default(0),

  // Kanal statistikasi
  sourceBreakdown: jsonb("source_breakdown").$type<Record<string, number>>(),
  // { "HH_UZ": 12, "TELEGRAM": 8, "REFERRAL": 3 }

  // Sifat ko'rsatkichlari
  flagmanCount: integer("flagman_count").notNull().default(0),
  processnikCount: integer("processnik_count").notNull().default(0),
  unproductiveCount: integer("unproductive_count").notNull().default(0),

  // Rekruter KPI (HR CAPITAL gamification uchun)
  kpiScore: integer("kpi_score"),  // 0-100 haftalik ball
  bonusEarned: integer("bonus_earned"), // Qo'shimcha mukofot (UZS)

  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  recruiterWeekIdx: index("hr_weekly_stats_recruiter_week_idx").on(t.recruiterId, t.weekStart),
}));

// ─────────────────────────────────────────────────────────────────────────────
// 9. REFERENCES CHECK — Oldingi ish joylari tekshiruvi (REFERENCES_CHECK bosqichi)
// ─────────────────────────────────────────────────────────────────────────────

export const hrReferencesChecks = pgTable("hr_references_checks", {
  id: serial("id").primaryKey(),
  funnelId: integer("funnel_id").notNull().references(() => hrCandidateFunnels.id, { onDelete: "cascade" }),
  candidateId: integer("candidate_id").notNull().references(() => candidates.id, { onDelete: "cascade" }),

  // Oldingi ish joyi ma'lumotlari
  previousCompany: varchar("previous_company", { length: 200 }).notNull(),
  contactPerson: varchar("contact_person", { length: 200 }).notNull(),
  contactPhone: varchar("contact_phone", { length: 50 }),
  contactPosition: varchar("contact_position", { length: 200 }),

  // Muloqot natijasi
  result: text("result"),                                    // Qo'ng'iroq natijasi
  wouldRehire: boolean("would_rehire"),                      // Qayta yollashga tayyormi?
  notes: text("notes"),                                      // Qo'shimcha izoh

  // Baholash
  rating: integer("rating"),                                 // 1-10

  checkedById: integer("checked_by_id").references(() => users.id, { onDelete: "set null" }),
  checkedAt: timestamp("checked_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  funnelIdx: index("hr_references_checks_funnel_idx").on(t.funnelId),
  candidateIdx: index("hr_references_checks_candidate_idx").on(t.candidateId),
}));

// ─────────────────────────────────────────────────────────────────────────────
// 10. JOB OFFERS — Ish taklifi (OFFER_SENT → HIRED bosqichi)
// ─────────────────────────────────────────────────────────────────────────────

export const jobOfferStatusEnum = pgEnum("job_offer_status", [
  "DRAFT",     // Qoralama
  "SENT",      // Yuborildi
  "ACCEPTED",  // Qabul qilindi
  "DECLINED",  // Rad etildi
  "EXPIRED",   // Muddati o'tdi
]);

export const hrJobOffers = pgTable("hr_job_offers", {
  id: serial("id").primaryKey(),
  vacancyId: integer("vacancy_id").references(() => vacancies.id, { onDelete: "set null" }),
  candidateId: integer("candidate_id").notNull().references(() => candidates.id, { onDelete: "cascade" }),
  funnelId: integer("funnel_id").references(() => hrCandidateFunnels.id, { onDelete: "set null" }),

  // Lavozim ma'lumotlari
  position: varchar("position", { length: 200 }).notNull(),
  department: varchar("department", { length: 200 }),

  // Ish shartlari
  startDate: timestamp("start_date"),
  probationMonths: integer("probation_months").default(3),
  salaryProbation: integer("salary_probation"),              // Sinov muddatidagi maosh (UZS)
  salaryAfter: integer("salary_after"),                      // Sinov muddatidan keyin maosh (UZS)
  workSchedule: varchar("work_schedule", { length: 50 }),   // "5/2", "6/1", "remote"
  additionalBenefits: text("additional_benefits"),

  // Taklif holati
  status: jobOfferStatusEnum("status").notNull().default("DRAFT"),
  offerExpiresAt: timestamp("offer_expires_at"),             // Taklifning amal qilish muddati
  sentAt: timestamp("sent_at"),
  respondedAt: timestamp("responded_at"),
  declineReason: text("decline_reason"),

  createdById: integer("created_by_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  candidateIdx: index("hr_job_offers_candidate_idx").on(t.candidateId),
  funnelIdx: index("hr_job_offers_funnel_idx").on(t.funnelId),
  statusIdx: index("hr_job_offers_status_idx").on(t.status),
}));

// ─────────────────────────────────────────────────────────────────────────────
// ZOD SCHEMAS — Validation
// ─────────────────────────────────────────────────────────────────────────────

export const insertHrCandidateFunnelSchema = createInsertSchema(hrCandidateFunnels);
export const selectHrCandidateFunnelSchema = createSelectSchema(hrCandidateFunnels);

export const insertHrToolTestResultSchema = createInsertSchema(hrToolTestResults, {
  pointA: z.number().min(-100).max(100).optional(),
  pointB: z.number().min(-100).max(100).optional(),
  pointC: z.number().min(-100).max(100).optional(),
  pointD: z.number().min(-100).max(100).optional(),
  pointE: z.number().min(-100).max(100).optional(),
  pointF: z.number().min(-100).max(100).optional(),
  pointG: z.number().min(-100).max(100).optional(),
  pointH: z.number().min(-100).max(100).optional(),
  pointI: z.number().min(-100).max(100).optional(),
  pointJ: z.number().min(-100).max(100).optional(),
});

export const insertHrJobDescriptionSchema = createInsertSchema(hrJobDescriptions);

// Type exports
export type HrCandidateFunnel = typeof hrCandidateFunnels.$inferSelect;
export type InsertHrCandidateFunnel = typeof hrCandidateFunnels.$inferInsert;
export type HrToolTestResult = typeof hrToolTestResults.$inferSelect;
export type InsertHrToolTestResult = typeof hrToolTestResults.$inferInsert;
export type HrJobDescription = typeof hrJobDescriptions.$inferSelect;
export type HrWeeklyStatistic = typeof hrWeeklyStatistics.$inferSelect;
export type HrVacancyProfile = typeof hrVacancyProfiles.$inferSelect;
export type FunnelStage = typeof recruitmentFunnelStageEnum.enumValues[number];
export type ProductivityCategory = typeof productivityCategoryEnum.enumValues[number];
export type CandidateSource = typeof candidateSourceEnum.enumValues[number];
export type JobOfferStatus = typeof jobOfferStatusEnum.enumValues[number];
export type HrReferencesCheck = typeof hrReferencesChecks.$inferSelect;
export type InsertHrReferencesCheck = typeof hrReferencesChecks.$inferInsert;
export type HrJobOffer = typeof hrJobOffers.$inferSelect;
export type InsertHrJobOffer = typeof hrJobOffers.$inferInsert;
