/**
 * @module safety
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { pgTable, serial, integer, timestamp, varchar, boolean, text, decimal, date, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { employees } from "./employees";

// ORFAN CLEANUP (2026-07-02): safetyIncidents/ppeCompliance pgTables removed —
// dead lib/db duplicates, Q-29 verified: never imported via @workspace/db
// anywhere in apps/. Canonical live snake_case stubs are
// apps/api/src/shared/db/schema-business-c-2-hr-safety.ts.

export const safetyTrainings = pgTable("safety_trainings", {
  id: serial("id").primaryKey(),
  trainingTitle: varchar("training_title", { length: 200 }),
  trainingType: varchar("training_type", { length: 50 }),
  description: text("description"),
  departmentId: integer("department_id"),
  isMandatory: boolean("is_mandatory").default(false),
  validityPeriodDays: integer("validity_period_days"),
  maxParticipants: integer("max_participants"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ORFAN CLEANUP (2026-07-02): safetyTrainingRecords/hazardZones pgTables removed —
// dead lib/db duplicates, Q-29 verified: never imported via @workspace/db
// anywhere in apps/. Canonical live snake_case stubs are
// apps/api/src/shared/db/schema-business-c-2-hr-safety.ts.

export const insertSafetyTrainingSchema = createInsertSchema(safetyTrainings).omit({ id: true, createdAt: true } as never);
export type InsertSafetyTraining = z.infer<typeof insertSafetyTrainingSchema>;
export type SafetyTraining = typeof safetyTrainings.$inferSelect;
