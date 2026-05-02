import { numericMoney } from "./numeric-money";
import { sql } from "drizzle-orm";
import { serial, pgTable, text, varchar, integer, boolean, timestamp, jsonb, unique, uuid, pgSequence, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./core-schema";
import { glDocuments } from "./fi-schema";
import { Order, equipment, formulaDefinitions, machineTasks, mrpResults, mrpRuns, papkaOrders, productionOrders, productionSessions, products } from "./pp-schema";
import { warehouseBins, warehouseTransactions, warehouses } from "./wms-schema";
import { materialCards } from "./mm-materials";
import { purchaseOrders, rawMaterials, vendors } from "./mm-raw-materials";

export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders, {
  poNumber: z.string().min(1, "PO raqami kerak"),
  vendorId: z.string().min(1, "Yetkazib beruvchi kerak"),
  orderDate: z.string().min(1, "Buyurtma sanasi kerak"),
  status: z.enum(["draft", "sent", "confirmed", "received", "cancelled"]).default("draft"),
}).omit({ id: true, createdAt: true, deletedAt: true } as never);


export type PurchaseOrder = typeof purchaseOrders.$inferSelect;

export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;


// Purchase Order Items (Xarid buyurtmasi elementlari)
export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: serial("id").primaryKey(),
  poId: integer("po_id").references(() => purchaseOrders.id, { onDelete: "cascade" }).notNull(),
  rawMaterialId: integer("raw_material_id").references(() => rawMaterials.id).notNull(),
  quantity: numericMoney("quantity").notNull(),
  unit: varchar("unit", { length: 20 }).notNull(), // kg, m, pcs, etc.
  unitPrice: numericMoney("unit_price").notNull(),
  totalPrice: numericMoney("total_price").notNull(),
}, (t) => [
  index("idx_purchase_order_items_po_id").on(t.poId),
  index("idx_purchase_order_items_raw_material_id").on(t.rawMaterialId),
]);


export const insertPurchaseOrderItemSchema = createInsertSchema(purchaseOrderItems, {
  poId: z.string().min(1, "Buyurtma kerak"),
  rawMaterialId: z.string().min(1, "Xom ashyo kerak"),
  quantity: z.number().positive("Miqdor musbat bo'lishi kerak"),
  unit: z.string().min(1, "O'lchov birligi kerak"),
  unitPrice: z.number().nonnegative("Narx manfiy bo'lmasligi kerak"),
  totalPrice: z.number().nonnegative("Jami narx manfiy bo'lmasligi kerak"),
}).omit({ id: true } as never);


export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;

export type InsertPurchaseOrderItem = z.infer<typeof insertPurchaseOrderItemSchema>;


// Goods Receipts (Tovarlar qabul qilish) - QC workflow bilan
export const goodsReceipts = pgTable("goods_receipts", {
  id: serial("id").primaryKey(),
  receiptNumber: varchar("receipt_number", { length: 50 }).notNull().unique(),
  receiptDate: varchar("receipt_date", { length: 10 }).notNull(),
  supplierId: varchar("supplier_id").references(() => vendors.id),
  supplierName: text("supplier_name"),
  warehouseId: varchar("warehouse_id").references(() => warehouses.id),
  purchaseOrderId: varchar("purchase_order_id").references(() => purchaseOrders.id),
  status: varchar("status", { length: 20 }).notNull().default("draft"), // draft, pending_qc, qc_passed, qc_failed, received, cancelled
  totalItems: integer("total_items").default(0),
  totalValue: numericMoney("total_value").default(0),
  qcRequiredItems: integer("qc_required_items").default(0),
  qcPassedItems: integer("qc_passed_items").default(0),
  receivedBy: varchar("received_by").references(() => users.id),
  qcBy: varchar("qc_by").references(() => users.id),
  notes: text("notes"),
  invoiceNumber: varchar("invoice_number", { length: 50 }),
  invoiceDate: varchar("invoice_date", { length: 10 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  receivedAt: timestamp("received_at"),
}, (t) => [
  index("idx_goods_receipts_supplier_id").on(t.supplierId),
  index("idx_goods_receipts_warehouse_id").on(t.warehouseId),
  index("idx_goods_receipts_status").on(t.status),
  index("idx_goods_receipts_purchase_order_id").on(t.purchaseOrderId),
  index("idx_goods_receipts_created_at").on(t.createdAt),
]);


export const insertGoodsReceiptSchema = createInsertSchema(goodsReceipts, {
  receiptNumber: z.string().min(1, "Qabul raqami kerak"),
  receiptDate: z.string().min(1, "Qabul sanasi kerak"),
  status: z.enum(["draft", "pending_qc", "qc_passed", "qc_failed", "received", "cancelled"]).default("draft"),
}).omit({ id: true, createdAt: true, receivedAt: true } as never);


export type GoodsReceipt = typeof goodsReceipts.$inferSelect;

export type InsertGoodsReceipt = z.infer<typeof insertGoodsReceiptSchema>;


// Goods Receipt Lines (Qabul qilingan tovarlar - batafsil QC bilan)
export const goodsReceiptLines = pgTable("goods_receipt_lines", {
  id: serial("id").primaryKey(),
  receiptId: integer("receipt_id").notNull().references(() => goodsReceipts.id, { onDelete: "cascade" }),
  materialCardId: varchar("material_card_id").references(() => materialCards.id),
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
  binId: varchar("bin_id").references(() => warehouseBins.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
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
  grId: integer("gr_id").references(() => goodsReceipts.id, { onDelete: "cascade" }).notNull(),
  rawMaterialId: integer("raw_material_id").references(() => rawMaterials.id).notNull(),
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
  warehouseId: integer("warehouse_id").references(() => warehouses.id).notNull(),
  issuedBy: varchar("issued_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_goods_issues_warehouse_id").on(t.warehouseId),
  index("idx_goods_issues_issue_type").on(t.issueType),
  index("idx_goods_issues_issue_date").on(t.issueDate),
  index("idx_goods_issues_created_at").on(t.createdAt),
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
  rawMaterialId: integer("raw_material_id").references(() => rawMaterials.id).notNull(),
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