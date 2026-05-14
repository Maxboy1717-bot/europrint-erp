/**
 * @module schema-misc-qc
 * @description Source module. See exports for details.
 */

import {
  pgTable, uuid, text, boolean, timestamp, decimal, integer,
  serial, jsonb, index,
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
  parameterName: text('parameter_name').notNull(),
  value: decimal('value', { precision: 12, scale: 4 }),
  unit: text('unit'),
  result: text('result').notNull().default('pending'),
  minValue: decimal('min_value', { precision: 12, scale: 4 }),
  maxValue: decimal('max_value', { precision: 12, scale: 4 }),
  testedBy: text('tested_by'),
  notes: text('notes'),
  testedAt: timestamp('tested_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
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

