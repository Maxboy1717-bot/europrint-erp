import { numericMoney } from "./numeric-money";
import { sql } from "drizzle-orm";
import { serial, pgTable, text, varchar, integer, boolean, timestamp, jsonb, unique, uuid, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./core-schema";
import { crmCompanies } from "./crm-schema";
import { glDocuments } from "./fi-schema";
import { Module } from "./lms-schema";
import { Order, Product, orders, productionOrders, products } from "./pp-schema";
import { salesOrders, salesInvoices, salesOrderItems, orderStatusLogs } from "./sd-core";
import { quotations } from "./sd-delivery";

export const insertQuotationSchema = createInsertSchema(quotations, {
  quotationNumber: z.string().regex(/^QT-\d{10}$/, "Format: QT-XXXXXXXXXX"),
  customerName: z.string().min(1, "Mijoz nomi talab qilinadi"),
  quotationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  validUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  status: z.enum(["draft", "sent", "accepted", "rejected", "expired", "converted"]),
  netValue: z.coerce.number().nonnegative(),
  taxAmount: z.coerce.number().nonnegative(),
  totalValue: z.coerce.number().nonnegative(),
}).omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true } as never);


export type Quotation = typeof quotations.$inferSelect;

export type InsertQuotation = z.infer<typeof insertQuotationSchema>;
// ========== CRM & SALES: CREDIT MANAGEMENT ==========

export const customerCreditLimits = pgTable("customer_credit_limits", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => crmCompanies.id).unique(),
  creditLimit: numericMoney("credit_limit").notNull(),
  temporaryCreditLimit: numericMoney("temporary_credit_limit"),
  temporaryLimitValidUntil: varchar("temporary_limit_valid_until", { length: 10 }),
  currentBalance: numericMoney("current_balance").default(0),
  availableCredit: numericMoney("available_credit").notNull(),
  paymentTermsDays: integer("payment_terms_days").default(30),
  riskRating: varchar("risk_rating", { length: 20 }).default("medium"),
  blockedForCredit: boolean("blocked_for_credit").default(false),
  blockReason: text("block_reason"),
  lastReviewDate: varchar("last_review_date", { length: 10 }),
  nextReviewDate: varchar("next_review_date", { length: 10 }),
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});


export const insertCustomerCreditLimitSchema = createInsertSchema(customerCreditLimits, {
  creditLimit: z.number().positive("Kredit limiti musbat bo'lishi kerak"),
  availableCredit: z.number().nonnegative("Mavjud kredit 0 yoki katta"),
  riskRating: z.enum(["low", "medium", "high"]).default("medium"),
}).omit({ id: true, updatedAt: true } as never);

export type CustomerCreditLimit = typeof customerCreditLimits.$inferSelect;


export const creditCheckLogs = pgTable("credit_check_logs", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => crmCompanies.id),
  salesOrderId: varchar("sales_order_id").references(() => salesOrders.id),
  orderAmount: numericMoney("order_amount").notNull(),
  currentBalance: numericMoney("current_balance"),
  creditLimit: numericMoney("credit_limit"),
  checkResult: varchar("check_result", { length: 20 }).notNull(),
  rejectionReason: text("rejection_reason"),
  checkedAt: timestamp("checked_at").defaultNow(),
});


export type CreditCheckLog = typeof creditCheckLogs.$inferSelect;


// ========== CRM & SALES: SALES TARGETS ==========

export const salesTargets = pgTable("sales_targets", {
  id: serial("id").primaryKey(),
  targetType: varchar("target_type", { length: 20 }).notNull(),
  userId: integer("user_id").references(() => users.id),
  teamId: varchar("team_id"),
  year: integer("year").notNull(),
  month: integer("month"),
  quarter: integer("quarter"),
  revenueTarget: numericMoney("revenue_target"),
  orderCountTarget: integer("order_count_target"),
  newCustomerTarget: integer("new_customer_target"),
  productTargets: jsonb("product_targets"),
  actualRevenue: numericMoney("actual_revenue").default(0),
  actualOrderCount: integer("actual_order_count").default(0),
  actualNewCustomers: integer("actual_new_customers").default(0),
  revenueAchievement: numericMoney("revenue_achievement").default(0),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});


export const insertSalesTargetSchema = createInsertSchema(salesTargets, {
  targetType: z.enum(["individual", "team", "company"]),
  year: z.number().int().min(2020).max(2030),
  month: z.number().int().min(1).max(12).optional(),
  quarter: z.number().int().min(1).max(4).optional(),
  revenueTarget: z.number().nonnegative().optional(),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);

export type SalesTarget = typeof salesTargets.$inferSelect;


export const dailyTargetTracking = pgTable("daily_target_tracking", {
  id: serial("id").primaryKey(),
  salesTargetId: varchar("sales_target_id").references(() => salesTargets.id),
  date: varchar("date", { length: 10 }).notNull(),
  dailyRevenue: numericMoney("daily_revenue").default(0),
  dailyOrderCount: integer("daily_order_count").default(0),
  dailyNewCustomers: integer("daily_new_customers").default(0),
  cumulativeRevenue: numericMoney("cumulative_revenue").default(0),
  cumulativeOrderCount: integer("cumulative_order_count").default(0),
  calculatedAt: timestamp("calculated_at").defaultNow(),
});


export type DailyTargetTracking = typeof dailyTargetTracking.$inferSelect;


// ========== CRM & SALES: COMMISSION ==========

export const commissionRules = pgTable("commission_rules", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  applicableTo: varchar("applicable_to", { length: 50 }).default("all"),
  userIds: jsonb("user_ids"),
  teamIds: jsonb("team_ids"),
  basisType: varchar("basis_type", { length: 50 }).notNull(),
  tiers: jsonb("tiers"),
  targetAchievementBonus: jsonb("target_achievement_bonus"),
  productMultipliers: jsonb("product_multipliers"),
  paymentFrequency: varchar("payment_frequency", { length: 20 }).default("monthly"),
  isActive: boolean("is_active").default(true),
  validFrom: varchar("valid_from", { length: 10 }).notNull(),
  validTo: varchar("valid_to", { length: 10 }),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});


export const insertCommissionRuleSchema = createInsertSchema(commissionRules, {
  name: z.string().min(1, "Nomi kerak"),
  basisType: z.enum(["revenue", "profit", "order_count", "new_customers"]),
  applicableTo: z.enum(["all", "specific_users", "specific_teams"]).default("all"),
  validFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD"),
}).omit({ id: true, createdAt: true } as never);

export type CommissionRule = typeof commissionRules.$inferSelect;


export const commissionCalculations = pgTable("commission_calculations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  year: integer("year").notNull(),
  month: integer("month"),
  quarter: integer("quarter"),
  basisAmount: numericMoney("basis_amount").notNull(),
  baseCommission: numericMoney("base_commission").notNull(),
  bonuses: numericMoney("bonuses").default(0),
  adjustments: numericMoney("adjustments").default(0),
  totalCommission: numericMoney("total_commission").notNull(),
  commissionDetails: jsonb("commission_details"),
  status: varchar("status", { length: 20 }).default("calculated"),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  paidAt: timestamp("paid_at"),
  calculatedAt: timestamp("calculated_at").defaultNow(),
  calculatedBy: varchar("calculated_by").references(() => users.id),
});


export type CommissionCalculation = typeof commissionCalculations.$inferSelect;


export const orderCommissions = pgTable("order_commissions", {
  id: serial("id").primaryKey(),
  salesOrderId: varchar("sales_order_id").references(() => salesOrders.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  orderAmount: numericMoney("order_amount").notNull(),
  commissionRate: numericMoney("commission_rate").notNull(),
  commissionAmount: numericMoney("commission_amount").notNull(),
  calculationId: varchar("calculation_id").references(() => commissionCalculations.id),
  calculatedAt: timestamp("calculated_at").defaultNow(),
});


export type OrderCommission = typeof orderCommissions.$inferSelect;


// ========== CRM & SALES: FORECASTING ==========

export const salesForecasts = pgTable("sales_forecasts", {
  id: serial("id").primaryKey(),
  forecastPeriod: varchar("forecast_period", { length: 20 }).notNull(),
  forecastedRevenue: numericMoney("forecasted_revenue").notNull(),
  forecastedOrderCount: integer("forecasted_order_count"),
  forecastedNewCustomers: integer("forecasted_new_customers"),
  confidenceLevel: numericMoney("confidence_level"),
  forecastMethod: varchar("forecast_method", { length: 50 }).notNull(),
  pipelineTotal: numericMoney("pipeline_total"),
  weightedPipeline: numericMoney("weighted_pipeline"),
  actualRevenue: numericMoney("actual_revenue"),
  actualOrderCount: integer("actual_order_count"),
  accuracy: numericMoney("accuracy"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});


export type SalesForecast = typeof salesForecasts.$inferSelect;

