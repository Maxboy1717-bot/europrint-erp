import { pgTable, uuid, varchar, text, boolean, decimal, integer, createId, ts, stub } from './schema-compat-helpers';

export const payrollPeriods = stub(pgTable('payroll_periods', {
  id:              integer('id').primaryKey(),
  periodName:      text('period_name'),
  periodStartDate: text('period_start_date'),
  periodEndDate:   text('period_end_date'),
  calculationDate: text('calculation_date'),
  approvalDate:    text('approval_date'),
  paymentDate:     text('payment_date'),
  status:          text('status').default('open'),
}));

export const payrollRows = stub(pgTable('payroll_rows', {
  id: integer('id').primaryKey(),
  periodId: integer('period_id').notNull(),
  employeeId: text('employee_id').notNull(),
  baseSalary: decimal('base_salary', { precision: 18, scale: 2 }),
  bonus: decimal('bonus', { precision: 18, scale: 2 }).default('0'),
  deductions: decimal('deductions', { precision: 18, scale: 2 }).default('0'),
  netPay: decimal('net_pay', { precision: 18, scale: 2 }),
  status: text('status').notNull().default('draft'),
  createdAt: ts('created_at').defaultNow(),
}));

export const attendance = stub(pgTable('attendance', {
  id: integer('id').primaryKey(),
  employeeId: text('employee_id').notNull(),
  userId: integer('user_id'),
  date: text('date').notNull(),
  checkIn: ts('check_in'),
  checkOut: ts('check_out'),
  status: text('status').notNull().default('present'),
  notes: text('notes'),
  createdAt: ts('created_at').defaultNow(),
}));

export const leaveRequests = stub(pgTable('leave_requests', {
  id: integer('id').primaryKey(),
  userId: integer('user_id'),
  employeeId: text('employee_id').notNull(),
  leaveType: text('leave_type').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  status: text('status').notNull().default('pending'),
  reason: text('reason'),
  approvedBy: text('approved_by'),
  approvedAt: ts('approved_at'),
  createdAt: ts('created_at').defaultNow(),
  updatedAt: ts('updated_at').defaultNow(),
  deletedAt: ts('deleted_at'),
}));

export const departments = stub(pgTable('departments', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').unique(),
  parentId: text('parent_id'),
  managerId: text('manager_id'),
  isActive: boolean('is_active').default(true),
  createdAt: ts('created_at').defaultNow(),
  updatedAt: ts('updated_at').defaultNow(),
}));

export const positions = stub(pgTable('positions', {
  id: integer('id').primaryKey(),
  name: text('name'),
  title: text('title').notNull(),
  departmentId: text('department_id'),
  level: integer('level').default(1),
  isActive: boolean('is_active').default(true),
  createdAt: ts('created_at').defaultNow(),
  updatedAt: ts('updated_at').defaultNow(),
}));

export const positionPermissions = stub(pgTable('position_permissions', {
  id: integer('id').primaryKey(),
  positionId: integer('position_id').notNull(),
  moduleCode: varchar('module_code', { length: 50 }).notNull(),
  accessLevel: varchar('access_level', { length: 20 }).notNull(),
  createdAt: ts('created_at').defaultNow(),
}));

export const budgets = stub(pgTable('budgets', {
  id: integer('id').primaryKey(),
  departmentId: text('department_id'),
  year: integer('year').notNull(),
  month: integer('month'),
  category: text('category').notNull(),
  plannedAmount: decimal('planned_amount', { precision: 18, scale: 2 }).notNull(),
  actualAmount: decimal('actual_amount', { precision: 18, scale: 2 }).default('0'),
  currency: text('currency').default('UZS'),
  status: text('status').notNull().default('active'),
  createdAt: ts('created_at').defaultNow(),
  updatedAt: ts('updated_at').defaultNow(),
  deletedAt: ts('deleted_at'),
}));

export const glDocuments = stub(pgTable('gl_documents', {
  id: integer('id').primaryKey(),
  documentNumber: text('document_number').unique(),
  documentType: text('document_type').notNull(),
  amount: decimal('amount', { precision: 18, scale: 2 }).notNull(),
  currency: text('currency').default('UZS'),
  description: text('description'),
  status: text('status').notNull().default('draft'),
  metadata: text('metadata'),
  postedAt: ts('posted_at'),
  createdBy: text('created_by'),
  createdAt: ts('created_at').defaultNow(),
  updatedAt: ts('updated_at').defaultNow(),
  deletedAt: ts('deleted_at'),
}));

export const accounts = stub(pgTable('accounts', {
  id:          integer('id').primaryKey(),
  code:        text('account_code').notNull().unique(),
  name:        text('account_name').notNull(),
  type:        text('account_type').notNull(),
  parentId:    integer('parent_account_id'),
  isActive:    boolean('is_active').default(true),
  createdAt:   ts('created_at').defaultNow(),
  deletedAt:   ts('deleted_at'),
}));

export const salesInvoices = stub(pgTable('sales_invoices', {
  id: integer('id').primaryKey(),
  invoiceNumber: text('invoice_number').unique(),
  salesOrderId: text('sales_order_id'),
  customerId: text('customer_id'),
  amount: decimal('amount', { precision: 18, scale: 2 }).notNull(),
  paidAmount: decimal('paid_amount', { precision: 18, scale: 2 }).default('0'),
  currency: text('currency').default('UZS'),
  status: text('status').notNull().default('draft'),
  dueDate: ts('due_date'),
  createdAt: ts('created_at').defaultNow(),
  updatedAt: ts('updated_at').defaultNow(),
  deletedAt: ts('deleted_at'),
}));

export const documentSequences = stub(pgTable('document_sequences', {
  id: integer('id').primaryKey(),
  documentType: text('document_type').notNull().unique(),
  prefix: text('prefix'),
  lastNumber: integer('last_number').default(0),
  createdAt: ts('created_at').defaultNow(),
  updatedAt: ts('updated_at').defaultNow(),
  month: integer('month'),
  year: integer('year'),
}));

export const salesOrders = stub(pgTable('sales_orders', {
  id:             integer('id').primaryKey(),
  documentNumber: text('document_number').unique(),
  documentType:   text('document_type'),
  customerId:     text('customer_id'),
  status:         text('status').notNull().default('draft'),
  overallStatus:  text('overall_status'),
  deliveryStatus: text('delivery_status'),
  billingStatus:  text('billing_status'),
  totalAmount:    decimal('total_amount', { precision: 18, scale: 2 }),
  netValue:       decimal('net_value', { precision: 18, scale: 2 }),
  currency:       text('currency').default('UZS'),
  notes:          text('notes'),
  createdBy:      text('created_by'),
  createdAt:      ts('created_at').defaultNow(),
  updatedAt:      ts('updated_at').defaultNow(),
  deletedAt:      ts('deleted_at'),
}));

export const sdLeads = stub(pgTable('sd_leads', {
  id: integer('id').primaryKey(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  company: text('company'),
  email: text('email'),
  phone: text('phone'),
  status: text('status').notNull().default('new'),
  assignedTo: text('assigned_to'),
  createdAt: ts('created_at').defaultNow(),
  updatedAt: ts('updated_at').defaultNow(),
  deletedAt: ts('deleted_at'),
}));

export const purchaseOrders = stub(pgTable('purchase_orders', {
  id: integer('id').primaryKey(),
  orderNumber: text('order_number').unique(),
  vendorId: text('vendor_id'),
  status: text('status').notNull().default('draft'),
  totalAmount: decimal('total_amount', { precision: 18, scale: 2 }),
  currency: text('currency').default('UZS'),
  expectedDelivery: ts('expected_delivery'),
  createdBy: text('created_by'),
  createdAt: ts('created_at').defaultNow(),
  updatedAt: ts('updated_at').defaultNow(),
}));

export const purchaseOrderItems = stub(pgTable('purchase_order_items', {
  id: integer('id').primaryKey(),
  purchaseOrderId: text('purchase_order_id').notNull(),
  materialId: text('material_id'),
  description: text('description'),
  quantity: decimal('quantity', { precision: 15, scale: 4 }).notNull(),
  unit: text('unit'),
  unitPrice: decimal('unit_price', { precision: 18, scale: 2 }),
  totalPrice: decimal('total_price', { precision: 18, scale: 2 }),
  createdAt: ts('created_at').defaultNow(),
}));

export const vendors = stub(pgTable('vendors', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').unique(),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  isActive: boolean('is_active').default(true),
  createdAt: ts('created_at').defaultNow(),
  updatedAt: ts('updated_at').defaultNow(),
}));

export const warehouses = stub(pgTable('warehouses', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').unique(),
  location: text('location'),
  type: text('type').default('main'),
  isActive: boolean('is_active').default(true),
  createdAt: ts('created_at').defaultNow(),
}));

export const warehouseZones = stub(pgTable('warehouse_zones', {
  id: integer('id').primaryKey(),
  warehouseId: integer('warehouse_id').notNull(),
  name: text('name').notNull(),
  code: text('code'),
  type: text('type'),
  createdAt: ts('created_at').defaultNow(),
}));

export const warehouseStock = stub(pgTable('warehouse_stock', {
  id: integer('id').primaryKey(),
  warehouseId: integer('warehouse_id').notNull(),
  materialId: text('material_id').notNull(),
  quantity: decimal('quantity', { precision: 15, scale: 4 }).notNull().default('0'),
  reservedQuantity: decimal('reserved_quantity', { precision: 15, scale: 4 }).default('0'),
  unit: text('unit'),
  updatedAt: ts('updated_at').defaultNow(),
}));

export const materials = stub(pgTable('materials', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').unique(),
  category: text('category'),
  unit: text('unit'),
  unitPrice: decimal('unit_price', { precision: 18, scale: 2 }),
  isActive: boolean('is_active').default(true),
  createdAt: ts('created_at').defaultNow(),
  updatedAt: ts('updated_at').defaultNow(),
  deletedAt: ts('deleted_at'),
}));

export const posMovements = stub(pgTable('pos_movements', {
  id: integer('id').primaryKey(),
  movementTypeId: text('movement_type_id'),
  warehouseId: text('warehouse_id'),
  sourceWarehouseId: text('source_warehouse_id'),
  destinationWarehouseId: text('destination_warehouse_id'),
  status: text('status').notNull().default('draft'),
  createdBy: text('created_by'),
  createdAt: ts('created_at').defaultNow(),
  updatedAt: ts('updated_at').defaultNow(),
  deletedAt: ts('deleted_at'),
}));

export const posMovementTypes = stub(pgTable('pos_movement_types', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').unique(),
  direction: text('direction').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: ts('created_at').defaultNow(),
}));
