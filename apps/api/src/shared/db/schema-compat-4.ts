import { pgTable, uuid, text, boolean, decimal, integer, createId, ts, stub } from './schema-compat-helpers';
import z from 'zod';


export const logisticsRoutes = stub(pgTable('logistics_routes', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  fromLocation: text('from_location'),
  toLocation: text('to_location'),
  distanceKm: decimal('distance_km', { precision: 8, scale: 2 }),
  estimatedHours: decimal('estimated_hours', { precision: 5, scale: 2 }),
  isActive: boolean('is_active').default(true),
  createdAt: ts('created_at').defaultNow(),
}));

export const iotSensors = stub(pgTable('iot_sensors', {
  id: integer('id').primaryKey(),
  deviceCode: text('device_code').notNull().unique(),
  name: text('name').notNull(),
  location: text('location'),
  type: text('type').notNull(),
  status: text('status').notNull().default('active'),
  lastReadingAt: ts('last_reading_at'),
  thresholds: text('thresholds').default('{}'),
  createdAt: ts('created_at').defaultNow(),
  isActive: boolean('is_active').default(true),
}));

export const designLibraryItems = stub(pgTable('design_library_items', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  fileUrl: text('file_url'),
  thumbnailUrl: text('thumbnail_url'),
  tags: text('tags').default('[]'),
  status: text('status').notNull().default('active'),
  createdBy: text('created_by'),
  createdAt: ts('created_at').defaultNow(),
  deletedAt: ts('deleted_at'),
}));

export const hitlApprovals = stub(pgTable('hitl_approvals', {
  id: integer('id').primaryKey(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  status: text('status').notNull().default('pending'),
  requestedBy: text('requested_by'),
  approvedBy: text('approved_by'),
  notes: text('notes'),
  createdAt: ts('created_at').defaultNow(),
  updatedAt: ts('updated_at').defaultNow(),
}));

export const customerOrders = stub(pgTable('customer_orders', {
  id: integer('id').primaryKey(),
  customerId: text('customer_id'),
  orderNumber: text('order_number').unique(),
  status: text('status').notNull().default('pending'),
  totalAmount: decimal('total_amount', { precision: 18, scale: 2 }),
  total: decimal('total', { precision: 18, scale: 2 }),
  currency: text('currency').default('UZS'),
  notes: text('notes'),
  createdAt: ts('created_at').defaultNow(),
  updatedAt: ts('updated_at').defaultNow(),
  deletedAt: ts('deleted_at'),
  guestName: text('guest_name'),
  guestPhone: text('guest_phone'),
  paymentStatus: text('payment_status'),
}));

export const customerAccounts = stub(pgTable('customer_accounts', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').unique(),
  phone: text('phone'),
  status: text('status').notNull().default('active'),
  creditLimit: decimal('credit_limit', { precision: 18, scale: 2 }).default('0'),
  createdAt: ts('created_at').defaultNow(),
  deletedAt: ts('deleted_at'),
  fullName: text('full_name'),
  companyName: text('company_name'),
  isVerified: boolean('is_verified').default(false),
  passwordHash: text('password_hash'),
  verificationCode: text('verification_code'),
}));

export const publicProducts = stub(pgTable('public_products', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').unique(),
  description: text('description'),
  price: decimal('price', { precision: 18, scale: 2 }),
  categoryId: text('category_id'),
  isActive: boolean('is_active').default(true),
  imageUrl: text('image_url'),
  createdAt: ts('created_at').defaultNow(),
  updatedAt: ts('updated_at').defaultNow(),
  deletedAt: ts('deleted_at'),
  inStock: boolean('in_stock').default(true),
  isFeatured: boolean('is_featured').default(false),
}));

export const websitePages = stub(pgTable('website_pages', {
  id: integer('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  content: text('content'),
  isPublished: boolean('is_published').default(false),
  createdAt: ts('created_at').defaultNow(),
  updatedAt: ts('updated_at').defaultNow(),
  deletedAt: ts('deleted_at'),
}));

export const portfolioItems = stub(pgTable('portfolio_items', {
  id: integer('id').primaryKey(),
  sortOrder: integer('sort_order').default(0),
  title: text('title').notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  categoryId: text('category_id'),
  isPublished: boolean('is_published').default(true),
  createdAt: ts('created_at').defaultNow(),
  deletedAt: ts('deleted_at'),
}));

export const modules = stub(pgTable('lms_modules', {
  id: integer('id').primaryKey(),
  courseId: integer('course_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  orderIndex: integer('order_index').default(0),
  createdAt: ts('created_at').defaultNow(),
}));

export const tests = stub(pgTable('lms_tests', {
  id: integer('id').primaryKey(),
  moduleId: text('module_id'),
  courseId: integer('course_id'),
  title: text('title').notNull(),
  maxScore: integer('max_score').default(100),
  createdAt: ts('created_at').defaultNow(),
}));

export const assignments = stub(pgTable('lms_assignments', {
  id: integer('id').primaryKey(),
  enrollmentId: text('enrollment_id').notNull(),
  userId: integer('user_id'),
  moduleId: text('module_id'),
  status: text('status').notNull().default('pending'),
  score: decimal('score', { precision: 5, scale: 2 }),
  submittedAt: ts('submitted_at'),
  createdAt: ts('created_at').defaultNow(),
  courseId: integer('course_id'),
}));

export const courses = stub(pgTable('courses', {
  id: integer('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category'),
  status: text('status').notNull().default('active'),
  instructorId: text('instructor_id'),
  coverUrl: text('cover_url'),
  createdAt: ts('created_at').defaultNow(),
  updatedAt: ts('updated_at').defaultNow(),
  deletedAt: ts('deleted_at'),
}));

export const mmDeliveries = stub(pgTable('mm_deliveries', {
  id: integer('id').primaryKey(),
  purchaseOrderId: text('purchase_order_id'),
  vendorId: text('vendor_id'),
  status: text('status').notNull().default('pending'),
  deliveredAt: ts('delivered_at'),
  notes: text('notes'),
  createdAt: ts('created_at').defaultNow(),
  updatedAt: ts('updated_at').defaultNow(),
}));

export const sdOrders = stub(pgTable('sd_orders', {
  id: integer('id').primaryKey(),
  orderNumber: text('order_number').unique(),
  customerId: text('customer_id'),
  status: text('status').notNull().default('draft'),
  totalAmount: decimal('total_amount', { precision: 18, scale: 2 }),
  createdBy: text('created_by'),
  createdAt: ts('created_at').defaultNow(),
  updatedAt: ts('updated_at').defaultNow(),
}));

export const productionSessions = stub(pgTable('production_sessions', {
  id: integer('id').primaryKey(),
  productionOrderId: text('production_order_id'),
  sessionId: text('session_id'),
  workCenterId: text('work_center_id'),
  status: text('status').notNull().default('active'),
  startedAt: ts('started_at'),
  endedAt: ts('ended_at'),
  createdAt: ts('created_at').defaultNow(),
}));

export const aiUsageLogs = stub(pgTable('ai_usage_logs', {
  id: integer('id').primaryKey(),
  userId: text('user_id'),
  module: text('module').notNull(),
  action: text('action').notNull(),
  inputTokens: integer('input_tokens').default(0),
  outputTokens: integer('output_tokens').default(0),
  cost: decimal('cost', { precision: 10, scale: 6 }).default('0'),
  model: text('model'),
  status: text('status').notNull().default('success'),
  createdAt: ts('created_at').defaultNow(),
}));

export const approvalRequests = stub(pgTable('approval_requests', {
  id: integer('id').primaryKey(),
  documentType: text('document_type').notNull(),
  documentId: text('document_id').notNull(),
  documentNumber: text('document_number'),
  amount: decimal('amount', { precision: 18, scale: 2 }).default('0'),
  currency: text('currency').default('UZS'),
  status: text('status').notNull().default('pending'),
  requestedBy: text('requested_by').notNull(),
  approvedBy: text('approved_by'),
  approvedAt: ts('approved_at'),
  rejectedBy: text('rejected_by'),
  rejectedAt: ts('rejected_at'),
  notes: text('notes'),
  createdAt: ts('created_at').defaultNow(),
  updatedAt: ts('updated_at').defaultNow(),
}));

export const designOrders = stub(pgTable('design_orders', {
  id: integer('id').primaryKey(),
  salesOrderId: text('sales_order_id'),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('pending'),
  assignedTo: text('assigned_to'),
  files: text('files').default('[]'),
  completedAt: ts('completed_at'),
  createdBy: text('created_by').notNull(),
  createdAt: ts('created_at').defaultNow(),
  updatedAt: ts('updated_at').defaultNow(),
  deletedAt: ts('deleted_at'),
}));

export const stockTransferLines = stub(pgTable('stock_transfer_lines', {
  id: integer('id').primaryKey(),
  transferId: text('transfer_id').notNull(),
  materialId: text('material_id').notNull(),
  quantity: decimal('quantity', { precision: 15, scale: 4 }).notNull(),
  unit: text('unit'),
  status: text('status').notNull().default('pending'),
  createdAt: ts('created_at').defaultNow(),
}));

