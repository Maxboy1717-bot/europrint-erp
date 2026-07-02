/**
 * @module core-ai-reports
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { numericMoney } from "../numeric-money";
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, serial, unique, check } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./core-users";

export const aiAlerts = pgTable("ai_alerts", {
  id: serial("id").primaryKey(),
  insightId: integer("insight_id"),
  reportId: integer("report_id"),
  alertType: varchar("alert_type", { length: 50 }),
  severity: varchar("severity", { length: 20 }).default("medium"),
  title: text("title").notNull(),
  titleRu: text("title_ru"),
  message: text("message"),
  messageRu: text("message_ru"),
  data: jsonb("data"),
  isRead: boolean("is_read").default(false),
  isResolved: boolean("is_resolved").default(false),
  resolvedById: varchar("resolved_by_id").references(() => users.id, { onDelete: "set null" }),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("ai_alerts_type_chk", sql`${t.alertType} IS NULL OR ${t.alertType} IN ('anomaly','threshold','prediction')`),
  check("ai_alerts_severity_chk", sql`${t.severity} IS NULL OR ${t.severity} IN ('low','medium','high','critical')`),
]);

export const insertAiAlertSchema = createInsertSchema(aiAlerts, {
  alertType: z.enum(["anomaly", "threshold", "prediction"]).optional(),
  severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  title: z.string().min(1),
}).omit({ id: true, createdAt: true } as never);

export type AiAlert = typeof aiAlerts.$inferSelect;
export type InsertAiAlert = z.infer<typeof insertAiAlertSchema>;

export const documentSequences = pgTable("document_sequences", {
  id: serial("id").primaryKey(),
  prefix: varchar("prefix", { length: 20 }).notNull(),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  lastNumber: integer("last_number").notNull().default(0),
  // Live DB superset (ADD-ONLY)
  documentType: varchar("document_type", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniquePrefixYearMonth: unique().on(table.prefix, table.year, table.month),
}));

export type DocumentSequence = typeof documentSequences.$inferSelect;

export const currencies = pgTable("currencies", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 3 }).notNull().unique(),
  name: text("name").notNull(),
  nameRu: text("name_ru"),
  symbol: varchar("symbol", { length: 5 }).notNull(),
  isBaseCurrency: boolean("is_base_currency").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  decimalPlaces: integer("decimal_places").notNull().default(2),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Currency = typeof currencies.$inferSelect;

export const approvalRequests = pgTable("approval_requests", {
  id: serial("id").primaryKey(),
  documentType: varchar("document_type", { length: 50 }).notNull(),
  documentId: varchar("document_id", { length: 100 }).notNull(),
  documentNumber: varchar("document_number", { length: 100 }),
  amount: numericMoney("amount").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("UZS"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  requestedBy: varchar("requested_by").references(() => users.id, { onDelete: "set null" }),
  requestedAt: timestamp("requested_at").notNull().defaultNow(),
  approverUserId: varchar("approver_user_id").references(() => users.id, { onDelete: "set null" }),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
  notes: text("notes"),
  // Live DB superset (ADD-ONLY)
  approvedBy: varchar("approved_by").references(() => users.id, { onDelete: "set null" }),
  rejectedBy: varchar("rejected_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type ApprovalRequest = typeof approvalRequests.$inferSelect;

export const insertCurrencySchema = createInsertSchema(currencies).omit({ id: true, createdAt: true } as never);
export type InsertCurrency = z.infer<typeof insertCurrencySchema>;

export const insertApprovalRequestSchema = createInsertSchema(approvalRequests).omit({ id: true, requestedAt: true } as never);
export type InsertApprovalRequest = z.infer<typeof insertApprovalRequestSchema>;
