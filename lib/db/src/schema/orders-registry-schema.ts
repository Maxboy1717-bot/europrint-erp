import { pgTable, serial, varchar, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./core-schema";

// ============================================================================
// BUYRUQLAR REGISTRI — Markazlashgan buyruq boshqaruvi (Bo'lim 19)
// ============================================================================

export const ordersRegistry = pgTable("orders_registry", {
  id: serial("id").primaryKey(),
  number: varchar("number", { length: 30 }).notNull().unique(),
  category: varchar("category", { length: 10 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  issuedBy: varchar("issued_by").references(() => users.id),
  issuedDate: varchar("issued_date", { length: 10 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  departmentIds: jsonb("department_ids").$type<number[]>().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOrdersRegistrySchema = createInsertSchema(ordersRegistry, {
  category: z.enum(["OT", "OM", "OR", "OP", "OX"]),
  title: z.string().min(3, "Sarlavha kamida 3 belgi bo'lishi kerak"),
  content: z.string().min(10, "Mazmun kamida 10 belgi bo'lishi kerak"),
  issuedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  status: z.enum(["active", "cancelled", "expired"]).optional(),
  departmentIds: z.array(z.number()).optional().nullable(),
}).omit({ id: true, number: true, createdAt: true } as never);

export type OrdersRegistryEntry = typeof ordersRegistry.$inferSelect;
export type InsertOrdersRegistryEntry = z.infer<typeof insertOrdersRegistrySchema>;

export const ORDERS_REGISTRY_CATEGORIES = ["OT", "OM", "OR", "OP", "OX"] as const;
export type OrdersRegistryCategory = typeof ORDERS_REGISTRY_CATEGORIES[number];

export const ORDERS_REGISTRY_CATEGORY_LABELS: Record<OrdersRegistryCategory, string> = {
  OT: "Umumiy buyruq (OT)",
  OM: "Mehnat buyruqi (OM)",
  OR: "Rejalashtiruv buyruqi (OR)",
  OP: "Ishlab chiqarish buyruqi (OP)",
  OX: "Xo'jalik buyruqi (OX)",
};
