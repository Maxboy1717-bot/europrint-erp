/**
 * @module mm-purchase
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { numericMoney } from "./numeric-money";
import { sql } from "drizzle-orm";
import { serial, pgTable, text, varchar, integer, boolean, timestamp, jsonb, unique, uuid, pgSequence, index, check } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./core-schema";
import { glDocuments } from "./fi-schema";
import { Order, equipment, formulaDefinitions, machineTasks, mrpResults, mrpRuns, papkaOrders, productionOrders, products } from "./pp-schema";
import { warehouseBins, warehouseTransactions, warehouses } from "./wms-schema";
import { materialCards } from "./mm-materials";
import { rawMaterials, vendors } from "./mm-raw-materials";

// Goods Receipt Lines (Qabul qilingan tovarlar - batafsil QC bilan)
export const goodsReceiptLines = pgTable("goods_receipt_lines", {
  id: serial("id").primaryKey(),
  // NOTE: FK to goodsReceipts removed (orphan pgTable deleted 2026-07-02) — plain column retained.
  receiptId: integer("receipt_id").notNull(),
  // FK type fix: materialCards.id is serial (integer), was incorrectly declared varchar
  materialCardId: integer("material_id").references(() => materialCards.id, { onDelete: "set null" }),
  orderedQuantity: numericMoney("ordered_quantity"),
  receivedQuantity: numericMoney("received_quantity").notNull(),
  acceptedQuantity: numericMoney("accepted_quantity"),
  rejectedQuantity: numericMoney("rejected_quantity").default(0),
  unitCost: numericMoney("unit_cost").default(0),
  totalCost: numericMoney("total_cost").default(0),
  batchNumber: varchar("batch_number", { length: 50 }),
  expiryDate: varchar("expiry_date", { length: 10 }),
  qcStatus: varchar("qc_status", { length: 20 }).default("pending"), // pending, passed, failed, not_required
  qcNotes: text("qc_notes"),
  qcDate: varchar("qc_date", { length: 10 }),
  binId: varchar("bin_id").references(() => warehouseBins.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("goods_receipt_lines_qc_status_chk", sql`${t.qcStatus} IN ('pending','passed','failed','not_required')`),
  check("goods_receipt_lines_received_qty_chk", sql`${t.receivedQuantity} > 0`),
  check("goods_receipt_lines_rejected_qty_chk", sql`${t.rejectedQuantity} IS NULL OR ${t.rejectedQuantity} >= 0`),
  check("goods_receipt_lines_unit_cost_chk", sql`${t.unitCost} IS NULL OR ${t.unitCost} >= 0`),
  check("goods_receipt_lines_total_cost_chk", sql`${t.totalCost} IS NULL OR ${t.totalCost} >= 0`),
  index("idx_goods_receipt_lines_receipt_id").on(t.receiptId),
  index("idx_goods_receipt_lines_material_card_id").on(t.materialCardId),
  index("idx_goods_receipt_lines_qc_status").on(t.qcStatus),
  index("idx_goods_receipt_lines_created_at").on(t.createdAt),
]);


export const insertGoodsReceiptLineSchema = createInsertSchema(goodsReceiptLines, {
  receiptId: z.string().min(1, "Qabul ID kerak"),
  receivedQuantity: z.number().nonnegative("Qabul qilingan miqdor manfiy bo'lmasligi kerak"),
  qcStatus: z.enum(["pending", "passed", "failed", "not_required"]).default("pending"),
}).omit({ id: true, createdAt: true } as never);


export type GoodsReceiptLine = typeof goodsReceiptLines.$inferSelect;

export type InsertGoodsReceiptLine = z.infer<typeof insertGoodsReceiptLineSchema>;


// Goods Receipt Items - Legacy compatibility (Qabul qilingan tovarlar)
export const goodsReceiptItems = pgTable("goods_receipt_items", {
  id: serial("id").primaryKey(),
  // NOTE: FK to goodsReceipts removed (orphan pgTable deleted 2026-07-02) — plain column retained.
  grId: integer("gr_id").notNull(),
  rawMaterialId: integer("raw_material_id").references(() => rawMaterials.id, { onDelete: "cascade" }).notNull(),
  orderedQty: numericMoney("ordered_qty").notNull(),
  receivedQty: numericMoney("received_qty").notNull(),
  unit: varchar("unit", { length: 20 }).notNull(),
}, (t) => [
  index("idx_goods_receipt_items_gr_id").on(t.grId),
  index("idx_goods_receipt_items_raw_material_id").on(t.rawMaterialId),
]);


export const insertGoodsReceiptItemSchema = createInsertSchema(goodsReceiptItems, {
  grId: z.string().min(1, "GR kerak"),
  rawMaterialId: z.string().min(1, "Xom ashyo kerak"),
  orderedQty: z.number().nonnegative("Buyurtma miqdori manfiy bo'lmasligi kerak"),
  receivedQty: z.number().nonnegative("Qabul qilingan miqdor manfiy bo'lmasligi kerak"),
  unit: z.string().min(1, "O'lchov birligi kerak"),
}).omit({ id: true } as never);


export type GoodsReceiptItem = typeof goodsReceiptItems.$inferSelect;

export type InsertGoodsReceiptItem = z.infer<typeof insertGoodsReceiptItemSchema>;


// Goods Issues (Tovarlarni chiqarish)
export const goodsIssues = pgTable("goods_issues", {
  id: serial("id").primaryKey(),
  giNumber: varchar("gi_number", { length: 50 }).notNull().unique(),
  issueDate: varchar("issue_date", { length: 10 }).notNull(), // YYYY-MM-DD
  issueType: varchar("issue_type", { length: 20 }).notNull(), // production, sales, adjustment
  referenceId: varchar("reference_id", { length: 100 }), // Reference to production order, sales order, etc.
  warehouseId: integer("warehouse_id").references(() => warehouses.id, { onDelete: "cascade" }).notNull(),
  issuedBy: varchar("issued_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_goods_issues_warehouse_id").on(t.warehouseId),
  index("idx_goods_issues_issue_type").on(t.issueType),
  index("idx_goods_issues_issue_date").on(t.issueDate),
  index("idx_goods_issues_created_at").on(t.createdAt),
  check("goods_issues_issue_type_chk", sql`${t.issueType} IN ('production','sales','adjustment')`),
]);


export const insertGoodsIssueSchema = createInsertSchema(goodsIssues, {
  giNumber: z.string().min(1, "GI raqami kerak"),
  issueDate: z.string().min(1, "Chiqarish sanasi kerak"),
  issueType: z.enum(["production", "sales", "adjustment"]),
  warehouseId: z.string().min(1, "Ombor kerak"),
}).omit({ id: true, createdAt: true } as never);


export type GoodsIssue = typeof goodsIssues.$inferSelect;

export type InsertGoodsIssue = z.infer<typeof insertGoodsIssueSchema>;


// Goods Issue Items (Chiqarilgan tovarlar)
export const goodsIssueItems = pgTable("goods_issue_items", {
  id: serial("id").primaryKey(),
  giId: integer("gi_id").references(() => goodsIssues.id, { onDelete: "cascade" }).notNull(),
  rawMaterialId: integer("raw_material_id").references(() => rawMaterials.id, { onDelete: "cascade" }).notNull(),
  quantity: numericMoney("quantity").notNull(),
  unit: varchar("unit", { length: 20 }).notNull(),
}, (t) => [
  index("idx_goods_issue_items_gi_id").on(t.giId),
  index("idx_goods_issue_items_raw_material_id").on(t.rawMaterialId),
]);


export const insertGoodsIssueItemSchema = createInsertSchema(goodsIssueItems, {
  giId: z.string().min(1, "GI kerak"),
  rawMaterialId: z.string().min(1, "Xom ashyo kerak"),
  quantity: z.number().positive("Miqdor musbat bo'lishi kerak"),
  unit: z.string().min(1, "O'lchov birligi kerak"),
}).omit({ id: true } as never);


export type GoodsIssueItem = typeof goodsIssueItems.$inferSelect;

export type InsertGoodsIssueItem = z.infer<typeof insertGoodsIssueItemSchema>;



// ========== CO: CONTROLLING ==========


// ========== SD: SALES & DISTRIBUTION ==========


// ========== MM: MATERIALS MANAGEMENT ==========


// ========== PP: PRODUCTION PLANNING ==========

// Batches (Partiyalar)