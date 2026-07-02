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
import { pgTable, integer, varchar, text, boolean, timestamp, serial, index, check, jsonb } from "drizzle-orm/pg-core";
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
  /** Optional per-shift daily cash ceiling (UZS). NULL = no limit; the X/Z ledger warns when drawer > limit. */
  dailyCashLimit: numericMoney("daily_cash_limit"),
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

// ===========================================================================
// CASHIER-HUB KAS-2 — salary-payout approval gate (FEATURE A)
// ===========================================================================
/**
 * Salary-payout approval chain (Ish haqi to'lovi tasdiq zanjiri) — a `salary_payout`
 * cashier movement MUST reference a COMPLETED chain here before the cashier pays it out
 * with a 4-digit PIN. The chain has 4 ordered stages, each carrying its own approver +
 * timestamp; `status` is the aggregate state.
 *
 *   ai_checked → hr_approved → finance_approved → director_approved
 *
 * status: pending | ai_checked | hr_approved | finance_approved | approved | rejected
 *   - 'approved' = director_approved set = chain fully complete → cashier may pay out.
 *   - any rejection sets status='rejected' (chain dead; no payout).
 * reference = idempotency / linkage key (unique) — the cashier movement's reference is
 * derived from this so the payout is one-to-one with one approved chain (no forge).
 */
export const salaryPayoutApprovals = pgTable("salary_payout_approvals", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  amount: numericMoney("amount").notNull(),
  reference: varchar("reference", { length: 120 }).notNull().unique(),
  // Aggregate chain state.
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  // Stage 1 — AI check (CKP/quality gate, owner E1 — AI proposes, human confirms downstream).
  aiCheckedBy: integer("ai_checked_by").references(() => users.id, { onDelete: "set null" }),
  aiCheckedAt: timestamp("ai_checked_at"),
  // Stage 2 — HR approval.
  hrApprovedBy: integer("hr_approved_by").references(() => users.id, { onDelete: "set null" }),
  hrApprovedAt: timestamp("hr_approved_at"),
  // Stage 3 — Finance approval.
  financeApprovedBy: integer("finance_approved_by").references(() => users.id, { onDelete: "set null" }),
  financeApprovedAt: timestamp("finance_approved_at"),
  // Stage 4 — Director approval (final).
  directorApprovedBy: integer("director_approved_by").references(() => users.id, { onDelete: "set null" }),
  directorApprovedAt: timestamp("director_approved_at"),
  rejectedBy: integer("rejected_by").references(() => users.id, { onDelete: "set null" }),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
  // Set once the cashier actually pays this approved chain (links to cashier_movements.id).
  paidMovementId: integer("paid_movement_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  check(
    "salary_payout_approvals_status_chk",
    sql`${t.status} IN ('pending','ai_checked','hr_approved','finance_approved','approved','rejected')`,
  ),
  check("salary_payout_approvals_amount_chk", sql`${t.amount} > 0`),
  index("idx_salary_payout_approvals_employee_id").on(t.employeeId),
  index("idx_salary_payout_approvals_status").on(t.status),
]);

export const insertSalaryPayoutApprovalSchema = createInsertSchema(salaryPayoutApprovals, {
  employeeId: z.number().int().positive(),
  amount: z.number().positive(),
  reference: z.string().min(1).max(120),
  status: z.enum(["pending", "ai_checked", "hr_approved", "finance_approved", "approved", "rejected"]).default("pending"),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);

export type SalaryPayoutApproval = typeof salaryPayoutApprovals.$inferSelect;
export type InsertSalaryPayoutApproval = z.infer<typeof insertSalaryPayoutApprovalSchema>;

// ===========================================================================
// CASHIER-HUB podotchet (advance / debt cycle) — FEATURE B
// ===========================================================================
/**
 * Employee debt (Xodim qarzi / "har som hisobli") — created when cash is advanced to an
 * employee (cash-out type=advance). Stays OPEN on the employee's profile until cleared by
 * an approved advance report (receipt). Employee profile debt = SUM(open employee_debt.amount).
 *
 * status: open | cleared
 * reference = idempotency key (unique) — re-firing the same advance is a no-op (no double debt).
 */
export const employeeDebt = pgTable("employee_debt", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  amount: numericMoney("amount").notNull(),
  reason: text("reason"),
  status: varchar("status", { length: 10 }).notNull().default("open"), // open | cleared
  reference: varchar("reference", { length: 120 }).notNull().unique(),
  movementId: integer("movement_id"), // the cashier_movements.id that opened this debt
  /** Expense category (finance_categories.id, categoryType=expense) — DB-level FK ON DELETE SET NULL
   *  (podotchet-ocr-categories-2026-07-02.sql). NULL = no category chosen. GL posting stays on the
   *  cashier-hub account (category→BHMS account mapping = EGASI-DATA); the category splits data only. */
  categoryId: integer("category_id"),
  clearedAt: timestamp("cleared_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("employee_debt_status_chk", sql`${t.status} IN ('open','cleared')`),
  check("employee_debt_amount_chk", sql`${t.amount} > 0`),
  index("idx_employee_debt_employee_id").on(t.employeeId),
  index("idx_employee_debt_status").on(t.status),
]);

export const insertEmployeeDebtSchema = createInsertSchema(employeeDebt, {
  employeeId: z.number().int().positive(),
  amount: z.number().positive(),
  reference: z.string().min(1).max(120),
  status: z.enum(["open", "cleared"]).default("open"),
}).omit({ id: true, createdAt: true } as never);

export type EmployeeDebt = typeof employeeDebt.$inferSelect;
export type InsertEmployeeDebt = z.infer<typeof insertEmployeeDebtSchema>;

/**
 * Advance report (Avans hisoboti) — the employee submits a receipt to account for an advance.
 * When approved (by cashier/finance), it CLEARS the matching open employee_debt row (status=cleared).
 * approved=false rows are pending human confirmation (owner E1 — AI/employee submits, human approves).
 */
export const advanceReports = pgTable("advance_reports", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  debtId: integer("debt_id").notNull().references(() => employeeDebt.id, { onDelete: "restrict" }),
  amount: numericMoney("amount").notNull(),
  receiptRef: varchar("receipt_ref", { length: 200 }),
  /** Storage key of the uploaded receipt image/PDF (served at /api/storage/<key>) — uploaded via
   *  the EXISTING /api/storage/upload endpoint (no new upload infra). Optional. */
  receiptFilePath: text("receipt_file_path"),
  /** AI-OCR extraction result ({amount,currency,note,provider,model}); NULL = AI unavailable /
   *  could not read — the flow NEVER blocks on this (human approval is final, owner E1). */
  ocrExtracted: jsonb("ocr_extracted"),
  /** AI-extracted amount == reported amount; NULL when the AI produced no numeric amount. */
  ocrMatch: boolean("ocr_match"),
  approved: boolean("approved").notNull().default(false),
  approvedBy: integer("approved_by").references(() => users.id, { onDelete: "set null" }),
  approvedAt: timestamp("approved_at"),
  reference: varchar("reference", { length: 120 }).notNull().unique(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("advance_reports_amount_chk", sql`${t.amount} > 0`),
  index("idx_advance_reports_employee_id").on(t.employeeId),
  index("idx_advance_reports_debt_id").on(t.debtId),
]);

export const insertAdvanceReportSchema = createInsertSchema(advanceReports, {
  employeeId: z.number().int().positive(),
  debtId: z.number().int().positive(),
  amount: z.number().positive(),
  reference: z.string().min(1).max(120),
}).omit({ id: true, createdAt: true } as never);

export type AdvanceReport = typeof advanceReports.$inferSelect;
export type InsertAdvanceReport = z.infer<typeof insertAdvanceReportSchema>;
