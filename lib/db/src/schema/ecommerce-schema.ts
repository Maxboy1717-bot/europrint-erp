/**
 * @module ecommerce-schema
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { numericMoney } from "./numeric-money";
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, serial, unique, uuid, check } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { orders, productCategories, products } from "./pp-schema";
// NOTE (2026-07-02): crmLeads/crmDeals are live/canonical (see
// ./crm-contacts.ts and ./crm-pipelines.ts notes) — kept as real FK targets
// below. crmCompanies was a dead lib/db duplicate (deleted, Q-29 verified) —
// its FK converted to a plain column.
import { crmDeals } from "./crm-pipelines";
import { crmLeads } from "./crm-contacts";


// Public Products (Ommaviy mahsulotlar)
export const publicProducts = pgTable("public_products", {
  id: serial("id").primaryKey(),
  // NOTE (2026-07-03, public-products-category-id-int migration): was varchar,
  // but productCategories.id is `serial` (integer) — corrected to match.
  // NOTE: portfolioItems.categoryId below has the SAME varchar/integer schema
  // mismatch (live DB column is integer) — tracked separately, not fixed here
  // (out of scope for the public_products/web-catalog fix). 0 rows affected
  // here either way (verified live, 2026-07-03).
  categoryId: integer("category_id").references(() => productCategories.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  nameRu: text("name_ru"),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  descriptionRu: text("description_ru"),
  shortDescription: text("short_description"),
  shortDescriptionRu: text("short_description_ru"),
  images: jsonb("images"), // [{ url, alt, isPrimary }]
  specifications: jsonb("specifications"), // { size, color, material, ... }
  pricePerUnit: numericMoney("price_per_unit"),
  minOrderQuantity: integer("min_order_quantity").default(100),
  unit: varchar("unit", { length: 20 }).default("dona"), // dona, kg, m2
  inStock: boolean("in_stock").default(true),
  isFeatured: boolean("is_featured").default(false),
  isActive: boolean("is_active").default(true),
  erpProductId: varchar("erp_product_id").references(() => products.id, { onDelete: "set null" }),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // --- live-DB superset (A12 convergence) ---
  price: numericMoney("price"),
  imageUrl: text("image_url"),
  // convergence: live-DB columns added (additive)
  updatedAt: timestamp("updated_at"),
  deletedAt: timestamp("deleted_at"),
});


export const insertPublicProductSchema = createInsertSchema(publicProducts).omit({ id: true, createdAt: true } as never);

export type PublicProduct = typeof publicProducts.$inferSelect;

export type InsertPublicProduct = z.infer<typeof insertPublicProductSchema>;


// Customer Accounts (Mijoz akkountlari)
export const customerAccounts = pgTable("customer_accounts", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).unique(),
  phone: varchar("phone", { length: 20 }).notNull().unique(),
  passwordHash: text("password_hash"),
  fullName: text("full_name").notNull(),
  companyName: text("company_name"),
  // FK to crmCompanies removed 2026-07-02 (orphan table deleted, see note above)
  crmCompanyId: integer("crm_company_id"),
  inn: varchar("inn", { length: 20 }),
  address: text("address"),
  isVerified: boolean("is_verified").default(false),
  verificationCode: varchar("verification_code", { length: 10 }),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // --- live-DB superset (A12 convergence) ---
  name: text("name"),
  status: varchar("status", { length: 30 }),
  creditLimit: numericMoney("credit_limit"),
});


export const insertCustomerAccountSchema = createInsertSchema(customerAccounts).omit({ id: true, createdAt: true } as never);

export type CustomerAccount = typeof customerAccounts.$inferSelect;

export type InsertCustomerAccount = z.infer<typeof insertCustomerAccountSchema>;


// Customer Orders (Mijoz buyurtmalari)
export const customerOrders = pgTable("customer_orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("order_number", { length: 20 }).notNull().unique(),
  customerId: varchar("customer_id").references(() => customerAccounts.id, { onDelete: "set null" }),
  guestPhone: varchar("guest_phone", { length: 20 }), // For guest orders
  guestName: text("guest_name"),
  guestEmail: varchar("guest_email", { length: 255 }),
  status: varchar("status", { length: 20 }).default("new"), // new, confirmed, in_production, ready, shipped, delivered, cancelled
  items: jsonb("items").notNull(), // [{ productId, name, quantity, price, specs }]
  subtotal: numericMoney("subtotal").notNull(),
  deliveryFee: numericMoney("delivery_fee").default(0),
  total: numericMoney("total").notNull(),
  deliveryAddress: text("delivery_address"),
  deliveryMethod: varchar("delivery_method", { length: 30 }), // pickup, delivery
  paymentMethod: varchar("payment_method", { length: 30 }), // cash, transfer, click, payme
  paymentStatus: varchar("payment_status", { length: 20 }).default("pending"), // pending, paid, refunded
  notes: text("notes"),
  attachments: jsonb("attachments"), // [{ name, url, type }] - design files
  estimatedDelivery: timestamp("estimated_delivery"),
  crmLeadId: integer("crm_lead_id").references(() => crmLeads.id, { onDelete: "set null" }),
  crmDealId: integer("crm_deal_id").references(() => crmDeals.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
  // --- live-DB superset (A12 convergence) ---
  totalAmount: numericMoney("total_amount"),
  currency: varchar("currency", { length: 10 }),
  // convergence: live-DB columns added (additive)
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  check("customer_orders_status_chk", sql`${t.status} IS NULL OR ${t.status} IN ('new','confirmed','in_production','ready','shipped','delivered','cancelled')`),
  check("customer_orders_payment_status_chk", sql`${t.paymentStatus} IS NULL OR ${t.paymentStatus} IN ('pending','paid','refunded')`),
  check("customer_orders_delivery_method_chk", sql`${t.deliveryMethod} IS NULL OR ${t.deliveryMethod} IN ('pickup','delivery')`),
]);


export const insertCustomerOrderSchema = createInsertSchema(customerOrders).omit({ id: true, createdAt: true } as never);

export type CustomerOrder = typeof customerOrders.$inferSelect;

export type InsertCustomerOrder = z.infer<typeof insertCustomerOrderSchema>;
// Portfolio Items (Portfolio elementlari)
export const portfolioItems = pgTable("portfolio_items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  titleRu: text("title_ru"),
  description: text("description"),
  descriptionRu: text("description_ru"),
  clientName: text("client_name"),
  categoryId: varchar("category_id").references(() => productCategories.id, { onDelete: "set null" }),
  images: jsonb("images").notNull(), // [{ url, alt }]
  year: integer("year"),
  isFeatured: boolean("is_featured").default(false),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // --- live-DB superset (A12 convergence) ---
  imageUrl: text("image_url"),
  isPublished: boolean("is_published").default(false),
  // convergence: live-DB columns added (additive)
  deletedAt: timestamp("deleted_at"),
});


export const insertPortfolioItemSchema = createInsertSchema(portfolioItems).omit({ id: true, createdAt: true } as never);

export type PortfolioItem = typeof portfolioItems.$inferSelect;

export type InsertPortfolioItem = z.infer<typeof insertPortfolioItemSchema>;


// Website Pages (Sayt sahifalari - CMS)
export const websitePages = pgTable("website_pages", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  title: text("title").notNull(),
  titleRu: text("title_ru"),
  content: text("content"),
  contentRu: text("content_ru"),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  isPublished: boolean("is_published").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
  // convergence: live-DB columns added (additive)
  deletedAt: timestamp("deleted_at"),
});


export const insertWebsitePageSchema = createInsertSchema(websitePages).omit({ id: true, createdAt: true } as never);

export type WebsitePage = typeof websitePages.$inferSelect;

export type InsertWebsitePage = z.infer<typeof insertWebsitePageSchema>;


// Website Banners (Sayt bannerlari)
export const websiteBanners = pgTable("website_banners", {
  id: serial("id").primaryKey(),
  title: text("title"),
  titleRu: text("title_ru"),
  subtitle: text("subtitle"),
  subtitleRu: text("subtitle_ru"),
  imageUrl: text("image_url").notNull(),
  imageUrlMobile: text("image_url_mobile"),
  linkUrl: text("link_url"),
  buttonText: text("button_text"),
  buttonTextRu: text("button_text_ru"),
  position: varchar("position", { length: 30 }).default("hero"), // hero, sidebar, footer
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // convergence: live-DB columns added (additive)
  updatedAt: timestamp("updated_at"),
});


export const insertWebsiteBannerSchema = createInsertSchema(websiteBanners).omit({ id: true, createdAt: true } as never);

export type WebsiteBanner = typeof websiteBanners.$inferSelect;

export type InsertWebsiteBanner = z.infer<typeof insertWebsiteBannerSchema>;


// Website Settings (Sayt sozlamalari)
export const websiteSettings = pgTable("website_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  valueRu: text("value_ru"),
  type: varchar("type", { length: 30 }).default("text"),
  category: varchar("category", { length: 50 }),
  updatedAt: timestamp("updated_at").defaultNow(),
});


export const insertWebsiteSettingSchema = createInsertSchema(websiteSettings).omit({ id: true, updatedAt: true } as never);

export type WebsiteSetting = typeof websiteSettings.$inferSelect;

export type InsertWebsiteSetting = z.infer<typeof insertWebsiteSettingSchema>;


// Public Categories (Ommaviy kategoriyalar — ierarxik)
export const publicCategories = pgTable("public_categories", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: text("name").notNull(),
  nameRu: text("name_ru"),
  description: text("description"),
  descriptionRu: text("description_ru"),
  imageUrl: text("image_url"),
  parentId: integer("parent_id"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPublicCategorySchema = createInsertSchema(publicCategories).omit({ id: true, createdAt: true } as never);
export type PublicCategory = typeof publicCategories.$inferSelect;
export type InsertPublicCategory = z.infer<typeof insertPublicCategorySchema>;


// Customer Order Items (Buyurtma satrlari — alohida jadval)
export const customerOrderItems = pgTable("customer_order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => customerOrders.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => publicProducts.id, { onDelete: "set null" }),
  productName: text("product_name").notNull(),
  productNameRu: text("product_name_ru"),
  quantity: integer("quantity").notNull(),
  unit: varchar("unit", { length: 20 }).default("dona"),
  unitPrice: numericMoney("unit_price").notNull(),
  totalPrice: numericMoney("total_price").notNull(),
  specifications: jsonb("specifications"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCustomerOrderItemSchema = createInsertSchema(customerOrderItems).omit({ id: true, createdAt: true } as never);
export type CustomerOrderItem = typeof customerOrderItems.$inferSelect;
export type InsertCustomerOrderItem = z.infer<typeof insertCustomerOrderItemSchema>;


// Product Favorites (Sevimli mahsulotlar)
export const productFavorites = pgTable("product_favorites", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customerAccounts.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => publicProducts.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
},
(table) => ({
  uniqueFavorite: unique().on(table.customerId, table.productId),
}));

export const insertProductFavoriteSchema = createInsertSchema(productFavorites).omit({ id: true, createdAt: true } as never);
export type ProductFavorite = typeof productFavorites.$inferSelect;
export type InsertProductFavorite = z.infer<typeof insertProductFavoriteSchema>;


// Website Reviews (Mijoz sharhlari)
export const websiteReviews = pgTable("website_reviews", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customerAccounts.id, { onDelete: "set null" }),
  customerName: text("customer_name").notNull(),
  companyName: text("company_name"),
  rating: integer("rating").notNull(),
  review: text("review").notNull(),
  reviewRu: text("review_ru"),
  productId: integer("product_id").references(() => publicProducts.id, { onDelete: "set null" }),
  orderId: integer("order_id").references(() => customerOrders.id, { onDelete: "set null" }),
  isApproved: boolean("is_approved").default(false),
  isFeatured: boolean("is_featured").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWebsiteReviewSchema = createInsertSchema(websiteReviews).omit({ id: true, createdAt: true } as never);
export type WebsiteReview = typeof websiteReviews.$inferSelect;
export type InsertWebsiteReview = z.infer<typeof insertWebsiteReviewSchema>;


// Website Chat Logs (AI chatbot suhbat tarixi)
export const websiteChatLogs = pgTable("website_chat_logs", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 100 }).notNull(),
  customerId: integer("customer_id").references(() => customerAccounts.id, { onDelete: "set null" }),
  role: varchar("role", { length: 20 }).notNull(),
  message: text("message").notNull(),
  provider: varchar("provider", { length: 30 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWebsiteChatLogSchema = createInsertSchema(websiteChatLogs).omit({ id: true, createdAt: true } as never);
export type WebsiteChatLog = typeof websiteChatLogs.$inferSelect;
export type InsertWebsiteChatLog = z.infer<typeof insertWebsiteChatLogSchema>;

