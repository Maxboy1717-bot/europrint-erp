/**
 * @module ai-providers-schema
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { sql } from "drizzle-orm";
import { serial, pgTable, varchar, text, integer, boolean, timestamp, jsonb, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./core-schema";

// ============================================================
// AI PROVIDERS VA HR AI TIZIMI
// ============================================================

export const aiProvidersConfig = pgTable("ai_providers_config", {
  id: serial("id").primaryKey(),
  providerName: varchar("provider_name", { length: 50 }).notNull().unique(),
  isActive: boolean("is_active").default(true),
  monthlyBudget: numeric("monthly_budget", { precision: 10, scale: 2 }).default("100"),
  monthlySpent: numeric("monthly_spent", { precision: 10, scale: 2 }).default("0"),
  dailyRequestLimit: integer("daily_request_limit").default(1000),
  dailyRequestsUsed: integer("daily_requests_used").default(0),
  rateLimitPerMinute: integer("rate_limit_per_minute").default(60),
  config: jsonb("config"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const aiInterviews = pgTable("ai_interviews", {
  id: serial("id").primaryKey(),
  candidateId: varchar("candidate_id").references(() => users.id, { onDelete: "set null" }),
  jobId: varchar("job_id"),
  sessionId: varchar("session_id", { length: 100 }).unique().notNull(),
  provider: varchar("provider", { length: 50 }).default("gemini"),
  transcript: jsonb("transcript"),
  audioRecordingUrl: text("audio_recording_url"),
  videoRecordingUrl: text("video_recording_url"),
  evaluation: jsonb("evaluation"),
  language: varchar("language", { length: 10 }).default("uz"),
  durationSeconds: integer("duration_seconds"),
  status: varchar("status", { length: 20 }).default("scheduled"),
  scheduledAt: timestamp("scheduled_at"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const aiInterviewQuestions = pgTable("ai_interview_questions", {
  id: serial("id").primaryKey(),
  interviewId: varchar("interview_id").references(() => aiInterviews.id, { onDelete: "cascade" }),
  questionOrder: integer("question_order"),
  questionText: text("question_text").notNull(),
  questionType: varchar("question_type", { length: 50 }),
  expectedDurationSeconds: integer("expected_duration_seconds").default(60),
  responseText: text("response_text"),
  responseAudioUrl: text("response_audio_url"),
  responseTimestamp: timestamp("response_timestamp"),
  score: integer("score"),
  strengths: text("strengths").array(),
  weaknesses: text("weaknesses").array(),
  aiFeedback: text("ai_feedback"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const aiUsageLogs = pgTable("ai_usage_logs", {
  id: serial("id").primaryKey(),
  provider: varchar("provider", { length: 50 }).notNull(),
  taskType: varchar("task_type", { length: 100 }),
  model: varchar("model", { length: 100 }),
  inputTokens: integer("input_tokens").default(0),
  outputTokens: integer("output_tokens").default(0),
  totalTokens: integer("total_tokens").default(0),
  estimatedCost: numeric("estimated_cost", { precision: 10, scale: 6 }).default("0"),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  sessionId: varchar("session_id", { length: 100 }),
  requestSummary: text("request_summary"),
  responseSummary: text("response_summary"),
  latencyMs: integer("latency_ms"),
  status: varchar("status", { length: 20 }).default("success"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const aiTasksQueue = pgTable("ai_tasks_queue", {
  id: serial("id").primaryKey(),
  taskType: varchar("task_type", { length: 100 }).notNull(),
  provider: varchar("provider", { length: 50 }).notNull(),
  priority: integer("priority").default(5),
  payload: jsonb("payload").notNull(),
  result: jsonb("result"),
  status: varchar("status", { length: 20 }).default("pending"),
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0),
  maxRetries: integer("max_retries").default(3),
  createdAt: timestamp("created_at").defaultNow(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  nextRetryAt: timestamp("next_retry_at"),
});

export const insertAiProvidersConfigSchema = createInsertSchema(aiProvidersConfig).omit({ id: true, createdAt: true, updatedAt: true } as never);
export const insertAiInterviewSchema = createInsertSchema(aiInterviews).omit({ id: true, createdAt: true, updatedAt: true } as never);
export const insertAiInterviewQuestionSchema = createInsertSchema(aiInterviewQuestions).omit({ id: true, createdAt: true } as never);
export const insertAiUsageLogSchema = createInsertSchema(aiUsageLogs).omit({ id: true, createdAt: true } as never);
export const insertAiTasksQueueSchema = createInsertSchema(aiTasksQueue).omit({ id: true, createdAt: true } as never);

export type AiProvidersConfig = typeof aiProvidersConfig.$inferSelect;
export type InsertAiProvidersConfig = z.infer<typeof insertAiProvidersConfigSchema>;
export type AiInterview = typeof aiInterviews.$inferSelect;
export type InsertAiInterview = z.infer<typeof insertAiInterviewSchema>;
export type AiInterviewQuestion = typeof aiInterviewQuestions.$inferSelect;
export type InsertAiInterviewQuestion = z.infer<typeof insertAiInterviewQuestionSchema>;
export type AiUsageLog = typeof aiUsageLogs.$inferSelect;
export type InsertAiUsageLog = z.infer<typeof insertAiUsageLogSchema>;
export type AiTaskQueue = typeof aiTasksQueue.$inferSelect;
export type InsertAiTaskQueue = z.infer<typeof insertAiTasksQueueSchema>;
