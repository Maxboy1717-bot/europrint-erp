/**
 * @module pp-design
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, serial, numeric, pgSequence, check } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "../core-schema";
import { papkaOrders } from "./pp-papka";

// Design order number sequence (buyurtma raqami uchun)
export const designOrderSeq = pgSequence("design_order_seq", {
  startWith: 1,
  increment: 1,
  minValue: 1,
  cache: 1,
});

// Design Orders (Dizayn buyurtmalari)
export const designOrders = pgTable("design_orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
  dealId: varchar("deal_id"),
  papkaOrderId: varchar("papka_order_id").references(() => papkaOrders.id, { onDelete: "set null" }),
  clientName: text("client_name").notNull(),
  clientCompany: text("client_company"),
  clientPhone: varchar("client_phone", { length: 20 }),
  clientEmail: varchar("client_email", { length: 100 }),
  productType: varchar("product_type", { length: 50 }).notNull(),
  productName: text("product_name").notNull(),
  brandName: text("brand_name"),
  quantity: integer("quantity").notNull().default(1000),
  description: text("description"),
  requirements: text("requirements"),
  status: varchar("status", { length: 30 }).notNull().default("new"),
  priority: varchar("priority", { length: 20 }).notNull().default("normal"),
  deadline: varchar("deadline", { length: 10 }),
  assignedDesignerId: integer("assigned_designer_id").references(() => users.id, { onDelete: "set null" }),
  managerId: integer("manager_id").references(() => users.id, { onDelete: "set null" }),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  check("design_orders_product_type_chk", sql`${t.productType} IN ('stakan','quti','plakat','qadoq','korrugirovanniy-quti','tibbiy-qadoq')`),
  check("design_orders_status_chk", sql`${t.status} IN ('new','ai_generated','designer_review','waiting_customer_approval','revision_requested','approved','rejected','archived','yangi','jarayonda','tasdiq-kutilmoqda','tasdiqlangan','ishlab-chiqarish','yakunlangan')`),
  check("design_orders_priority_chk", sql`${t.priority} IN ('low','normal','high','urgent')`),
]);

export const insertDesignOrderSchema = createInsertSchema(designOrders, {
  orderNumber: z.string().min(1, "Buyurtma raqami kerak"),
  clientName: z.string().min(1, "Mijoz ismi kerak"),
  productType: z.enum(["stakan", "quti", "plakat", "qadoq", "korrugirovanniy-quti", "tibbiy-qadoq"]),
  productName: z.string().min(1, "Mahsulot nomi kerak"),
  quantity: z.number().int().positive("Miqdor musbat bo'lishi kerak"),
  status: z.enum(["new", "ai_generated", "designer_review", "waiting_customer_approval", "revision_requested", "approved", "rejected", "archived", "yangi", "jarayonda", "tasdiq-kutilmoqda", "tasdiqlangan", "ishlab-chiqarish", "yakunlangan"]),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  dealId: z.string().optional(),
}).omit({ id: true, createdAt: true, updatedAt: true, completedAt: true } as never);

export type DesignOrder = typeof designOrders.$inferSelect;
export type InsertDesignOrder = z.infer<typeof insertDesignOrderSchema>;

// Brand Templates (Brend shablonlari)
export const brandTemplates = pgTable("brand_templates", {
  id: serial("id").primaryKey(),
  templateNumber: varchar("template_number", { length: 50 }).notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  brandName: text("brand_name"),
  category: varchar("category", { length: 50 }),
  colors: jsonb("colors").notNull().default('[]'),
  fonts: jsonb("fonts").default('[]'),
  logoUrl: text("logo_url"),
  designElements: jsonb("design_elements"),
  styleGuide: text("style_guide"),
  basePrompt: text("base_prompt"),
  usageCount: integer("usage_count").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const insertBrandTemplateSchema = createInsertSchema(brandTemplates, {
  templateNumber: z.string().min(1, "Shablon raqami kerak"),
  name: z.string().min(1, "Shablon nomi kerak"),
  colors: z.array(z.string()).default([]),
}).omit({ id: true, createdAt: true, updatedAt: true, usageCount: true } as never);

export type BrandTemplate = typeof brandTemplates.$inferSelect;
export type InsertBrandTemplate = z.infer<typeof insertBrandTemplateSchema>;

// Designs (AI-generated dizaynlar)
export const designs = pgTable("designs", {
  id: serial("id").primaryKey(),
  orderId: varchar("order_id").notNull().references(() => designOrders.id, { onDelete: "cascade" }),
  designNumber: varchar("design_number", { length: 50 }).notNull().unique(),
  version: integer("version").notNull().default(1),
  title: text("title").notNull(),
  description: text("description"),
  slogan: text("slogan"),
  imageUrl: text("image_url"),
  promptUsed: text("prompt_used"),
  templateId: varchar("template_id").references(() => brandTemplates.id, { onDelete: "set null" }),
  status: varchar("status", { length: 30 }).notNull().default("new"),
  isApproved: boolean("is_approved").notNull().default(false),
  approvedBy: varchar("approved_by").references(() => users.id, { onDelete: "set null" }),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  aiModel: varchar("ai_model", { length: 50 }).default("gpt-5"),
  generationTime: integer("generation_time"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  check("designs_status_chk", sql`${t.status} IN ('new','ai_generated','designer_review','waiting_customer_approval','revision_requested','approved','rejected','archived','kutilmoqda','korib-chiqilmoqda','tasdiqlangan','rad-etilgan')`),
]);

export const insertDesignSchema = createInsertSchema(designs, {
  orderId: z.string().min(1, "Buyurtma ID kerak"),
  designNumber: z.string().min(1, "Dizayn raqami kerak"),
  title: z.string().min(1, "Dizayn nomi kerak"),
  status: z.enum(["new", "ai_generated", "designer_review", "waiting_customer_approval", "revision_requested", "approved", "rejected", "archived", "kutilmoqda", "korib-chiqilmoqda", "tasdiqlangan", "rad-etilgan"]),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);

export type Design = typeof designs.$inferSelect;
export type InsertDesign = z.infer<typeof insertDesignSchema>;

// Design Order Messages (Chat system)
export const designOrderMessages = pgTable("designOrderMessages", {
  id: serial("id").primaryKey(),
  orderId: varchar("orderId").notNull().references(() => designOrders.id, { onDelete: "cascade" }),
  senderId: varchar("senderId").notNull().references(() => users.id, { onDelete: "cascade" }),
  senderName: varchar("senderName"),
  senderRole: varchar("senderRole", { length: 20 }).notNull(),
  message: text("message").notNull(),
  attachments: text("attachments").array(),
  isRead: boolean("is_read").notNull().default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
}, (t) => [
  check("design_order_messages_role_chk", sql`${t.senderRole} IN ('sales','design')`),
]);

export const insertDesignOrderMessageSchema = createInsertSchema(designOrderMessages, {
  orderId: z.string().min(1, "Buyurtma ID kerak"),
  senderId: z.string().min(1, "Yuboruvchi ID kerak"),
  senderRole: z.enum(["sales", "design"]),
  message: z.string().min(1, "Xabar matni kerak"),
}).omit({ id: true, createdAt: true } as never);

export type DesignOrderMessage = typeof designOrderMessages.$inferSelect;
export type InsertDesignOrderMessage = z.infer<typeof insertDesignOrderMessageSchema>;

// Design Order Notifications
export const designOrderNotifications = pgTable("designOrderNotifications", {
  id: serial("id").primaryKey(),
  orderId: varchar("orderId").notNull().references(() => designOrders.id, { onDelete: "cascade" }),
  recipientId: varchar("recipientId").notNull().references(() => users.id, { onDelete: "cascade" }),
  recipientRole: varchar("recipientRole", { length: 20 }),
  notificationType: varchar("notificationType", { length: 30 }).notNull(),
  title: varchar("title").notNull(),
  body: text("body").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
}, (t) => [
  check("design_order_notifs_type_chk", sql`${t.notificationType} IN ('status_update','message','deadline')`),
]);

export const insertDesignOrderNotificationSchema = createInsertSchema(designOrderNotifications, {
  orderId: z.string().min(1, "Buyurtma ID kerak"),
  recipientId: z.string().min(1, "Qabul qiluvchi ID kerak"),
  notificationType: z.enum(["status_update", "message", "deadline"]),
  title: z.string().min(1, "Sarlavha kerak"),
  body: z.string().min(1, "Xabar matni kerak"),
}).omit({ id: true, createdAt: true } as never);

export type DesignOrderNotification = typeof designOrderNotifications.$inferSelect;
export type InsertDesignOrderNotification = z.infer<typeof insertDesignOrderNotificationSchema>;

// Design Comments
export const designComments = pgTable("design_comments", {
  id: serial("id").primaryKey(),
  designId: varchar("design_id").notNull().references(() => designs.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  commentText: text("comment_text").notNull(),
  type: varchar("type", { length: 20 }).notNull().default("comment"),
  attachmentUrl: text("attachment_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("design_comments_type_chk", sql`${t.type} IN ('comment','approval','rejection')`),
]);

export const insertDesignCommentSchema = createInsertSchema(designComments, {
  designId: z.string().min(1, "Dizayn ID kerak"),
  userId: z.string().min(1, "User ID kerak"),
  commentText: z.string().min(1, "Sharh matni kerak"),
  type: z.enum(["comment", "approval", "rejection"]),
}).omit({ id: true, createdAt: true } as never);

export type DesignComment = typeof designComments.$inferSelect;
export type InsertDesignComment = z.infer<typeof insertDesignCommentSchema>;

// ─── Design Tooling (Bosma asboblar/qoliplar) ────────────────────────────────
export const designTooling = pgTable("design_tooling", {
  id: serial("id").primaryKey(),
  toolingNumber: varchar("tooling_number", { length: 50 }).notNull().unique(),
  toolingType: varchar("tooling_type", { length: 30 }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  supplier: text("supplier"),
  location: text("location"),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  maxUsageCount: integer("max_usage_count").notNull().default(100000),
  totalUsageCount: integer("total_usage_count").notNull().default(0),
  wearPercentage: numeric("wear_percentage", { precision: 5, scale: 2 }).default("0"),
  purchaseDate: varchar("purchase_date", { length: 10 }),
  purchaseCost: numeric("purchase_cost", { precision: 18, scale: 2 }),
  technicalSpecs: jsonb("technical_specs").default('{}'),
  lastMaintenanceDate: varchar("last_maintenance_date", { length: 10 }),
  nextMaintenanceDate: varchar("next_maintenance_date", { length: 10 }),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  check("design_tooling_type_chk", sql`${t.toolingType} IN ('cliche','plate','mold','die_cut','cylinder','screen','flexo','gravure','offset','digital')`),
  check("design_tooling_status_chk", sql`${t.status} IN ('active','maintenance','worn','retired','ordered')`),
]);

export const insertDesignToolingSchema = createInsertSchema(designTooling, {
  toolingNumber: z.string().min(1),
  toolingType: z.enum(["cliche", "plate", "mold", "die_cut", "cylinder", "screen", "flexo", "gravure", "offset", "digital"]),
  name: z.string().min(1),
  status: z.enum(["active", "maintenance", "worn", "retired", "ordered"]).optional(),
}).omit({ id: true, createdAt: true, updatedAt: true, totalUsageCount: true, wearPercentage: true } as never);

export type DesignTooling = typeof designTooling.$inferSelect;
export type InsertDesignTooling = z.infer<typeof insertDesignToolingSchema>;

export const TOOLING_TYPE_LIST = [
  "cliche", "plate", "mold", "die_cut", "cylinder",
  "screen", "flexo", "gravure", "offset", "digital",
] as const;
export type PpToolingType = typeof TOOLING_TYPE_LIST[number];

export const TOOLING_STATUS_LIST = ["active", "maintenance", "worn", "retired", "ordered"] as const;
export type PpToolingStatus = typeof TOOLING_STATUS_LIST[number];

// ─── Design Revision History ──────────────────────────────────────────────────
export const DESIGN_ORDER_STATUS_LIST = [
  "new", "ai_generated", "designer_review",
  "waiting_customer_approval", "revision_requested",
  "approved", "rejected", "archived",
] as const;
export type PpDesignOrderStatus = typeof DESIGN_ORDER_STATUS_LIST[number];

// ─── AI Check Types ───────────────────────────────────────────────────────────
export const AI_CHECK_TYPE_LIST = [
  "spelling_uz", "spelling_ru", "spelling_en",
  "bleed", "cmyk", "logo_quality", "overall",
] as const;
export type PpAiCheckType = typeof AI_CHECK_TYPE_LIST[number];
