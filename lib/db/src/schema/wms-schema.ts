/**
 * @module wms-schema
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { numericMoney } from "./numeric-money";
import { sql } from "drizzle-orm";
import { serial, pgTable, text, varchar, integer, boolean, timestamp, jsonb, unique, uuid, index, check } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./core-schema";
import { costCenters, glDocuments, profitCenters } from "./fi-schema";
import { materialBarcodes, materialCards } from "./mm-schema";
import { excelImportRows, papkaOrders, productionFacts, products } from "./pp-schema";


// Warehouses (omborlar)
export const warehouses = pgTable("warehouses", {
  id: varchar("id", { length: 50 }).primaryKey().default(sql`gen_random_uuid()::varchar`),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: text("name").notNull(),
  nameRu: text("name_ru"),
  type: varchar("type", { length: 30 }).notNull().default("main"), // TZ-08: 9 ta ombor turi
  location: text("location"),
  managerId: integer("manager_id").references(() => users.id, { onDelete: 'set null' }),
  isActive: boolean("is_active").notNull().default(true),
  deletedAt: timestamp("deleted_at"),
  deletedBy: integer("deleted_by").references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // --- A7 superset: live-DB columns ---
  address: text("address"),
  isFreeStorage: boolean("is_free_storage").default(false),
  freeStorageDays: integer("free_storage_days"),
  monthlyRate: numericMoney("monthly_rate"),
  capacity: numericMoney("capacity"),
  notes: text("notes"),
}, (t) => [
  index("idx_warehouses_type").on(t.type),
  index("idx_warehouses_is_active").on(t.isActive),
  index("idx_warehouses_manager_id").on(t.managerId),
  // Live-DB superset (ADD-ONLY) + paper_rolls (rulon qog'oz) + waste_paper (makulatura) — 2026-05-30 vision.
  check("warehouses_type_chk", sql`${t.type} IN ('main','raw_material','finished_goods','transit','semi_finished','defective','quarantine','tools_equipment','household_mro','mro','production','department_warehouse','MAIN','QUARANTINE','PRODUCTION_OFFSET','PRODUCTION_FLEXO','tools','household','wip','scrap','paper_rolls','waste_paper')`),
]);


export const insertWarehouseSchema = createInsertSchema(warehouses, {
  code: z.string().min(1, "Kod talab qilinadi"),
  name: z.string().min(2, "Nom kamida 2 ta belgidan iborat bo'lishi kerak"),
  type: z.enum(["main", "raw_material", "finished_goods", "transit", "semi_finished", "defective", "quarantine", "tools_equipment", "household_mro", "mro", "production", "department_warehouse", "MAIN", "QUARANTINE", "PRODUCTION_OFFSET", "PRODUCTION_FLEXO", "tools", "household", "wip", "scrap", "paper_rolls", "waste_paper"]),
}).omit({ id: true, createdAt: true } as never);


export type Warehouse = typeof warehouses.$inferSelect;

export type InsertWarehouse = z.infer<typeof insertWarehouseSchema>;


// ─────────────────────────────────────────────────────────────────────────────
// Ombor tip KONFIGURATSIYASI (config-driven) — 2026-05-30 vision.
// Yangi ombor turi qo'shish = bitta qator INSERT (kod o'zgartmasdan). `rules` JSONB
// cheksiz kengaytirish uchun (akt turlari, qoidalar — keyin "yana qo'shamiz").
// ─────────────────────────────────────────────────────────────────────────────
export const warehouseTypes = pgTable("warehouse_types", {
  code:            varchar("code", { length: 40 }).primaryKey(),     // 'raw_material','paper_rolls',...
  nameUz:          text("name_uz").notNull(),
  nameRu:          text("name_ru"),
  category:        varchar("category", { length: 30 }).notNull(),    // material/finished/production/waste/tools/department
  icon:            varchar("icon", { length: 40 }),                  // lucide icon nomi (FE)
  inboundFlow:     varchar("inbound_flow", { length: 30 }).notNull().default("standard"),   // procurement_qc/mes_qc/transfer/waste_collect
  outboundFlow:    varchar("outbound_flow", { length: 30 }).notNull().default("standard"),  // production_issue/sales_order/consume/sell
  needsQuarantine: boolean("needs_quarantine").notNull().default(false),
  needsQc:         boolean("needs_qc").notNull().default(false),
  unitBasis:       varchar("unit_basis", { length: 20 }).notNull().default("unit"),         // unit/weight/length
  labelTemplate:   varchar("label_template", { length: 30 }).notNull().default("standard"), // standard/roll/finished
  rules:           jsonb("rules").notNull().default(sql`'{}'::jsonb`),                       // kengaytiriladigan qoidalar
  sortOrder:       integer("sort_order").notNull().default(0),
  isActive:        boolean("is_active").notNull().default(true),
  createdAt:       timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_warehouse_types_category").on(t.category),
  index("idx_warehouse_types_active").on(t.isActive),
]);

export type WarehouseTypeConfig = typeof warehouseTypes.$inferSelect;


// ─────────────────────────────────────────────────────────────────────────────
// P2P XARID-TO'LOV (procurement) — 2026-05-30 vision. Ichki ta'minotchi so'rovi →
// org-sxema tasdiq → avans → chek → ombor kirim → podotchet. Toza, P2P-maxsus.
// (Tasdiq zanjiri ProcurementApprovalChainService bilan hisoblanadi.)
// ─────────────────────────────────────────────────────────────────────────────
export const procurementRequests = pgTable("procurement_requests", {
  id:                  serial("id").primaryKey(),
  requestNumber:       varchar("request_number", { length: 50 }).notNull().unique(),       // PR-2026-00001
  requesterEmployeeId: integer("requester_employee_id").notNull(),                          // ichki ta'minotchi (xodim)
  requesterUserId:     integer("requester_user_id"),
  orgDepartmentId:     integer("org_department_id"),                                        // tasdiq zanjiri uchun
  title:               text("title").notNull(),
  description:         text("description"),
  vendorId:            integer("vendor_id"),                                                // tashqi yetkazuvchi (qo'lda)
  totalAmount:         numericMoney("total_amount").notNull().default(0),
  currency:            varchar("currency", { length: 3 }).notNull().default("UZS"),
  paymentMode:         varchar("payment_mode", { length: 20 }).notNull().default("advance"), // advance/reimburse
  targetWarehouseType: varchar("target_warehouse_type", { length: 40 }),                    // qaysi tur omborga
  status:              varchar("status", { length: 24 }).notNull().default("draft"),
  currentApprovalLevel: integer("current_approval_level").notNull().default(0),
  neededByDate:        varchar("needed_by_date", { length: 10 }),
  rules:               jsonb("rules").notNull().default(sql`'{}'::jsonb`),
  createdBy:           integer("created_by"),
  createdAt:           timestamp("created_at").notNull().defaultNow(),
  updatedAt:           timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("idx_procurement_requests_status").on(t.status),
  index("idx_procurement_requests_requester").on(t.requesterEmployeeId),
  check("procurement_requests_status_chk", sql`${t.status} IN ('draft','pending_approval','approved','rejected','purchasing','received','closed','cancelled')`),
  check("procurement_requests_payment_chk", sql`${t.paymentMode} IN ('advance','reimburse')`),
]);

export const procurementRequestItems = pgTable("procurement_request_items", {
  id:             serial("id").primaryKey(),
  requestId:      integer("request_id").notNull().references(() => procurementRequests.id, { onDelete: "cascade" }),
  materialId:     integer("material_id"),                                  // mavjud material (optional)
  description:    text("description").notNull(),                           // "nima olinadi"
  quantity:       numericMoney("quantity").notNull().default(1),
  unit:           varchar("unit", { length: 20 }).notNull().default("dona"),
  estimatedPrice: numericMoney("estimated_price").notNull().default(0),
  lineTotal:      numericMoney("line_total").notNull().default(0),
  createdAt:      timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_procurement_request_items_request").on(t.requestId),
]);

export const procurementApprovals = pgTable("procurement_approvals", {
  id:              serial("id").primaryKey(),
  requestId:       integer("request_id").notNull().references(() => procurementRequests.id, { onDelete: "cascade" }),
  level:           integer("level").notNull(),                            // 0 = eng yaqin rahbar → yuqori
  orgDepartmentId: integer("org_department_id"),
  approverUserId:  integer("approver_user_id").notNull(),
  status:          varchar("status", { length: 16 }).notNull().default("pending"),
  decidedAt:       timestamp("decided_at"),
  comments:        text("comments"),
  createdAt:       timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_procurement_approvals_request").on(t.requestId),
  index("idx_procurement_approvals_approver").on(t.approverUserId),
  check("procurement_approvals_status_chk", sql`${t.status} IN ('pending','approved','rejected')`),
]);

export type ProcurementRequest = typeof procurementRequests.$inferSelect;
export type ProcurementRequestItem = typeof procurementRequestItems.$inferSelect;
export type ProcurementApproval = typeof procurementApprovals.$inferSelect;


// Warehouse Zones (ombor zonalari)
export const warehouseZones = pgTable("warehouse_zones", {
  id: serial("id").primaryKey(),
  warehouseId: varchar("warehouse_id").notNull().references(() => warehouses.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 50 }).notNull(),
  name: text("name").notNull(),
  nameRu: text("name_ru"),
  zoneType: varchar("zone_type", { length: 30 }).default("storage"), // storage, receiving, shipping, staging, quarantine
  capacity: numericMoney("capacity"), // Sig'im (kv.metr yoki boshqa birlik)
  isActive: boolean("is_active").notNull().default(true),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // --- A7 superset: live-DB columns ---
  type: varchar("type", { length: 30 }),
}, (t) => [
  index("idx_warehouse_zones_warehouse_id").on(t.warehouseId),
  index("idx_warehouse_zones_zone_type").on(t.zoneType),
  check("warehouse_zones_type_chk", sql`${t.zoneType} IS NULL OR ${t.zoneType} IN ('storage','receiving','shipping','staging','quarantine')`),
]);


export const insertWarehouseZoneSchema = createInsertSchema(warehouseZones, {
  code: z.string().min(1, "Kod talab qilinadi"),
  name: z.string().min(2, "Nom kamida 2 ta belgidan iborat bo'lishi kerak"),
  zoneType: z.enum(["storage", "receiving", "shipping", "staging", "quarantine"]).default("storage"),
}).omit({ id: true, createdAt: true } as never);


export type WarehouseZone = typeof warehouseZones.$inferSelect;

export type InsertWarehouseZone = z.infer<typeof insertWarehouseZoneSchema>;


// Warehouse Bins (ombor joylar - tokcha/qator/yacheyka)
export const warehouseBins = pgTable("warehouse_bins", {
  id: varchar("id", { length: 50 }).primaryKey().default(sql`gen_random_uuid()::varchar`),
  warehouseId: varchar("warehouse_id").notNull().references(() => warehouses.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 50 }).notNull(), // Bin kodi (NOT NULL in DB)
  name: text("name"), // Bin nomi
  zoneId: varchar("zone_id"), // Zone ID (varchar, FK to warehouse_zones.id stored as string)
  binCode: varchar("bin_code", { length: 50 }), // Alias for code
  row: varchar("row", { length: 10 }), // Qator (legacy free-text — T8-06 dan keyin rowId FK ishlatilsin)
  shelf: varchar("shelf", { length: 10 }), // Tokcha (legacy free-text — T8-06 dan keyin shelfId FK ishlatilsin)
  level: varchar("level", { length: 10 }), // Daraja
  // --- T8-06: manzil FK-zanjiri Zona→Qator→Javon→Yacheyka (leaf=bin). NULL-able (mavjud qatorlar buzilmaydi). ---
  rowId: integer("row_id"),     // → warehouse_rows.id (Qator), ON DELETE SET NULL
  shelfId: integer("shelf_id"), // → warehouse_shelves.id (Javon), ON DELETE SET NULL
  binType: varchar("bin_type", { length: 30 }).default("standard"), // standard, bulk, cold, hazardous
  maxWeight: numericMoney("max_weight"), // Max og'irlik (kg)
  maxVolume: numericMoney("max_volume"), // Max hajm (litr)
  currentOccupancy: numericMoney("current_occupancy").default(0), // Joriy band bo'lish foizi
  isActive: boolean("is_active").notNull().default(true),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // --- A92: multi-tenant isolation (additive, canonical integer pattern) ---
  tenantId: integer("tenant_id").notNull().default(1),
}, (t) => [
  index("idx_warehouse_bins_warehouse_id").on(t.warehouseId),
  index("idx_warehouse_bins_is_active").on(t.isActive),
  check("warehouse_bins_type_chk", sql`${t.binType} IS NULL OR ${t.binType} IN ('standard','bulk','cold','hazardous')`),
  check("warehouse_bins_occupancy_chk", sql`${t.currentOccupancy} IS NULL OR (${t.currentOccupancy} >= 0 AND ${t.currentOccupancy} <= 100)`),
]);


export const insertWarehouseBinSchema = createInsertSchema(warehouseBins, {
  code: z.string().min(1, "Bin kodi talab qilinadi"),
  binCode: z.string().optional(),
  binType: z.enum(["standard", "bulk", "cold", "hazardous"]).default("standard"),
}).omit({ id: true, createdAt: true } as never);


export type WarehouseBin = typeof warehouseBins.$inferSelect;

export type InsertWarehouseBin = z.infer<typeof insertWarehouseBinSchema>;


// ─────────────────────────────────────────────────────────────────────────────
// T8-06: WMS manzil FK-zanjiri — Qator (warehouse_rows) va Javon (warehouse_shelves).
// To'liq zanjir: warehouses → warehouse_zones (Zona) → warehouse_rows (Qator) →
//   warehouse_shelves (Javon) → warehouse_bins (Yacheyka, leaf; row_id/shelf_id FK).
// Yangi lug'at-jadvallar (bo'sh tug'iladi → FK toza). Egasi/WMS UI to'ldiradi (fabrikatsiya yo'q).
// ─────────────────────────────────────────────────────────────────────────────

// Warehouse Rows (Qator) — Zona ichidagi qatorlar
export const warehouseRows = pgTable("warehouse_rows", {
  id: serial("id").primaryKey(),
  zoneId: integer("zone_id").notNull().references(() => warehouseZones.id, { onDelete: "cascade" }),
  warehouseId: integer("warehouse_id"),
  code: varchar("code", { length: 50 }).notNull(),
  name: text("name"),
  nameRu: text("name_ru"),
  sortOrder: integer("sort_order").notNull().default(0),
  capacity: numericMoney("capacity"),
  isActive: boolean("is_active").notNull().default(true),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  unique("uq_warehouse_rows_zone_code").on(t.zoneId, t.code),
  index("idx_warehouse_rows_zone").on(t.zoneId),
]);

export const insertWarehouseRowSchema = createInsertSchema(warehouseRows, {
  code: z.string().min(1, "Qator kodi talab qilinadi"),
}).omit({ id: true, createdAt: true } as never);

export type WarehouseRow = typeof warehouseRows.$inferSelect;
export type InsertWarehouseRow = z.infer<typeof insertWarehouseRowSchema>;


// Warehouse Shelves (Javon) — Qator ichidagi javonlar
export const warehouseShelves = pgTable("warehouse_shelves", {
  id: serial("id").primaryKey(),
  rowId: integer("row_id").notNull().references(() => warehouseRows.id, { onDelete: "cascade" }),
  zoneId: integer("zone_id"),
  warehouseId: integer("warehouse_id"),
  code: varchar("code", { length: 50 }).notNull(),
  name: text("name"),
  nameRu: text("name_ru"),
  sortOrder: integer("sort_order").notNull().default(0),
  maxWeight: numericMoney("max_weight"),
  maxVolume: numericMoney("max_volume"),
  isActive: boolean("is_active").notNull().default(true),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  unique("uq_warehouse_shelves_row_code").on(t.rowId, t.code),
  index("idx_warehouse_shelves_row").on(t.rowId),
]);

export const insertWarehouseShelfSchema = createInsertSchema(warehouseShelves, {
  code: z.string().min(1, "Javon kodi talab qilinadi"),
}).omit({ id: true, createdAt: true } as never);

export type WarehouseShelf = typeof warehouseShelves.$inferSelect;
export type InsertWarehouseShelf = z.infer<typeof insertWarehouseShelfSchema>;


// Stock Transfers (ombor o'rtasida ko'chirish)
export const stockTransfers = pgTable("stock_transfers", {
  id: serial("id").primaryKey(),
  transferNumber: varchar("transfer_number", { length: 50 }).notNull().unique(),
  transferDate: varchar("transfer_date", { length: 10 }).notNull(), // YYYY-MM-DD
  fromWarehouseId: varchar("from_warehouse_id").notNull().references(() => warehouses.id, { onDelete: "cascade" }),
  toWarehouseId: varchar("to_warehouse_id").notNull().references(() => warehouses.id, { onDelete: "cascade" }),
  fromBinId: varchar("from_bin_id").references(() => warehouseBins.id, { onDelete: "set null" }),
  toBinId: varchar("to_bin_id").references(() => warehouseBins.id, { onDelete: "set null" }),
  status: varchar("status", { length: 20 }).notNull().default("draft"), // draft, pending, in_transit, received, cancelled
  totalItems: integer("total_items").default(0),
  totalValue: numericMoney("total_value").default(0),
  requestedBy: varchar("requested_by").references(() => users.id, { onDelete: "set null" }),
  approvedBy: varchar("approved_by").references(() => users.id, { onDelete: "set null" }),
  shippedBy: varchar("shipped_by").references(() => users.id, { onDelete: "set null" }),
  receivedBy: varchar("received_by").references(() => users.id, { onDelete: "set null" }),
  requestedAt: timestamp("requested_at"),
  approvedAt: timestamp("approved_at"),
  shippedAt: timestamp("shipped_at"),
  receivedAt: timestamp("received_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_stock_transfers_status").on(t.status),
  index("idx_stock_transfers_from_warehouse").on(t.fromWarehouseId),
  index("idx_stock_transfers_to_warehouse").on(t.toWarehouseId),
  index("idx_stock_transfers_created_at").on(t.createdAt),
  check("stock_transfers_status_chk", sql`${t.status} IN ('draft','pending','in_transit','received','cancelled')`),
  check("stock_transfers_total_chk", sql`${t.totalItems} IS NULL OR ${t.totalItems} >= 0`),
]);


export const insertStockTransferSchema = createInsertSchema(stockTransfers, {
  transferDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  status: z.enum(["draft", "pending", "in_transit", "received", "cancelled"]).default("draft"),
}).omit({ id: true, createdAt: true } as never);


export type StockTransfer = typeof stockTransfers.$inferSelect;

export type InsertStockTransfer = z.infer<typeof insertStockTransferSchema>;


// Stock Transfer Lines (ko'chirish qatorlari)
export const stockTransferLines = pgTable("stock_transfer_lines", {
  id: serial("id").primaryKey(),
  transferId: integer("transfer_id").notNull().references(() => stockTransfers.id, { onDelete: "cascade" }),
  materialCardId: integer("material_id").references(() => materialCards.id, { onDelete: "set null" }),
  productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
  itemType: varchar("item_type", { length: 20 }).notNull(), // material, product
  requestedQuantity: numericMoney("requested_quantity").notNull(),
  shippedQuantity: numericMoney("shipped_quantity"),
  receivedQuantity: numericMoney("received_quantity"),
  unitCost: numericMoney("unit_cost").default(0),
  totalCost: numericMoney("total_cost").default(0),
  batchNumber: varchar("batch_number", { length: 50 }), // Partiya raqami
  expiryDate: varchar("expiry_date", { length: 10 }), // Yaroqlilik muddati
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // --- A7 superset: live-DB columns ---
  quantity: numericMoney("quantity"),
  unit: varchar("unit", { length: 20 }),
  status: varchar("status", { length: 20 }),
}, (t) => [
  index("idx_stock_transfer_lines_transfer_id").on(t.transferId),
  check("stock_transfer_lines_type_chk", sql`${t.itemType} IN ('material','product')`),
  check("stock_transfer_lines_qty_chk", sql`${t.requestedQuantity} > 0`),
]);


export const insertStockTransferLineSchema = createInsertSchema(stockTransferLines, {
  itemType: z.enum(["material", "product"]),
  requestedQuantity: z.number().positive("Miqdor musbat bo'lishi kerak"),
}).omit({ id: true, createdAt: true } as never);


export type StockTransferLine = typeof stockTransferLines.$inferSelect;

export type InsertStockTransferLine = z.infer<typeof insertStockTransferLineSchema>;


// Stock Moves (material kirim/chiqim)
export const stockMoves = pgTable("stock_moves", {
  id: serial("id").primaryKey(),
  moveNumber: varchar("move_number", { length: 50 }).notNull().unique(),
  moveDate: varchar("move_date", { length: 10 }).notNull(), // YYYY-MM-DD
  moveType: varchar("move_type", { length: 20 }).notNull(), // in, out, transfer, adjustment
  productId: varchar("product_id").references(() => products.id, { onDelete: "set null" }),
  warehouseId: varchar("warehouse_id").references(() => warehouses.id, { onDelete: "set null" }),
  toWarehouseId: varchar("to_warehouse_id").references(() => warehouses.id, { onDelete: "set null" }), // Ko'chirish uchun
  quantity: numericMoney("quantity").notNull(),
  unitCost: numericMoney("unit_cost"),
  totalCost: numericMoney("total_cost"),
  reference: text("reference"), // Havola (buyurtma, hujjat raqami)
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("stock_moves_type_chk", sql`${t.moveType} IN ('in','out','transfer','adjustment')`),
  check("stock_moves_qty_chk", sql`${t.quantity} > 0`),
]);


export const insertStockMoveSchema = createInsertSchema(stockMoves, {
  moveNumber: z.string().min(1, "Harakat raqami talab qilinadi"),
  moveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  moveType: z.enum(["in", "out", "transfer", "adjustment"]),
  quantity: z.number().positive("Miqdor musbat bo'lishi kerak"),
}).omit({ id: true, createdAt: true } as never);


export type StockMove = typeof stockMoves.$inferSelect;

export type InsertStockMove = z.infer<typeof insertStockMoveSchema>;


// Warehouse Transactions (Ombor tranzaksiyalar)
export const warehouseTransactions = pgTable("warehouse_transactions", {
  id: serial("id").primaryKey(),
  materialCardId: integer("material_id").references(() => materialCards.id, { onDelete: "cascade" }).notNull(),
  transactionDate: varchar("transaction_date", { length: 10 }).notNull(),
  transactionType: varchar("transaction_type", { length: 20 }).notNull(), // kirim, chiqim, return, adjustment
  quantity: numericMoney("quantity").notNull(),
  unitOfMeasure: varchar("unit_of_measure", { length: 20 }).notNull(),
  // Qo'shimcha ma'lumot
  bulim: varchar("bulim", { length: 50 }), // Bo'lim
  responsiblePerson: text("responsible_person"),
  responsibleUserId: integer("responsible_user_id").references(() => users.id, { onDelete: "set null" }),
  documentNumber: varchar("document_number", { length: 50 }),
  // Bog'lanish
  papkaOrderId: varchar("papka_order_id").references(() => papkaOrders.id, { onDelete: "set null" }),
  productionFactId: varchar("production_fact_id").references(() => productionFacts.id, { onDelete: "set null" }),
  // Avto-tavsiya
  isAutoSuggested: boolean("is_auto_suggested").default(false),
  suggestionSource: varchar("suggestion_source", { length: 30 }), // formula_engine, manual
  // Qoldiq
  balanceBefore: numericMoney("balance_before"),
  balanceAfter: numericMoney("balance_after"),
  // Excel source
  excelImportRowId: varchar("excel_import_row_id").references(() => excelImportRows.id, { onDelete: "set null" }),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // --- A7 superset: live-DB columns ---
  warehouseId: varchar("warehouse_id").references(() => warehouses.id, { onDelete: "set null" }),
  itemId: varchar("item_id"),
  type: varchar("type", { length: 20 }),
  referenceId: varchar("reference_id"),
  // --- A92: multi-tenant isolation (additive, canonical integer pattern) ---
  tenantId: integer("tenant_id").notNull().default(1),
}, (t) => [
  check("warehouse_transactions_type_chk", sql`${t.transactionType} IN ('kirim','chiqim','return','adjustment')`),
  check("warehouse_transactions_qty_chk", sql`${t.quantity} > 0`),
  index("idx_warehouse_transactions_tenant_id").on(t.tenantId),
]);


export const insertWarehouseTransactionSchema = createInsertSchema(warehouseTransactions, {
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida"),
  transactionType: z.enum(["kirim", "chiqim", "return", "adjustment"]),
  quantity: z.number().positive("Miqdor musbat bo'lishi kerak"),
}).omit({ id: true, createdAt: true } as never);


export type WarehouseTransaction = typeof warehouseTransactions.$inferSelect;

export type InsertWarehouseTransaction = z.infer<typeof insertWarehouseTransactionSchema>;


export const warehouseStock = pgTable("warehouse_stock", {
  id: serial("id").primaryKey(),
  warehouseId: varchar("warehouse_id").notNull().references(() => warehouses.id, { onDelete: "cascade" }),
  materialCardId: varchar("material_id").notNull().references(() => materialCards.id, { onDelete: "cascade" }),
  quantity: numericMoney("quantity").notNull().default(0),
  reservedQuantity: numericMoney("reserved_quantity").notNull().default(0),
  availableQuantity: numericMoney("available_quantity").notNull().default(0),
  unitOfMeasure: varchar("unit_of_measure", { length: 20 }),
  lastUpdatedAt: timestamp("last_updated_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // --- A7 superset: live-DB columns ---
  reorderPoint: numericMoney("reorder_point"),
  maxStock: numericMoney("max_stock"),
  binLocationId: varchar("bin_location_id"),
  lastMovementAt: timestamp("last_movement_at"),
  itemId: varchar("item_id"),
  updatedAt: timestamp("updated_at"),
  unit: varchar("unit", { length: 20 }),
  // --- A92: multi-tenant isolation (additive, canonical integer pattern) ---
  tenantId: integer("tenant_id").notNull().default(1),
}, (t) => [
  index("idx_warehouse_stock_tenant_id").on(t.tenantId),
]);


export const insertWarehouseStockSchema = createInsertSchema(warehouseStock, {
  quantity: z.number().min(0, "Miqdor 0 dan kam bo'lmasligi kerak"),
  reservedQuantity: z.number().min(0, "Zaxiralangan miqdor 0 dan kam bo'lmasligi kerak"),
}).omit({ id: true, createdAt: true, lastUpdatedAt: true } as never);


export type WarehouseStock = typeof warehouseStock.$inferSelect;

export type InsertWarehouseStock = z.infer<typeof insertWarehouseStockSchema>;


// Daily Warehouse Plans - Ombor kunlik rejasi
export const dailyWarehousePlans = pgTable("daily_warehouse_plans", {
  id: serial("id").primaryKey(),
  planDate: varchar("plan_date", { length: 10 }).notNull(), // YYYY-MM-DD
  // Umumiy statistika
  totalOrders: integer("total_orders").default(0),
  totalKits: integer("total_kits").default(0),
  preparedKits: integer("prepared_kits").default(0),
  deliveredKits: integer("delivered_kits").default(0),
  // Status
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  // pending, in_progress, completed
  preparedBy: varchar("prepared_by").references(() => users.id, { onDelete: "set null" }),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  check("daily_warehouse_plans_status_chk", sql`${t.status} IN ('pending','in_progress','completed')`),
]);


export const insertDailyWarehousePlanSchema = createInsertSchema(dailyWarehousePlans).omit({ id: true, createdAt: true, updatedAt: true } as never);

export type DailyWarehousePlan = typeof dailyWarehousePlans.$inferSelect;

export type InsertDailyWarehousePlan = z.infer<typeof insertDailyWarehousePlanSchema>;


// Barcode Movements — har bir material harakati (GR, GI, Transfer, Return, Scrap, Adjustment)
export const barcodeMovements = pgTable("barcode_movements", {
  id: serial("id").primaryKey(),
  barcodeId: varchar("barcode_id").references(() => materialBarcodes.id, { onDelete: "cascade" }).notNull(),
  movementType: varchar("movement_type", { length: 30 }).notNull(),
  fromLocation: varchar("from_location", { length: 100 }),
  toLocation: varchar("to_location", { length: 100 }),
  fromBinId: varchar("from_bin_id").references(() => warehouseBins.id, { onDelete: "set null" }),
  toBinId: varchar("to_bin_id").references(() => warehouseBins.id, { onDelete: "set null" }),
  quantity: numericMoney("quantity").notNull(),
  uom: varchar("uom", { length: 20 }).notNull(),
  referenceType: varchar("reference_type", { length: 50 }),
  referenceId: varchar("reference_id", { length: 100 }),
  productionOrderId: varchar("production_order_id"),
  movedBy: varchar("moved_by").references(() => users.id, { onDelete: "restrict" }).notNull(),
  scanned: boolean("scanned").default(true),
  scanDevice: varchar("scan_device", { length: 50 }),
  glPosted: boolean("gl_posted").default(false),
  glJournalId: varchar("gl_journal_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("barcode_movements_type_chk", sql`${t.movementType} IN ('GOODS_RECEIPT','PUTAWAY','GOODS_ISSUE','TRANSFER','RETURN','SCRAP','ADJUSTMENT','CYCLE_COUNT','EXIT')`),
  check("barcode_movements_qty_chk", sql`${t.quantity} > 0`),
]);


export const insertBarcodeMovementSchema = createInsertSchema(barcodeMovements, {
  movementType: z.enum(["GOODS_RECEIPT", "PUTAWAY", "GOODS_ISSUE", "TRANSFER", "RETURN", "SCRAP", "ADJUSTMENT", "CYCLE_COUNT", "EXIT"]),
  quantity: z.number().positive("Miqdor musbat bo'lishi kerak"),
}).omit({ id: true, createdAt: true } as never);

export type BarcodeMovement = typeof barcodeMovements.$inferSelect;

export type InsertBarcodeMovement = z.infer<typeof insertBarcodeMovementSchema>;


// Exit Logs — AI kamera + barcode chiqish nazorati
export const exitLogs = pgTable("exit_logs", {
  id: serial("id").primaryKey(),
  personId: varchar("person_id").references(() => users.id, { onDelete: "set null" }),
  personName: varchar("person_name", { length: 200 }),
  aiDetectedObject: boolean("ai_detected_object").default(false),
  objectType: varchar("object_type", { length: 50 }),
  objectSize: varchar("object_size", { length: 20 }),
  aiConfidence: numericMoney("ai_confidence"),
  barcodeScanned: varchar("barcode_scanned", { length: 100 }),
  barcodeValid: boolean("barcode_valid"),
  authorized: boolean("authorized"),
  authorizationType: varchar("authorization_type", { length: 50 }),
  approvedBy: varchar("approved_by").references(() => users.id, { onDelete: "set null" }),
  photoPath: text("photo_path"),
  videoPath: text("video_path"),
  exitAllowed: boolean("exit_allowed"),
  exitTime: timestamp("exit_time").defaultNow(),
  alertLevel: varchar("alert_level", { length: 20 }).default("NONE"),
  securityNotified: boolean("security_notified").default(false),
  gateId: varchar("gate_id", { length: 50 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("exit_logs_alert_level_chk", sql`${t.alertLevel} IS NULL OR ${t.alertLevel} IN ('NONE','GREEN','YELLOW','RED','BLACK')`),
]);


export const insertExitLogSchema = createInsertSchema(exitLogs, {
  alertLevel: z.enum(["NONE", "GREEN", "YELLOW", "RED", "BLACK"]).default("NONE"),
}).omit({ id: true, createdAt: true } as never);

export type ExitLog = typeof exitLogs.$inferSelect;

export type InsertExitLog = z.infer<typeof insertExitLogSchema>;


// Barcode Print Queue — barcode chop etish navbati
export const barcodePrintQueue = pgTable("barcode_print_queue", {
  id: serial("id").primaryKey(),
  barcodeId: varchar("barcode_id").references(() => materialBarcodes.id, { onDelete: "set null" }),
  barcodeData: text("barcode_data").notNull(),
  printerName: varchar("printer_name", { length: 100 }),
  templateName: varchar("template_name", { length: 100 }),
  copies: integer("copies").default(1),
  status: varchar("status", { length: 20 }).notNull().default("PENDING"),
  labelType: varchar("label_type", { length: 30 }),
  printedAt: timestamp("printed_at"),
  errorMessage: text("error_message"),
  requestedBy: varchar("requested_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("barcode_print_queue_status_chk", sql`${t.status} IN ('PENDING','PRINTING','PRINTED','FAILED')`),
  check("barcode_print_queue_copies_chk", sql`${t.copies} IS NULL OR ${t.copies} >= 1`),
]);


export const insertBarcodePrintQueueSchema = createInsertSchema(barcodePrintQueue, {
  status: z.enum(["PENDING", "PRINTING", "PRINTED", "FAILED"]).default("PENDING"),
  labelType: z.enum(["INCOMING", "RETURN", "FINISHED_GOODS", "TRANSFER", "BIN"]).optional(),
}).omit({ id: true, createdAt: true } as never);

export type BarcodePrintQueueItem = typeof barcodePrintQueue.$inferSelect;

export type InsertBarcodePrintQueueItem = z.infer<typeof insertBarcodePrintQueueSchema>;


// Picking Tasks — omborchi uchun material yig'ish topshiriqlari
export const pickingTasks = pgTable("picking_tasks", {
  id: serial("id").primaryKey(),
  taskNumber: varchar("task_number", { length: 50 }).notNull().unique(),
  taskType: varchar("task_type", { length: 20 }).notNull().default("PICK"),
  productionOrderId: varchar("production_order_id"),
  salesOrderId: varchar("sales_order_id"),
  materialCardId: varchar("material_id").references(() => materialCards.id, { onDelete: "set null" }),
  requiredQty: numericMoney("required_qty").notNull(),
  pickedQty: numericMoney("picked_qty").default(0),
  barcodesToPick: jsonb("barcodes_to_pick"),
  pickedBarcodes: jsonb("picked_barcodes"),
  fromBinId: varchar("from_bin_id").references(() => warehouseBins.id, { onDelete: "set null" }),
  toBinId: varchar("to_bin_id").references(() => warehouseBins.id, { onDelete: "set null" }),
  warehouseId: varchar("warehouse_id").references(() => warehouses.id, { onDelete: "set null" }),
  assignedTo: integer("assigned_to").references(() => users.id, { onDelete: "set null" }),
  status: varchar("status", { length: 20 }).notNull().default("PENDING"),
  priority: integer("priority").default(5),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("picking_tasks_status_chk", sql`${t.status} IN ('PENDING','ASSIGNED','IN_PROGRESS','COMPLETED','CANCELLED')`),
  check("picking_tasks_type_chk", sql`${t.taskType} IN ('PICK','PUTAWAY','TRANSFER','CYCLE_COUNT')`),
  check("picking_tasks_qty_chk", sql`${t.requiredQty} > 0`),
]);


export const insertPickingTaskSchema = createInsertSchema(pickingTasks, {
  taskNumber: z.string().min(1, "Topshiriq raqami kerak"),
  taskType: z.enum(["PICK", "PUTAWAY", "TRANSFER", "CYCLE_COUNT"]).default("PICK"),
  requiredQty: z.number().positive("Miqdor musbat bo'lishi kerak"),
  status: z.enum(["PENDING", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).default("PENDING"),
}).omit({ id: true, createdAt: true } as never);

export type PickingTask = typeof pickingTasks.$inferSelect;

export type InsertPickingTask = z.infer<typeof insertPickingTaskSchema>;


// Cycle Count Results — davliy inventarizatsiya natijalari
export const cycleCountResults = pgTable("cycle_count_results", {
  id: serial("id").primaryKey(),
  taskId: varchar("task_id").references(() => pickingTasks.id, { onDelete: "set null" }),
  barcodeId: varchar("barcode_id").references(() => materialBarcodes.id, { onDelete: "set null" }),
  materialCardId: varchar("material_id").references(() => materialCards.id, { onDelete: "set null" }),
  binId: varchar("bin_id").references(() => warehouseBins.id, { onDelete: "set null" }),
  warehouseId: varchar("warehouse_id").references(() => warehouses.id, { onDelete: "set null" }),
  systemQuantity: numericMoney("system_quantity").notNull(),
  countedQuantity: numericMoney("counted_quantity").notNull(),
  variance: numericMoney("variance").notNull(),
  variancePercent: numericMoney("variance_percent").notNull(),
  adjustmentAction: varchar("adjustment_action", { length: 20 }),
  adjustmentApprovedBy: varchar("adjustment_approved_by").references(() => users.id, { onDelete: "set null" }),
  adjustmentApprovedAt: timestamp("adjustment_approved_at"),
  glPosted: boolean("gl_posted").default(false),
  countedBy: varchar("counted_by").references(() => users.id, { onDelete: "restrict" }).notNull(),
  countedAt: timestamp("counted_at").defaultNow(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("cycle_count_results_action_chk", sql`${t.adjustmentAction} IS NULL OR ${t.adjustmentAction} IN ('AUTO_ADJUST','SUPERVISOR_APPROVE','RECOUNT','NONE')`),
  check("cycle_count_results_qty_chk", sql`${t.systemQuantity} >= 0 AND ${t.countedQuantity} >= 0`),
]);


export const insertCycleCountResultSchema = createInsertSchema(cycleCountResults, {
  systemQuantity: z.number().min(0),
  countedQuantity: z.number().min(0),
  adjustmentAction: z.enum(["AUTO_ADJUST", "SUPERVISOR_APPROVE", "RECOUNT", "NONE"]).optional(),
}).omit({ id: true, createdAt: true } as never);

export type CycleCountResult = typeof cycleCountResults.$inferSelect;

export type InsertCycleCountResult = z.infer<typeof insertCycleCountResultSchema>;


// ============================================================================
// FAZA 1A: WAREHOUSE → FINANCE GL POSTING AVTOMATIK TIZIMI
// ============================================================================

export const stockMovementGLPostings = pgTable("stock_movement_gl_postings", {
  id: serial("id").primaryKey(),
  movementType: varchar("movement_type", { length: 50 }).notNull(),
  movementId: varchar("movement_id").notNull(),
  movementNumber: varchar("movement_number"),
  warehouseId: varchar("warehouse_id").references(() => warehouses.id, { onDelete: "set null" }),
  materialId: varchar("material_id"),
  quantity: numericMoney("quantity").notNull(),
  unitCost: numericMoney("unit_cost").notNull().default(0),
  totalAmount: numericMoney("total_amount").notNull().default(0),
  debitAccountCode: varchar("debit_account_code", { length: 20 }).notNull(),
  creditAccountCode: varchar("credit_account_code", { length: 20 }).notNull(),
  glDocumentId: varchar("gl_document_id").references(() => glDocuments.id, { onDelete: "set null" }),
  glPostingStatus: varchar("gl_posting_status", { length: 20 }).notNull().default("pending"),
  errorMessage: text("error_message"),
  costCenterId: varchar("cost_center_id").references(() => costCenters.id, { onDelete: "set null" }),
  profitCenterId: varchar("profit_center_id").references(() => profitCenters.id, { onDelete: "set null" }),
  postedBy: varchar("posted_by").references(() => users.id, { onDelete: "set null" }),
  postedAt: timestamp("posted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("stock_gl_postings_status_chk", sql`${t.glPostingStatus} IN ('pending','posted','failed','skipped')`),
  check("stock_gl_postings_type_chk", sql`${t.movementType} IN ('GOODS_RECEIPT','GOODS_ISSUE','PRODUCTION_RECEIPT','DELIVERY','TRANSFER','ADJUSTMENT','RETURN')`),
]);


export const insertStockMovementGLPostingSchema = createInsertSchema(stockMovementGLPostings, {
  movementType: z.enum(["GOODS_RECEIPT", "GOODS_ISSUE", "PRODUCTION_RECEIPT", "DELIVERY", "TRANSFER", "ADJUSTMENT", "RETURN"]),
  glPostingStatus: z.enum(["pending", "posted", "failed", "skipped"]).default("pending"),
}).omit({ id: true, createdAt: true } as never);

export type StockMovementGLPosting = typeof stockMovementGLPostings.$inferSelect;

export type InsertStockMovementGLPosting = z.infer<typeof insertStockMovementGLPostingSchema>;


export const inventoryValuation = pgTable("inventory_valuation", {
  id: serial("id").primaryKey(),
  warehouseId: varchar("warehouse_id").references(() => warehouses.id, { onDelete: "cascade" }).notNull(),
  materialId: varchar("material_id").notNull(),
  materialName: varchar("material_name", { length: 255 }),
  valuationMethod: varchar("valuation_method", { length: 20 }).notNull().default("MOVING_AVG"),
  currentStock: numericMoney("current_stock").notNull().default(0),
  unitCost: numericMoney("unit_cost").notNull().default(0),
  totalValue: numericMoney("total_value").notNull().default(0),
  currency: varchar("currency", { length: 5 }).notNull().default("UZS"),
  lastMovementDate: timestamp("last_movement_date"),
  periodYear: integer("period_year").notNull(),
  periodMonth: integer("period_month").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("inventory_valuation_method_chk", sql`${t.valuationMethod} IN ('FIFO','MOVING_AVG','STANDARD_COST')`),
  check("inventory_valuation_period_chk", sql`${t.periodMonth} >= 1 AND ${t.periodMonth} <= 12`),
  check("inventory_valuation_stock_chk", sql`${t.currentStock} >= 0`),
]);


export const insertInventoryValuationSchema = createInsertSchema(inventoryValuation, {
  valuationMethod: z.enum(["FIFO", "MOVING_AVG", "STANDARD_COST"]),
}).omit({ createdAt: true } as never);

export type InventoryValuation = typeof inventoryValuation.$inferSelect;

export type InsertInventoryValuation = z.infer<typeof insertInventoryValuationSchema>;

// TZ_08-01: Production Material Balance — ishlab chiqarish jarayonida material harakati
export const productionMaterialBalance = pgTable("production_material_balance", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  papkaOrderId: integer("papka_order_id"),
  machineTaskId: integer("machine_task_id"),
  materialId: varchar("material_id", { length: 100 }).notNull(),
  materialName: varchar("material_name", { length: 255 }).notNull(),
  unit: varchar("unit", { length: 20 }).notNull().default("dona"),
  plannedQty: numericMoney("planned_qty").notNull().default(0),
  takenQty: numericMoney("taken_qty").notNull().default(0),
  usedQty: numericMoney("used_qty").notNull().default(0),
  returnedQty: numericMoney("returned_qty").notNull().default(0),
  wasteQty: numericMoney("waste_qty").notNull().default(0),
  operatorId: varchar("operator_id").references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 20 }).notNull().default("take"), // take | use | return
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProductionMaterialBalanceSchema = createInsertSchema(productionMaterialBalance, {
  action: z.enum(["take", "use", "return"]).default("take"),
}).omit({} as never);

export type ProductionMaterialBalance = typeof productionMaterialBalance.$inferSelect;
export type InsertProductionMaterialBalance = z.infer<typeof insertProductionMaterialBalanceSchema>;

// TZ_08-02: Internal Requests — ichki omborga so'rovlar (Telegram bot integratsiya)
export const internalRequests = pgTable("internal_requests", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  requestNo: varchar("request_no", { length: 50 }).notNull().unique(),
  requestType: varchar("request_type", { length: 30 }).notNull().default("material"), // material | equipment | other
  requesterId: varchar("requester_id").references(() => users.id, { onDelete: "set null" }),
  requesterName: varchar("requester_name", { length: 255 }),
  departmentId: integer("department_id"),
  materialId: varchar("material_id", { length: 100 }),
  materialName: varchar("material_name", { length: 255 }).notNull(),
  quantity: numericMoney("quantity").notNull().default(1),
  unit: varchar("unit", { length: 20 }).notNull().default("dona"),
  urgency: varchar("urgency", { length: 20 }).notNull().default("normal"), // low | normal | high | critical
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending | approved | rejected | issued | cancelled
  notes: text("notes"),
  approvedById: varchar("approved_by_id").references(() => users.id, { onDelete: "set null" }),
  approvedAt: timestamp("approved_at"),
  issuedAt: timestamp("issued_at"),
  telegramMessageId: varchar("telegram_message_id", { length: 100 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  check("internal_requests_type_chk", sql`${t.requestType} IN ('material','equipment','other')`),
  check("internal_requests_urgency_chk", sql`${t.urgency} IN ('low','normal','high','critical')`),
  check("internal_requests_status_chk", sql`${t.status} IN ('pending','approved','rejected','issued','cancelled')`),
  check("internal_requests_qty_chk", sql`${t.quantity} > 0`),
]);

export const insertInternalRequestSchema = createInsertSchema(internalRequests, {
  requestType: z.enum(["material", "equipment", "other"]).default("material"),
  urgency: z.enum(["low", "normal", "high", "critical"]).default("normal"),
  status: z.enum(["pending", "approved", "rejected", "issued", "cancelled"]).default("pending"),
}).omit({} as never);

export type InternalRequest = typeof internalRequests.$inferSelect;
export type InsertInternalRequest = z.infer<typeof insertInternalRequestSchema>;


// ============================================================================
// TZ-11: OMBOR ICHKI IJARA MODULI (Warehouse Internal Rental)
// ============================================================================

// Ijara sozlamalari (Super admin tomonidan belgilanadi)
export const warehouseRentalSettings = pgTable("warehouse_rental_settings", {
  id: serial("id").primaryKey(),
  defaultFreeDays: integer("default_free_days").notNull().default(8),
  defaultDailyRatePerM2: numericMoney("default_daily_rate_per_m2").notNull().default(0),
  excludeWeekends: boolean("exclude_weekends").notNull().default(false),
  customRates: jsonb("custom_rates").default("[]"), // [{managerId, managerName, dailyRate, freeDays}]
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: varchar("updated_by").references(() => users.id, { onDelete: "set null" }),
  // --- A92: multi-tenant isolation (additive, canonical integer pattern) ---
  tenantId: integer("tenant_id").notNull().default(1),
});

export const insertWarehouseRentalSettingsSchema = createInsertSchema(warehouseRentalSettings, {
  defaultFreeDays: z.number().int().min(0).max(365),
  defaultDailyRatePerM2: z.number().min(0),
  excludeWeekends: z.boolean().default(false),
}).omit({} as never);

export type WarehouseRentalSettings = typeof warehouseRentalSettings.$inferSelect;
export type InsertWarehouseRentalSettings = z.infer<typeof insertWarehouseRentalSettingsSchema>;


// ============================================================================
// WMS Sozlamalari (Ombor sozlama-hub) — generic key-value, marketing_settings
// patterniga ko'ra (lib/db/src/schema/marketing-schema.ts:552).
// APPROVED: egasi vizyon-qurish 2026-07-01, FAZA "Sozlama har bo'limda"
// ============================================================================
export const wmsSettings = pgTable("wms_settings", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  category: varchar("category", { length: 100 }).default("general"),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertWmsSettingSchema = createInsertSchema(wmsSettings, {
  key: z.string().min(2),
}).omit({ id: true, updatedAt: true } as never);

export type WmsSetting = typeof wmsSettings.$inferSelect;
export type InsertWmsSetting = z.infer<typeof insertWmsSettingSchema>;


// Ijara yozuvlari — tayyor mahsulot omborda saqlanayotgan har bir buyurtma
export const warehouseRentalRecords = pgTable("warehouse_rental_records", {
  id: serial("id").primaryKey(),
  recordNumber: varchar("record_number", { length: 50 }).notNull().unique(),
  orderId: varchar("order_id").references(() => papkaOrders.id, { onDelete: "set null" }),
  orderNumber: varchar("order_number", { length: 50 }),
  productName: text("product_name").notNull(),
  managerId: integer("manager_id").references(() => users.id, { onDelete: "set null" }),
  managerName: varchar("manager_name", { length: 255 }),
  customerId: varchar("customer_id", { length: 100 }),
  customerName: varchar("customer_name", { length: 255 }),
  warehouseId: varchar("warehouse_id").references(() => warehouses.id, { onDelete: "set null" }),
  warehouseName: varchar("warehouse_name", { length: 255 }),
  areaM2: numericMoney("area_m2").notNull().default(1), // Ishlatilayotgan m²
  admittedDate: varchar("admitted_date", { length: 10 }).notNull(), // YYYY-MM-DD qabul qilingan sana
  freeDays: integer("free_days").notNull().default(8), // Bepul kun soni
  dailyRatePerM2: numericMoney("daily_rate_per_m2").notNull().default(0), // Kunlik tarif (m² uchun)
  totalDays: integer("total_days").notNull().default(0), // Jami o'tgan kunlar
  billableDays: integer("billable_days").notNull().default(0), // To'lanadigan kunlar (totalDays - freeDays, min 0)
  totalAmount: numericMoney("total_amount").notNull().default(0), // areaM2 × billableDays × dailyRatePerM2
  excludeWeekends: boolean("exclude_weekends").notNull().default(false),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active | closed | paid
  notifiedAt: timestamp("notified_at"), // Telegram signal yuborilgan vaqt
  closedDate: varchar("closed_date", { length: 10 }), // Mahsulot olib ketilgan sana
  paidAt: timestamp("paid_at"),
  notes: text("notes"),
  lastCalculatedAt: timestamp("last_calculated_at").defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // --- A92: multi-tenant isolation (additive, canonical integer pattern) ---
  tenantId: integer("tenant_id").notNull().default(1),
}, (t) => [
  check("warehouse_rental_records_status_chk", sql`${t.status} IN ('active','closed','paid')`),
  check("warehouse_rental_records_area_chk", sql`${t.areaM2} > 0`),
  check("warehouse_rental_records_days_chk", sql`${t.totalDays} >= 0 AND ${t.billableDays} >= 0`),
]);

export const insertWarehouseRentalRecordSchema = createInsertSchema(warehouseRentalRecords, {
  areaM2: z.number().min(0.01),
  admittedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD format bo'lishi kerak"),
  freeDays: z.number().int().min(0),
  dailyRatePerM2: z.number().min(0),
  status: z.enum(["active", "closed", "paid"]).default("active"),
}).omit({} as never);

export type WarehouseRentalRecord = typeof warehouseRentalRecords.$inferSelect;
export type InsertWarehouseRentalRecord = z.infer<typeof insertWarehouseRentalRecordSchema>;

