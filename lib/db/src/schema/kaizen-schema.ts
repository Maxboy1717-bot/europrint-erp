import { pgTable, serial, integer, varchar, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./core-schema";

// ============================================================================
// KAIZEN MODULE — Doimiy takomillashtirish (Bo'lim 22)
// ============================================================================

export const kaizenSuggestions = pgTable("kaizen_suggestions", {
  id: serial("id").primaryKey(),
  employeeId: varchar("employee_id").references(() => users.id).notNull(),
  departmentId: integer("department_id"),
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description").notNull(),
  expectedImpact: text("expected_impact"),
  status: varchar("status", { length: 30 }).notNull().default("submitted"),
  approvedBy: varchar("approved_by").references(() => users.id),
  implementedAt: timestamp("implemented_at"),
  resultMeasured: text("result_measured"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertKaizenSuggestionSchema = createInsertSchema(kaizenSuggestions, {
  title: z.string().min(3, "Sarlavha kamida 3 belgi bo'lishi kerak"),
  description: z.string().min(10, "Tavsif kamida 10 belgi bo'lishi kerak"),
  expectedImpact: z.string().optional().nullable(),
  status: z.enum(["submitted", "review", "approved", "rejected", "implementing", "completed"]).optional(),
}).omit({ id: true, createdAt: true, updatedAt: true, approvedBy: true, implementedAt: true, resultMeasured: true } as never);

export type KaizenSuggestion = typeof kaizenSuggestions.$inferSelect;
export type InsertKaizenSuggestion = z.infer<typeof insertKaizenSuggestionSchema>;

export const KAIZEN_STATUSES = ["submitted", "review", "approved", "rejected", "implementing", "completed"] as const;
export type KaizenStatus = typeof KAIZEN_STATUSES[number];
