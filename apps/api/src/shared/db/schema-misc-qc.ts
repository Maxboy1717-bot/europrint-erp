/**
 * @module schema-misc-qc
 * @description Source module. See exports for details.
 */

import {
  pgTable, uuid, text, boolean, timestamp, decimal, integer,
  serial, jsonb, index, date, numeric,
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

export const qc_defects = pgTable('qc_defects', {
  id: uuid('id').primaryKey().$defaultFn(() => createId()),
  inspectionId: uuid('inspection_id'),
  productionOrderId: uuid('production_order_id'),
  workCenterId: uuid('work_center_id'),
  defectCode: text('defect_code').notNull(),
  description: text('description').notNull(),
  severity: text('severity').notNull().default('minor'),
  status: text('status').notNull().default('open'),
  quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull().default('1'),
  unit: text('unit').notNull().default('pcs'),
  reportedBy: text('reported_by').notNull(),
  resolvedBy: text('resolved_by'),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  resolution: text('resolution'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  // QC-birlashtirish (2026-07-02, APPROVED egasi): qc_braks-dan ko'chirilgan brak-maxsus
  // ustunlar -- POST /qc/braks endi ReportDefectCommand CQRS oqimi orqali shu jadvalga yozadi.
  papkaOrderId: integer('papka_order_id'),
  stage: text('stage'),
  costImpact: numeric('cost_impact', { precision: 14, scale: 2 }),
  isReworkable: boolean('is_reworkable'),
  reworked: boolean('reworked'),
  brakDate: date('brak_date'),
  // vision 09-qc#96 (APPROVED owner 2026-07-11 Q-35): setup/priladka braki alohida
  // hisoblansin -- 'production' | 'setup'; mavjud yozuvlar 'production' default oladi.
  wasteCategory: text('waste_category').notNull().default('production'),
});

export const qc_reclamations = pgTable('qc_reclamations', {
  id: uuid('id').primaryKey().$defaultFn(() => createId()),
  customerName: text('customer_name').notNull(),
  customerId: uuid('customer_id'),
  orderId: uuid('order_id'),
  description: text('description').notNull(),
  severity: text('severity').notNull().default('major'),
  status: text('status').notNull().default('open'),
  reportedDate: timestamp('reported_date', { withTimezone: true }).notNull().defaultNow(),
  assignedTo: text('assigned_to'),
  resolution: text('resolution'),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const qc_checkpoints = pgTable('qc_checkpoints', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  stage: text('stage').notNull().default('in_process'),
  standardId: integer('standard_id'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const qc_certificates = pgTable('qc_certificates', {
  id: serial('id').primaryKey(),
  certNumber: text('cert_number').notNull().unique(),
  orderId: integer('order_id'),
  productName: text('product_name'),
  issuedDate: text('issued_date'),
  expiryDate: text('expiry_date'),
  status: text('status').notNull().default('active'),
  notes: text('notes'),
  issuedBy: text('issued_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const qc_lab_tests = pgTable('qc_lab_tests', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id'),
  // Generic one-parameter-per-row model (original shape). parameterName is nullable
  // (owner 2026-07-13: qc-lab-tests-session-model-2026-07-13.sql) because the session
  // model below has 4 simultaneous parameters, not one.
  parameterName: text('parameter_name'),
  value: decimal('value', { precision: 12, scale: 4 }),
  unit: text('unit'),
  result: text('result').notNull().default('pending'),
  minValue: decimal('min_value', { precision: 12, scale: 4 }),
  maxValue: decimal('max_value', { precision: 12, scale: 4 }),
  testedBy: text('tested_by'),
  notes: text('notes'),
  testedAt: timestamp('tested_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  // Lab-test SESSION model (APPROVED: owner schema-approval 2026-07-13, Muslimbek, chat --
  // QC lab-tests session model). Matches LabSection.tsx's real workflow: material identity
  // + 4 simultaneous measurements + operator, recorded as one row. Additive alongside the
  // generic columns above (Q-46) -- migration:
  // qc-lab-tests-session-model-2026-07-13.sql.
  materialName: text('material_name'),
  lotNumber: text('lot_number'),
  grammatura: numeric('grammatura'),
  qalinlik: numeric('qalinlik'),
  bosim: numeric('bosim'),
  namlik: numeric('namlik'),
  operatorName: text('operator_name'),
});

export const qc_parameters = pgTable('qc_parameters', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull().default('general'),
  unit: text('unit'),
  minValue: decimal('min_value', { precision: 12, scale: 4 }),
  maxValue: decimal('max_value', { precision: 12, scale: 4 }),
  targetValue: decimal('target_value', { precision: 12, scale: 4 }),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const qc_spc_data = pgTable('qc_spc_data', {
  id: serial('id').primaryKey(),
  parameterId: integer('parameter_id'),
  value: decimal('value', { precision: 12, scale: 4 }).notNull(),
  orderId: integer('order_id'),
  batchId: text('batch_id'),
  measuredAt: timestamp('measured_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const qc_standards = pgTable('qc_standards', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull().default('general'),
  description: text('description'),
  parameters: jsonb('parameters'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const mm_vendors = pgTable('mm_vendors', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code'),
  contactPerson: text('contact_person'),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  paymentTerms: integer('payment_terms'),
  currency: text('currency'),
  isVatPayer: boolean('is_vat_payer').notNull().default(true), // MM-11 #11.44 -- QQS to'lovchi bayrog'i (migration: mm-vendors-vat-payer-2026-07-11.sql)
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const knowledge_base = pgTable('knowledge_base', {
  id:        uuid('id').primaryKey().defaultRandom(),
  title:     text('title').notNull(),
  titleRu:   text('title_ru').notNull().default(''),
  content:   text('content').notNull().default(''),
  contentRu: text('content_ru').notNull().default(''),
  category:  text('category').notNull().default('other'),
  tags:      jsonb('tags').$type<string[]>().notNull().default([]),
  order:     integer('order').notNull().default(0),
  isActive:  boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const qc_supplier_quality = pgTable('qc_supplier_quality', {
  id: serial('id').primaryKey(),
  vendorId: integer('vendor_id').references(() => mm_vendors.id, { onDelete: 'set null' }),
  receiptId: text('receipt_id'),
  materialId: integer('material_id'),
  batchNumber: text('batch_number'),
  sampleSize: integer('sample_size').notNull().default(0),
  defectsFound: integer('defects_found').notNull().default(0),
  notes: text('notes'),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ──────────────────────────────────────────────────────────────────────────
// defect_catalog — QC nuqson turi katalogi (gofra/offset/silkscreen/flexi/universal).
// Ustunlar AYNAN docs/migration/seed/seed-05-defects.sql (APPROVED owner 2026-06-18)
// dagi INSERT ustunlariga mos. Seed shu jadvalga 25 nuqson yozadi
// (DEF-U-001..004, DEF-G-001..006, DEF-O-001..007, DEF-S-001..003, DEF-F-001..003).
// CREATE TABLE: migrations/p18-d1-defect-catalog.sql (GATED — egasi -- APPROVED: kerak).
// ──────────────────────────────────────────────────────────────────────────
export const defect_catalog = pgTable('defect_catalog', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),                 // DEF-U-001, DEF-G-002 ...
  nameUz: text('name_uz').notNull(),
  nameRu: text('name_ru'),
  direction: text('direction').notNull(),                // universal | gofra | offset | silkscreen | flexi
  severity: text('severity').notNull().default('MINOR'), // CRITICAL | MAJOR | MINOR
  autoReject: boolean('auto_reject').notNull().default(false),
  descriptionUz: text('description_uz'),
  correctiveActionUz: text('corrective_action_uz'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byDirection: index('idx_defect_catalog_direction').on(t.direction),
  bySeverity: index('idx_defect_catalog_severity').on(t.severity),
}));

export type DefectCatalogRow = typeof defect_catalog.$inferSelect;
export type InsertDefectCatalog = typeof defect_catalog.$inferInsert;

// ──────────────────────────────────────────────────────────────────────────
// T8-09 — QC master-data STRUKTURA (4 jadval). APPROVED owner 2026-06-26.
// Hammasi STRUKTURA: ustun + CHECK; QIYMAT egasi-data (Q-40 FABRIKATSIYA TAQIQ).
// CREATE TABLE (boot auto-apply): migrations-drift.ts → T8-09 bloki. SEED YO'Q.
// ──────────────────────────────────────────────────────────────────────────

// (1) Defekt-og'irligi: CRITICAL/MAJOR/MINOR → og'irlik koeffitsienti (sifat-ball).
export const qc_defect_severity_weights = pgTable('qc_defect_severity_weights', {
  id: serial('id').primaryKey(),
  severity: text('severity').notNull().unique(),       // CRITICAL | MAJOR | MINOR
  weight: decimal('weight', { precision: 8, scale: 3 }).notNull(), // egasi-data
  autoReject: boolean('auto_reject').notNull().default(false),
  labelUz: text('label_uz'),
  labelRu: text('label_ru'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// (2) Sort/nav → narx koeffitsienti (GradePricingService o'qiydi).
export const qc_grade_price_coefficients = pgTable('qc_grade_price_coefficients', {
  id: serial('id').primaryKey(),
  grade: text('grade').notNull().unique(),             // first | second | third | scrap
  coefficient: decimal('coefficient', { precision: 6, scale: 4 }).notNull(), // egasi-data
  labelUz: text('label_uz'),
  labelRu: text('label_ru'),
  isSellable: boolean('is_sellable').notNull().default(true),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// (3) Sifat sertifikati shabloni (sertifikat-template).
export const qc_certificate_templates = pgTable('qc_certificate_templates', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  nameUz: text('name_uz').notNull(),
  nameRu: text('name_ru'),
  direction: text('direction').notNull().default('universal'), // universal|gofra|offset|silkscreen|flexi
  bodyTemplate: text('body_template'),                 // {{placeholder}} shablon — egasi-data
  fields: jsonb('fields').$type<unknown[]>().notNull().default([]),
  validityDays: integer('validity_days'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byDirection: index('idx_qc_certificate_templates_direction').on(t.direction),
}));

// (4) AQL konfiguratsiya: material/yo'nalish bo'yicha AQL + tekshiruv darajasi override.
export const qc_aql_config = pgTable('qc_aql_config', {
  id: serial('id').primaryKey(),
  scope: text('scope').notNull().default('global'),    // global|direction|material|product
  scopeRef: text('scope_ref'),
  direction: text('direction'),                        // universal|gofra|offset|silkscreen|flexi (nullable)
  aqlValue: decimal('aql_value', { precision: 4, scale: 2 }).notNull(), // egasi-tanlov (0.65..6.5)
  inspectionLevel: text('inspection_level').notNull().default('II'),    // I | II | III
  notes: text('notes'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byScope: index('idx_qc_aql_config_scope').on(t.scope, t.scopeRef),
}));

export type QcDefectSeverityWeightRow = typeof qc_defect_severity_weights.$inferSelect;
export type QcGradePriceCoefficientRow = typeof qc_grade_price_coefficients.$inferSelect;
export type QcCertificateTemplateRow = typeof qc_certificate_templates.$inferSelect;
export type QcAqlConfigRow = typeof qc_aql_config.$inferSelect;

// Vision 09-qc#35 (APPROVED owner schema-approval 2026-07-11, Q-35): "Tekshiruv o'tkazib yuborish"
// = qc:override audit log. Kunlik 3 / oylik 15 limit created_at bo'yicha hisoblanadi; limitdan
// oshgan override escalated=true bilan yoziladi (direktorga eskalatsiya). Append-only audit.
export const qc_override_log = pgTable('qc_override_log', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  inspectionId: integer('inspection_id'),
  reason: text('reason').notNull(),
  escalated: boolean('escalated').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
