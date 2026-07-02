/**
 * @module crm-deal-products
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { numericMoney } from "./numeric-money";
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, serial, numeric, unique, date, uuid, check } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./core-schema";
import { Assignment } from "./lms-schema";
import { Design, Order, Product, designOrders } from "./pp-schema";
// NOTE (2026-07-02): crmDeals is live/canonical (see ./crm-pipelines.ts note).
// Import narrowed to only what's actually used here after orphan cleanup —
// crmContacts/crmCompanies/crmLeads/crmPipelines/crmStages were unused in
// this file and crmCompanies/crmPipelines/crmStages were deleted (dead).
import { crmDeals } from "./crm-pipelines";

export const crmProductCategories = pgTable("crm_product_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameRu: text("name_ru"),
  sort: integer("sort").default(500),
  active: boolean("active").default(true),
  deletedAt: timestamp("deleted_at"),
});


export const insertCrmProductCategorySchema = createInsertSchema(crmProductCategories, {
  name: z.string().min(1, "Kategoriya nomi kerak"),
}).omit({ id: true } as never);


export type CrmProductCategory = typeof crmProductCategories.$inferSelect;

export type InsertCrmProductCategory = z.infer<typeof insertCrmProductCategorySchema>;


// CRM Products (Mahsulotlar - b_crm_product)
export const crmProducts = pgTable("crm_products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameRu: text("name_ru"),
  categoryId: integer("category_id").references(() => crmProductCategories.id, { onDelete: "set null" }),

  price: numericMoney("price").notNull(),
  currencyId: varchar("currency_id", { length: 3 }).default("UZS"),

  vatId: varchar("vat_id", { length: 50 }), // QQS
  vatIncluded: boolean("vat_included").default(true),

  measureCode: integer("measure_code"), // o'lchov birligi kodi
  measureName: varchar("measure_name", { length: 50 }),

  description: text("description"),
  descriptionRu: text("description_ru"),

  active: boolean("active").default(true),
  sort: integer("sort").default(500),
});


export const insertCrmProductSchema = createInsertSchema(crmProducts, {
  name: z.string().min(1, "Mahsulot nomi kerak"),
  price: z.number().min(0, "Narx 0 dan katta bo'lishi kerak"),
}).omit({ id: true } as never);


export type CrmProduct = typeof crmProducts.$inferSelect;

export type InsertCrmProduct = z.infer<typeof insertCrmProductSchema>;


// CRM Deal Products (Kelishuv mahsulotlari - b_crm_product_row)
export const crmDealProducts = pgTable("crm_deal_products", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull().references(() => crmDeals.id, { onDelete: "cascade" }),
  ownerType: varchar("owner_type", { length: 20 }).default("D"), // D=Deal, L=Lead, Q=Quote

  productId: integer("product_id").references(() => crmProducts.id, { onDelete: "set null" }),
  productName: text("product_name").notNull(),

  price: numericMoney("price").notNull(),
  priceExclusive: numericMoney("price_exclusive"),
  priceNetto: numericMoney("price_netto"),
  priceBrutto: numericMoney("price_brutto"),

  quantity: numericMoney("quantity").notNull(),
  discountTypeId: varchar("discount_type_id", { length: 20 }), // percentage, amount
  discountRate: numericMoney("discount_rate"),
  discountSum: numericMoney("discount_sum"),

  taxRate: numericMoney("tax_rate"),
  taxIncluded: boolean("tax_included").default(true),

  measureCode: integer("measure_code"),
  measureName: varchar("measure_name", { length: 50 }),

  sort: integer("sort").default(500),
});


export const insertCrmDealProductSchema = createInsertSchema(crmDealProducts, {
  ownerId: z.number().int().positive(),
  productName: z.string().min(1, "Mahsulot nomi kerak"),
  price: z.number().min(0, "Narx 0 dan katta bo'lishi kerak"),
  quantity: z.number().min(0.0001, "Miqdor 0 dan katta bo'lishi kerak"),
}).omit({ id: true } as never);


export type CrmDealProduct = typeof crmDealProducts.$inferSelect;

export type InsertCrmDealProduct = z.infer<typeof insertCrmDealProductSchema>;

// ORFAN CLEANUP (2026-07-02): crm_activities, crm_lead_stages pgTable
// declarations removed from here (dead lib/db duplicates — live CRM app code
// uses apps/api/src/shared/db via @europrint/schemas / @shared/db, never
// @workspace/db). Q-29 verified: no @workspace/db consumer anywhere.
