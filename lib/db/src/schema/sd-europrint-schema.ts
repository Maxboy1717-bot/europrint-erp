import { numericMoney } from "./numeric-money";
import { sql } from "drizzle-orm";
import { serial, pgTable, text, varchar, integer, boolean, timestamp, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { employees } from "./employees";
// NOTE: FK references to quotations, salesOrders, crmCompanies are loose (application-level)
// to avoid circular imports. quotations.id, salesOrders.id, crmCompanies.id are kept as integer without DB-level FK constraint.

// =====================================================================
// EUROPRINT CRM + SAVDO (SD) MODULI — TZ 01
// =====================================================================

// 1. MIJOZLAR (Customers)
export const sdCustomers = pgTable("sd_customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  stir: varchar("stir", { length: 20 }),
  legalAddress: text("legal_address"),
  actualAddress: text("actual_address"),
  segment: varchar("segment", { length: 20 }).notNull().default("new"), // vip, regular, new, potential
  managerId: varchar("manager_id"),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, inactive
  isBlocked: boolean("is_blocked").notNull().default(false),
  blockReason: text("block_reason"),
  creditLimit: numericMoney("credit_limit").default(0),
  openDebt: numericMoney("open_debt").default(0),
  totalOrders: integer("total_orders").default(0),
  totalRevenue: numericMoney("total_revenue").default(0),
  lastOrderDate: varchar("last_order_date", { length: 10 }),
  notes: text("notes"),
  // Link to CRM company (application-level FK — avoids circular import)
  crmCompanyId: integer("crm_company_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSdCustomerSchema = createInsertSchema(sdCustomers, {
  name: z.string().min(2, "Mijoz nomi kerak"),
  segment: z.enum(["vip", "regular", "new", "potential"]).default("new"),
  status: z.enum(["active", "inactive"]).default("active"),
  crmCompanyId: z.number().int().positive().optional().nullable(),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);

export type SdCustomer = typeof sdCustomers.$inferSelect;
export type InsertSdCustomer = z.infer<typeof insertSdCustomerSchema>;

// 2. KONTAKT SHAXSLAR
export const sdContacts = pgTable("sd_contacts", {
  id: serial("id").primaryKey(),
  customerId: varchar("customer_id").notNull().references(() => sdCustomers.id),
  name: text("name").notNull(),
  position: varchar("position", { length: 100 }),
  phone: varchar("phone", { length: 30 }),
  email: varchar("email", { length: 100 }),
  telegram: varchar("telegram", { length: 100 }),
  isPrimary: boolean("is_primary").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSdContactSchema = createInsertSchema(sdContacts, {
  name: z.string().min(2, "Ism kerak"),
}).omit({ id: true, createdAt: true } as never);

export type SdContact = typeof sdContacts.$inferSelect;
export type InsertSdContact = z.infer<typeof insertSdContactSchema>;

// 3. LEEDLAR
export const sdLeads = pgTable("sd_leads", {
  id: serial("id").primaryKey(),
  source: varchar("source", { length: 50 }).notNull().default("other"),
  // phone, telegram, website, mobile, instagram, exhibition, referral, other
  status: varchar("status", { length: 30 }).notNull().default("new"),
  // new, working, quoted, negotiating, won, lost, frozen
  customerId: integer("customer_id").references(() => sdCustomers.id),
  contactName: text("contact_name"),
  contactPhone: varchar("contact_phone", { length: 30 }),
  managerId: integer("manager_id").references(() => employees.id),
  productInterest: text("product_interest"),
  estimatedVolume: numericMoney("estimated_volume"),
  estimatedValue: numericMoney("estimated_value"),
  lostReason: text("lost_reason"),
  nextContactDate: varchar("next_contact_date", { length: 10 }),
  convertedAt: timestamp("converted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSdLeadSchema = createInsertSchema(sdLeads, {
  source: z.enum(["phone", "telegram", "website", "mobile", "instagram", "exhibition", "referral", "other"]).default("other"),
  status: z.enum(["new", "working", "quoted", "negotiating", "won", "lost", "frozen"]).default("new"),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);

export type SdLead = typeof sdLeads.$inferSelect;
export type InsertSdLead = z.infer<typeof insertSdLeadSchema>;

// 4. LEED AKTIVLIGI (muloqot tarixi)
export const sdLeadActivities = pgTable("sd_lead_activities", {
  id: serial("id").primaryKey(),
  leadId: varchar("lead_id").notNull().references(() => sdLeads.id),
  type: varchar("type", { length: 30 }).notNull(), // call, message, meeting, note, status_change
  note: text("note"),
  managerId: varchar("manager_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSdLeadActivitySchema = createInsertSchema(sdLeadActivities, {
  type: z.enum(["call", "message", "meeting", "note", "status_change"]),
}).omit({ id: true, createdAt: true } as never);

export type SdLeadActivity = typeof sdLeadActivities.$inferSelect;
export type InsertSdLeadActivity = z.infer<typeof insertSdLeadActivitySchema>;

// 5. NARX FORMULALARI (super admin — structured, replaces key-value sdPriceSettings)
export const sdPriceFormulas = pgTable("sd_price_formulas", {
  id: serial("id").primaryKey(),

  // Qog'oz narxlari (so'm/m²) — gofrokarton turi bo'yicha
  paperBPrice: numericMoney("paper_b_price").notNull().default(4200),   // B flute
  paperCPrice: numericMoney("paper_c_price").notNull().default(4500),   // C flute
  paperBcPrice: numericMoney("paper_bc_price").notNull().default(5200), // BC flute
  paperEPrice: numericMoney("paper_e_price").notNull().default(3900),   // E flute

  // Bosma narxlari (so'm / 1000 dona)
  print1ColorPrice: numericMoney("print_1color_price").notNull().default(15000),
  print2ColorPrice: numericMoney("print_2color_price").notNull().default(22000),
  print4ColorPrice: numericMoney("print_4color_price").notNull().default(38000),

  // Qo'shimcha ishlov (so'm/m²)
  laminationPrice: numericMoney("lamination_price").notNull().default(3500),
  embossingPrice: numericMoney("embossing_price").notNull().default(2800),
  perforationPrice: numericMoney("perforation_price").notNull().default(1200),

  // Sobit xarajatlar (so'm)
  plateCostPerColor: numericMoney("plate_cost_per_color").notNull().default(250000),
  dieCostNew: numericMoney("die_cost_new").notNull().default(1800000),
  dieCostExisting: numericMoney("die_cost_existing").notNull().default(0),

  // Ish haqi va xizmatlar
  hourlyLaborRate: numericMoney("hourly_labor_rate").notNull().default(25000),
  deliveryBaseCost: numericMoney("delivery_base_cost").notNull().default(50000),

  // Ombor ijara (so'm / m² / kun)
  storageDailyRate: numericMoney("storage_daily_rate").notNull().default(2500),
  storageFreedays: integer("storage_freedays").notNull().default(8),

  // Ustama va soliq
  defaultMarkupPercent: numericMoney("default_markup_percent").notNull().default(35),
  vatRate: numericMoney("vat_rate").notNull().default(12),

  // Meta
  updatedBy: varchar("updated_by"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSdPriceFormulasSchema = createInsertSchema(sdPriceFormulas, {
  paperBPrice: z.number().nonnegative(),
  paperCPrice: z.number().nonnegative(),
  paperBcPrice: z.number().nonnegative(),
  paperEPrice: z.number().nonnegative(),
  defaultMarkupPercent: z.number().min(0).max(200),
  vatRate: z.number().min(0).max(100),
}).omit({ id: true, updatedAt: true } as never);

export type SdPriceFormulas = typeof sdPriceFormulas.$inferSelect;
export type InsertSdPriceFormulas = z.infer<typeof insertSdPriceFormulasSchema>;

// 6. TAKLIFNOMALAR (Quotations)
export const sdQuotations = pgTable("sd_quotations", {
  id: serial("id").primaryKey(),
  quotationNumber: varchar("quotation_number", { length: 30 }).notNull().unique(),
  leadId: varchar("lead_id").references(() => sdLeads.id),
  customerId: varchar("customer_id").references(() => sdCustomers.id),
  managerId: varchar("manager_id"),
  totalPrice: numericMoney("total_price").notNull().default(0),
  costPrice: numericMoney("cost_price").notNull().default(0),
  margin: numericMoney("margin").notNull().default(0),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  // draft, sent, viewed, approved, rejected, expired
  validUntil: varchar("valid_until", { length: 10 }),
  paymentTerms: text("payment_terms"),
  notes: text("notes"),
  sentAt: timestamp("sent_at"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSdQuotationSchema = createInsertSchema(sdQuotations, {
  quotationNumber: z.string().min(1),
  status: z.enum(["draft", "sent", "viewed", "approved", "rejected", "expired"]).default("draft"),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);

export type SdQuotation = typeof sdQuotations.$inferSelect;
export type InsertSdQuotation = z.infer<typeof insertSdQuotationSchema>;

// 7. TAKLIFNOMA SATRLARI
export const sdQuotationItems = pgTable("sd_quotation_items", {
  id: serial("id").primaryKey(),
  quotationId: varchar("quotation_id").notNull().references(() => sdQuotations.id),
  productType: varchar("product_type", { length: 50 }).notNull().default("box"),
  // box, lid, tray, cup, other
  paperType: varchar("paper_type", { length: 50 }),
  thicknessMm: numericMoney("thickness_mm"),
  lengthMm: numericMoney("length_mm"),
  widthMm: numericMoney("width_mm"),
  heightMm: numericMoney("height_mm"),
  printColors: integer("print_colors").default(0),
  lamination: boolean("lamination").default(false),
  perforation: boolean("perforation").default(false),
  specialCoating: boolean("special_coating").default(false),
  isNewDie: boolean("is_new_die").default(false),
  quantity: integer("quantity").notNull(),
  unitPrice: numericMoney("unit_price").notNull().default(0),
  costPrice: numericMoney("cost_price").notNull().default(0),
  paperCost: numericMoney("paper_cost").default(0),
  productionCost: numericMoney("production_cost").default(0),
  printCost: numericMoney("print_cost").default(0),
  deliveryCost: numericMoney("delivery_cost").default(0),
  dieCost: numericMoney("die_cost").default(0),
  setupTimeMinutes: integer("setup_time_minutes").default(15),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSdQuotationItemSchema = createInsertSchema(sdQuotationItems, {
  productType: z.enum(["box", "lid", "tray", "cup", "other"]).default("box"),
  quantity: z.number().int().positive("Miqdor musbat bo'lishi kerak"),
}).omit({ id: true, createdAt: true } as never);

export type SdQuotationItem = typeof sdQuotationItems.$inferSelect;
export type InsertSdQuotationItem = z.infer<typeof insertSdQuotationItemSchema>;

// 8. BUYURTMALAR (Sales Orders)
export const sdOrders = pgTable("sd_orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("order_number", { length: 30 }).notNull().unique(),
  quotationId: varchar("quotation_id").references(() => sdQuotations.id),
  customerId: varchar("customer_id").notNull().references(() => sdCustomers.id),
  managerId: varchar("manager_id"),
  status: varchar("status", { length: 30 }).notNull().default("new"),
  // new | advance_pending | advance_paid | design | technologist | planned | production | quality_check | in_warehouse | delivering | delivered | closed | cancelled
  totalAmount: numericMoney("total_amount").notNull(),
  advancePercent: numericMoney("advance_percent").notNull().default(70),
  advancePaid: numericMoney("advance_paid").notNull().default(0),
  balanceDue: numericMoney("balance_due").notNull().default(0),
  deliveryDate: varchar("delivery_date", { length: 10 }),
  deliveryAddress: text("delivery_address"),
  deliveryType: varchar("delivery_type", { length: 20 }).default("own"),
  // own, external, pickup
  receiverName: text("receiver_name"),
  receiverPhone: varchar("receiver_phone", { length: 30 }),
  specialInstructions: text("special_instructions"),
  cancelReason: text("cancel_reason"),
  cancelledAt: timestamp("cancelled_at"),
  deliveredAt: timestamp("delivered_at"),
  warehouseEntryDate: timestamp("warehouse_entry_date"),
  productionOrderId: varchar("production_order_id"),
  notes: text("notes"),
  version: bigint("version", { mode: "number" }).notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSdOrderSchema = createInsertSchema(sdOrders, {
  orderNumber: z.string().min(1),
  totalAmount: z.number().positive("Summa musbat bo'lishi kerak"),
  status: z.enum(["new", "advance_pending", "advance_paid", "design", "technologist", "planned", "production", "quality_check", "in_warehouse", "delivering", "delivered", "closed", "cancelled"]).default("new"),
  deliveryType: z.enum(["own", "external", "pickup"]).default("own"),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);

export type SdOrder = typeof sdOrders.$inferSelect;
export type InsertSdOrder = z.infer<typeof insertSdOrderSchema>;

// 9. BUYURTMA HOLAT TARIXI
export const sdOrderTimeline = pgTable("sd_order_timeline", {
  id: serial("id").primaryKey(),
  orderId: varchar("order_id").notNull(),
  status: varchar("status", { length: 30 }).notNull(),
  note: text("note"),
  changedBy: varchar("changed_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type SdOrderTimeline = typeof sdOrderTimeline.$inferSelect;

// 10. TO'LOVLAR
export const sdPayments = pgTable("sd_payments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => sdOrders.id),
  customerId: integer("customer_id").notNull().references(() => sdCustomers.id),
  amount: numericMoney("amount").notNull(),
  type: varchar("type", { length: 20 }).notNull(), // advance, balance, partial
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  // pending, paid, overdue, returned
  dueDate: varchar("due_date", { length: 10 }),
  paidDate: varchar("paid_date", { length: 10 }),
  paymentMethod: varchar("payment_method", { length: 30 }),
  overdueDays: integer("overdue_days").default(0),
  notes: text("notes"),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSdPaymentSchema = createInsertSchema(sdPayments, {
  amount: z.number().positive("Summa musbat bo'lishi kerak"),
  type: z.enum(["advance", "balance", "partial"]),
  status: z.enum(["pending", "paid", "overdue", "returned"]).default("pending"),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);

export type SdPayment = typeof sdPayments.$inferSelect;
export type InsertSdPayment = z.infer<typeof insertSdPaymentSchema>;

// 11. OMBOR IJARA (Storage Fees)
export const sdStorageFees = pgTable("sd_storage_fees", {
  id: serial("id").primaryKey(),
  orderId: varchar("order_id").notNull().references(() => sdOrders.id),
  startDate: varchar("start_date", { length: 10 }).notNull(),
  endDate: varchar("end_date", { length: 10 }),
  areaM2: numericMoney("area_m2").notNull().default(1),
  days: integer("days").notNull().default(0),
  freeDays: integer("free_days").notNull().default(8),
  dailyRate: numericMoney("daily_rate").notNull().default(0),
  totalAmount: numericMoney("total_amount").notNull().default(0),
  billed: boolean("billed").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type SdStorageFee = typeof sdStorageFees.$inferSelect;

// 12. SHARTNOMALAR
export const sdContracts = pgTable("sd_contracts", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => sdOrders.id),
  contractNumber: varchar("contract_number", { length: 30 }).notNull().unique(),
  templateType: varchar("template_type", { length: 30 }).default("standard"),
  // standard, longterm, vip, onetime
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  // draft, sent, signed, rejected, expired
  signedAt: timestamp("signed_at"),
  signedIp: varchar("signed_ip", { length: 50 }),
  pdfUrl: text("pdf_url"),
  validUntil: varchar("valid_until", { length: 10 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type SdContract = typeof sdContracts.$inferSelect;

// 13. MENEJER KVOTA (KPI)
export const sdManagerQuotas = pgTable("sd_manager_quotas", {
  id: serial("id").primaryKey(),
  managerId: varchar("manager_id").notNull(),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  quotaAmount: numericMoney("quota_amount").notNull().default(0),
  achievedAmount: numericMoney("achieved_amount").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSdManagerQuotaSchema = createInsertSchema(sdManagerQuotas, {
  year: z.number().int().min(2020).max(2030),
  month: z.number().int().min(1).max(12),
  quotaAmount: z.number().nonnegative(),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);

export type SdManagerQuota = typeof sdManagerQuotas.$inferSelect;
export type InsertSdManagerQuota = z.infer<typeof insertSdManagerQuotaSchema>;
