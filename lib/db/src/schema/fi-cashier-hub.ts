/**
 * @module fi-cashier-hub
 * @description Cashier-hub KAS-1 — factory cashier shift + cash movements (Drizzle ORM schema).
 * The single cashier hub: a cashier opens a shift, records every cash movement (cash_in /
 * cash_out / salary_payout / advance / expense), and closes the shift with an X/Z reconciliation.
 * Each movement posts a real GL journal through the canonical `entries` ledger (gl_entry_id stored).
 *
 * NOTE: This is the FACTORY cashier hub — distinct from the retail `cash_registers` / `cash_sessions`
 * tables in fi-kassa.ts (POS register flow). DDL is GATED — see the migration SQL alongside.
 */

import { numericMoney } from "./numeric-money";
import { sql } from "drizzle-orm";
import { pgTable, integer, varchar, text, boolean, timestamp, serial, index, check } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./core-schema";

/**
 * Cashier shifts (Kassir smenalari) — one OPEN shift per cashier at a time.
 * status: open | closed
 * expectedAmount = openedAmount + Σ(cash_in) − Σ(cash_out) (computed on close).
 */
export const cashierShifts = pgTable("cashier_shifts", {
  id: serial("id").primaryKey(),
  cashierUserId: integer("cashier_user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  openedAt: timestamp("opened_at").notNull().defaultNow(),
  openedAmount: numericMoney("opened_amount").notNull().default(0),
  closedAt: timestamp("closed_at"),
  closedAmount: numericMoney("closed_amount"),
  expectedAmount: numericMoney("expected_amount"),
  variance: numericMoney("variance"), // closedAmount − expectedAmount
  status: varchar("status", { length: 10 }).notNull().default("open"), // open | closed
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  check("cashier_shifts_status_chk", sql`${t.status} IN ('open','closed')`),
  index("idx_cashier_shifts_cashier_user_id").on(t.cashierUserId),
  index("idx_cashier_shifts_status").on(t.status),
]);

export const insertCashierShiftSchema = createInsertSchema(cashierShifts, {
  cashierUserId: z.number().int().positive(),
  openedAmount: z.number().nonnegative(),
  status: z.enum(["open", "closed"]).default("open"),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);

export type CashierShift = typeof cashierShifts.$inferSelect;
export type InsertCashierShift = z.infer<typeof insertCashierShiftSchema>;

/**
 * Cashier movements (Kassir harakatlari) — every cash in/out posted to the canonical GL.
 * type: cash_in | cash_out | salary_payout | advance | expense
 * gl_entry_id = the `entries.id` returned by GlPostingService (real GL journal, never an echo).
 * pin_verified = whether a 4-digit cashier PIN was successfully verified (owner #8).
 * reference = idempotency key (unique) — a re-fired movement with the same reference is a no-op.
 */
export const cashierMovements = pgTable("cashier_movements", {
  id: serial("id").primaryKey(),
  shiftId: integer("shift_id").notNull().references(() => cashierShifts.id, { onDelete: "restrict" }),
  type: varchar("type", { length: 20 }).notNull(), // cash_in | cash_out | salary_payout | advance | expense
  amount: numericMoney("amount").notNull(),
  reference: varchar("reference", { length: 120 }).notNull().unique(),
  glEntryId: integer("gl_entry_id"), // entries.id (canonical GL ledger)
  description: text("description"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  pinVerified: boolean("pin_verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("cashier_movements_type_chk", sql`${t.type} IN ('cash_in','cash_out','salary_payout','advance','expense')`),
  check("cashier_movements_amount_chk", sql`${t.amount} > 0`),
  index("idx_cashier_movements_shift_id").on(t.shiftId),
  index("idx_cashier_movements_type").on(t.type),
]);

export const insertCashierMovementSchema = createInsertSchema(cashierMovements, {
  shiftId: z.number().int().positive(),
  type: z.enum(["cash_in", "cash_out", "salary_payout", "advance", "expense"]),
  amount: z.number().positive(),
  reference: z.string().min(1).max(120),
}).omit({ id: true, createdAt: true } as never);

export type CashierMovement = typeof cashierMovements.$inferSelect;
export type InsertCashierMovement = z.infer<typeof insertCashierMovementSchema>;
