/**
 * test/_setup/factories.ts
 *
 * Typed factories for the most common entities. Each factory returns a fresh
 * object with sensible defaults; pass an overrides object to customize. These
 * are POJOs only — they don't write to the DB.
 */

let _seq = 1;
function nextId(): number {
  _seq += 1;
  return _seq;
}

export interface EmployeeRecord {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  positionId: number | null;
  departmentId: number | null;
  isActive: boolean;
  createdAt: Date;
}

export function employeeFactory(overrides: Partial<EmployeeRecord> = {}): EmployeeRecord {
  const id = overrides.id ?? nextId();
  return {
    id,
    firstName: `First${id}`,
    lastName: `Last${id}`,
    email: `employee${id}@europrint.test`,
    positionId: null,
    departmentId: null,
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

export interface SalesOrderRecord {
  id: number;
  customerId: number;
  status: 'draft' | 'released' | 'completed' | 'cancelled';
  totalAmount: string; // numericMoney string
  currency: string;
  createdAt: Date;
}

export function salesOrderFactory(overrides: Partial<SalesOrderRecord> = {}): SalesOrderRecord {
  return {
    id: overrides.id ?? nextId(),
    customerId: overrides.customerId ?? nextId(),
    status: 'draft',
    totalAmount: '1000.0000',
    currency: 'UZS',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

export interface InvoiceRecord {
  id: number;
  vendorId: number;
  amount: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  dueDate: Date;
}

export function invoiceFactory(overrides: Partial<InvoiceRecord> = {}): InvoiceRecord {
  return {
    id: overrides.id ?? nextId(),
    vendorId: overrides.vendorId ?? nextId(),
    amount: '500.0000',
    status: 'pending',
    dueDate: new Date('2026-06-01T00:00:00Z'),
    ...overrides,
  };
}

export interface PosTransactionRecord {
  id: number;
  cashierId: number;
  total: string;
  lines: Array<{ productId: number; qty: number; price: string }>;
  status: 'open' | 'closed' | 'voided';
  createdAt: Date;
}

export function posTxFactory(overrides: Partial<PosTransactionRecord> = {}): PosTransactionRecord {
  return {
    id: overrides.id ?? nextId(),
    cashierId: overrides.cashierId ?? nextId(),
    total: '100.0000',
    lines: [{ productId: nextId(), qty: 1, price: '100.0000' }],
    status: 'open',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

export interface BatchRecord {
  batchId: number;
  batchNumber: string;
  warehouseId: number;
  availableQty: number;
  unitPrice: number;
  expiryDate: string | null;
  receivedDate: string;
}

export function batchFactory(overrides: Partial<BatchRecord> = {}): BatchRecord {
  const id = overrides.batchId ?? nextId();
  return {
    batchId: id,
    batchNumber: `BATCH-${id}`,
    warehouseId: overrides.warehouseId ?? 10,
    availableQty: 100,
    unitPrice: 5.0,
    expiryDate: null,
    receivedDate: '2026-01-01',
    ...overrides,
  };
}
