import { numericMoney } from "./numeric-money";
import { sql } from "drizzle-orm";
import { pgTable, varchar, text, integer, boolean, timestamp, jsonb, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users, approvalRequests } from "./core-schema";

// ============================================================================
// MULTI-LEVEL APPROVAL MATRIX
// ============================================================================

export const approvalMatrixConfig = pgTable("approval_matrix_config", {
  id: serial("id").primaryKey(),
  documentType: varchar("document_type", { length: 50 }).notNull(),
  minAmount: numericMoney("min_amount").notNull().default(0),
  maxAmount: numericMoney("max_amount"),
  approvalLevel: integer("approval_level").notNull().default(1),
  approverRole: varchar("approver_role", { length: 50 }).notNull(),
  approverId: varchar("approver_id").references(() => users.id),
  departmentId: varchar("department_id"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertApprovalMatrixConfigSchema = createInsertSchema(approvalMatrixConfig, {
  documentType: z.enum(["PURCHASE_ORDER", "EXPENSE_REQUEST", "PAYMENT", "MRO_REQUEST", "ADVANCE_PAYMENT", "BUDGET_TRANSFER"]),
}).omit({ id: true, createdAt: true } as never);

export type ApprovalMatrixConfig = typeof approvalMatrixConfig.$inferSelect;
export type InsertApprovalMatrixConfig = z.infer<typeof insertApprovalMatrixConfigSchema>;

export const multiLevelApprovalHistory = pgTable("multi_level_approval_history", {
  id: serial("id").primaryKey(),
  requestId: varchar("request_id").references(() => approvalRequests.id, { onDelete: "cascade" }).notNull(),
  level: integer("level").notNull(),
  action: varchar("action", { length: 20 }).notNull(),
  approverId: varchar("approver_id").references(() => users.id).notNull(),
  approverRole: varchar("approver_role", { length: 50 }),
  comments: text("comments"),
  actionAt: timestamp("action_at").notNull().defaultNow(),
});

export const insertMultiLevelApprovalHistorySchema = createInsertSchema(multiLevelApprovalHistory, {
  action: z.enum(["approved", "rejected", "returned", "escalated"]),
}).omit({ id: true } as never);

export type MultiLevelApprovalHistory = typeof multiLevelApprovalHistory.$inferSelect;
export type InsertMultiLevelApprovalHistory = z.infer<typeof insertMultiLevelApprovalHistorySchema>;

// ============================================================
// XAVFSIZLIK — MEHMONLAR (Visitors)
// ============================================================

export const visitors = pgTable("security_visitors", {
  id: serial("id").primaryKey(),
  fullName: varchar("full_name", { length: 200 }).notNull(),
  company: varchar("company", { length: 200 }).notNull().default(""),
  purpose: varchar("purpose", { length: 500 }).notNull(),
  hostEmployeeName: varchar("host_employee_name", { length: 200 }).notNull(),
  enteredAt: timestamp("entered_at").notNull().defaultNow(),
  exitedAt: timestamp("exited_at"),
  badgeNumber: varchar("badge_number", { length: 50 }),
  status: varchar("status", { length: 20 }).notNull().default("inside"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Visitor = typeof visitors.$inferSelect;

// ============================================================
// JOB QUEUE
// ============================================================

export const jobQueueItems = pgTable("job_queue_items", {
  id: serial("id").primaryKey(),
  queue: varchar("queue", { length: 100 }).notNull(),
  data: jsonb("data").notNull().$type<Record<string, unknown>>(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  priority: integer("priority").notNull().default(0),
  attempts: integer("attempts").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(3),
  result: jsonb("result").$type<Record<string, unknown>>(),
  error: text("error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at"),
  completedAt: timestamp("completed_at"),
});

export const insertJobQueueItemSchema = createInsertSchema(jobQueueItems).omit({ id: true, createdAt: true } as never);
export type JobQueueItem = typeof jobQueueItems.$inferSelect;
export type InsertJobQueueItem = z.infer<typeof insertJobQueueItemSchema>;

// ============================================================
// PPE Violations (Kamera AI)
// ============================================================

export const ppeViolations = pgTable("ppe_violations", {
  id: serial("id").primaryKey(),
  cameraId: varchar("camera_id", { length: 100 }).notNull(),
  cameraName: varchar("camera_name", { length: 200 }),
  location: varchar("location", { length: 200 }),
  employeeId: varchar("employee_id", { length: 100 }),
  employeeName: varchar("employee_name", { length: 200 }).default("Noma'lum xodim"),
  violationType: varchar("violation_type", { length: 50 }).notNull(),
  label: varchar("label", { length: 200 }),
  confidence: numericMoney("confidence").default(0.8),
  imageUrl: text("image_url"),
  status: varchar("status", { length: 20 }).notNull().default("new"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPpeViolationSchema = createInsertSchema(ppeViolations).omit({ id: true, createdAt: true } as never);
export type PpeViolation = typeof ppeViolations.$inferSelect;
export type InsertPpeViolation = z.infer<typeof insertPpeViolationSchema>;

// ============================================================
// System Error Logs (TZ-07)
// ============================================================

export const systemErrorLogs = pgTable("system_error_logs", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  path: varchar("path", { length: 500 }).notNull(),
  method: varchar("method", { length: 10 }).notNull().default("GET"),
  message: text("message").notNull(),
  statusCode: integer("status_code").notNull(),
  stack: text("stack"),
  userId: varchar("user_id", { length: 100 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSystemErrorLogSchema = createInsertSchema(systemErrorLogs).omit({ id: true, createdAt: true } as never);
export type SystemErrorLog = typeof systemErrorLogs.$inferSelect;
export type InsertSystemErrorLog = z.infer<typeof insertSystemErrorLogSchema>;

// ============================================================
// XAVFSIZLIK HODISALARI (Security Incidents)
// ============================================================

export const securityIncidents = pgTable("security_incidents", {
  id: serial("id").primaryKey(),
  tenantId: varchar("tenant_id", { length: 100 }).notNull().default("default"),
  type: varchar("type", { length: 50 }).notNull(),
  description: text("description").notNull(),
  severity: varchar("severity", { length: 20 }).notNull().default("medium"),
  location: varchar("location", { length: 200 }).notNull(),
  reportedBy: varchar("reported_by", { length: 200 }).notNull(),
  assignedTo: varchar("assigned_to", { length: 200 }),
  status: varchar("status", { length: 20 }).notNull().default("open"),
  resolvedBy: varchar("resolved_by", { length: 200 }),
  resolvedAt: timestamp("resolved_at"),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSecurityIncidentSchema = createInsertSchema(securityIncidents, {
  type: z.enum(["unauthorized_access", "ppe_violation", "fire_alarm", "gas_leak", "accident", "theft", "other"]),
  severity: z.enum(["high", "medium", "low"]).default("medium"),
  status: z.enum(["open", "investigating", "resolved", "closed"]).default("open"),
}).omit({ id: true, createdAt: true, updatedAt: true, tenantId: true } as never);

export type SecurityIncidentRow = typeof securityIncidents.$inferSelect;
export type InsertSecurityIncident = z.infer<typeof insertSecurityIncidentSchema>;

// ============================================================
// QOLDA PPE TEKSHIRUVI (Manual PPE Inspection)
// ============================================================

export const securityPpeChecks = pgTable("security_ppe_checks", {
  id: serial("id").primaryKey(),
  employeeName: varchar("employee_name", { length: 200 }).notNull(),
  department: varchar("department", { length: 100 }).notNull(),
  helmetOk: boolean("helmet_ok").notNull().default(true),
  vestOk: boolean("vest_ok").notNull().default(true),
  glovesOk: boolean("gloves_ok").notNull().default(true),
  bootsOk: boolean("boots_ok").notNull().default(true),
  notes: text("notes"),
  checkedBy: varchar("checked_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSecurityPpeCheckSchema = createInsertSchema(securityPpeChecks).omit({ id: true, createdAt: true } as never);
export type SecurityPpeCheck = typeof securityPpeChecks.$inferSelect;
export type InsertSecurityPpeCheck = z.infer<typeof insertSecurityPpeCheckSchema>;
