/**
 * @module zod-schemas.spec
 * @description Validation contract for the Zod schemas used across the API.
 * Generates many parameterized cases per schema.
 */

import { z } from 'zod';

// ─── Login DTO ──────────────────────────────────────────────────────────────

const LoginSchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(1),
});

describe('Login DTO Zod schema', () => {
  it.each([
    ['username only', { username: 'u' }, false],
    ['password only', { password: 'p' }, false],
    ['both present', { username: 'u', password: 'p' }, true],
    ['empty username', { username: '', password: 'p' }, false],
    ['empty password', { username: 'u', password: '' }, false],
    ['extra field', { username: 'u', password: 'p', extra: 'x' }, true],
    ['null username', { username: null, password: 'p' }, false],
    ['number username', { username: 123, password: 'p' }, false],
    ['101-char username', { username: 'a'.repeat(101), password: 'p' }, false],
    ['100-char username (boundary)', { username: 'a'.repeat(100), password: 'p' }, true],
  ])('%s', (_, input, ok) => {
    const r = LoginSchema.safeParse(input);
    expect(r.success).toBe(ok);
  });
});

// ─── Change-password DTO ────────────────────────────────────────────────────

const ChangePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string()
    .min(8)
    .regex(/[a-z]/)
    .regex(/[A-Z]/)
    .regex(/\d/)
    .regex(/[^a-zA-Z0-9]/),
});

describe('ChangePassword DTO', () => {
  it.each([
    ['valid', { oldPassword: 'old', newPassword: 'NewStrong1!' }, true],
    ['short new', { oldPassword: 'old', newPassword: 'A1!' }, false],
    ['no lowercase', { oldPassword: 'old', newPassword: 'STRONG1!' }, false],
    ['no uppercase', { oldPassword: 'old', newPassword: 'strong1!' }, false],
    ['no digit', { oldPassword: 'old', newPassword: 'Strong!!' }, false],
    ['no special', { oldPassword: 'old', newPassword: 'Strong11' }, false],
    ['missing old', { newPassword: 'NewStrong1!' }, false],
  ])('%s', (_, input, ok) => {
    expect(ChangePasswordSchema.safeParse(input).success).toBe(ok);
  });
});

// ─── Employee create DTO ────────────────────────────────────────────────────

const EmployeeSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional(),
  phone: z.string().regex(/^\+?\d{9,15}$/).optional(),
  positionId: z.number().int().positive().optional(),
  inn: z.string().regex(/^\d{14}$/).optional(),
});

describe('Employee DTO', () => {
  it.each([
    [{ firstName: 'A', lastName: 'B' }, true],
    [{ firstName: 'A', lastName: 'B', email: 'a@b.com' }, true],
    [{ firstName: 'A', lastName: 'B', email: 'not-email' }, false],
    [{ firstName: '', lastName: 'B' }, false],
    [{ firstName: 'A' }, false],
    [{ firstName: 'A', lastName: 'B', phone: '+998901234567' }, true],
    [{ firstName: 'A', lastName: 'B', phone: 'abc' }, false],
    [{ firstName: 'A', lastName: 'B', positionId: 1 }, true],
    [{ firstName: 'A', lastName: 'B', positionId: 0 }, false],
    [{ firstName: 'A', lastName: 'B', positionId: -1 }, false],
    [{ firstName: 'A', lastName: 'B', positionId: 1.5 }, false],
    [{ firstName: 'A', lastName: 'B', inn: '12345678901234' }, true],
    [{ firstName: 'A', lastName: 'B', inn: '123' }, false],
    [{ firstName: 'a'.repeat(101), lastName: 'B' }, false],
    [{ firstName: 'a'.repeat(100), lastName: 'B' }, true],
  ])('%j', (input, ok) => {
    expect(EmployeeSchema.safeParse(input).success).toBe(ok);
  });
});

// ─── Sales order DTO ────────────────────────────────────────────────────────

const SalesOrderSchema = z.object({
  customerId: z.number().int().positive(),
  lines: z.array(z.object({
    productId: z.number().int().positive(),
    qty: z.number().positive(),
    unitPrice: z.number().nonnegative(),
    discountPct: z.number().min(0).max(100).optional(),
  })).min(1),
  currency: z.enum(['UZS', 'USD', 'EUR', 'RUB']),
});

describe('Sales order DTO', () => {
  const validLine = { productId: 1, qty: 10, unitPrice: 100 };
  it.each([
    [{ customerId: 1, lines: [validLine], currency: 'UZS' as const }, true],
    [{ customerId: 1, lines: [validLine, validLine], currency: 'USD' as const }, true],
    [{ customerId: 0, lines: [validLine], currency: 'UZS' as const }, false],
    [{ customerId: 1, lines: [], currency: 'UZS' as const }, false],
    [{ customerId: 1, lines: [validLine], currency: 'XXX' as 'UZS' }, false],
    [{ customerId: 1, lines: [{ ...validLine, qty: 0 }], currency: 'UZS' as const }, false],
    [{ customerId: 1, lines: [{ ...validLine, qty: -1 }], currency: 'UZS' as const }, false],
    [{ customerId: 1, lines: [{ ...validLine, unitPrice: -1 }], currency: 'UZS' as const }, false],
    [{ customerId: 1, lines: [{ ...validLine, discountPct: 50 }], currency: 'UZS' as const }, true],
    [{ customerId: 1, lines: [{ ...validLine, discountPct: 101 }], currency: 'UZS' as const }, false],
    [{ customerId: 1, lines: [{ ...validLine, discountPct: -1 }], currency: 'UZS' as const }, false],
  ])('%j', (input, ok) => {
    expect(SalesOrderSchema.safeParse(input).success).toBe(ok);
  });
});

// ─── Leave request DTO ──────────────────────────────────────────────────────

const LeaveSchema = z.object({
  employeeId: z.number().int().positive(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(['annual', 'sick', 'unpaid', 'maternity', 'business_trip']),
  reason: z.string().max(500).optional(),
});

describe('Leave request DTO', () => {
  const base = { employeeId: 1, startDate: '2026-01-01', endDate: '2026-01-05', type: 'annual' as const };
  it.each([
    [base, true],
    [{ ...base, employeeId: 0 }, false],
    [{ ...base, startDate: 'Jan 1' }, false],
    [{ ...base, type: 'unknown' as 'annual' }, false],
    [{ ...base, type: 'sick' as const }, true],
    [{ ...base, type: 'maternity' as const }, true],
    [{ ...base, reason: 'family vacation' }, true],
    [{ ...base, reason: 'x'.repeat(501) }, false],
  ])('%j', (input, ok) => {
    expect(LeaveSchema.safeParse(input).success).toBe(ok);
  });
});

// ─── PO DTO ─────────────────────────────────────────────────────────────────

const POSchema = z.object({
  vendorId: z.number().int().positive(),
  expectedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  lines: z.array(z.object({
    materialId: z.number().int().positive(),
    qty: z.number().positive(),
    unitPrice: z.number().positive(),
  })).min(1),
});

describe('PO DTO', () => {
  const line = { materialId: 1, qty: 10, unitPrice: 5 };
  it.each([
    [{ vendorId: 1, expectedDate: '2026-12-01', lines: [line] }, true],
    [{ vendorId: 0, expectedDate: '2026-12-01', lines: [line] }, false],
    [{ vendorId: 1, expectedDate: 'soon', lines: [line] }, false],
    [{ vendorId: 1, expectedDate: '2026-12-01', lines: [] }, false],
    [{ vendorId: 1, expectedDate: '2026-12-01', lines: [{ ...line, qty: -1 }] }, false],
  ])('%j', (input, ok) => {
    expect(POSchema.safeParse(input).success).toBe(ok);
  });
});

// ─── Inspection DTO ─────────────────────────────────────────────────────────

const InspectionSchema = z.object({
  orderId: z.number().int().positive(),
  inspector: z.string().min(1),
  result: z.enum(['pass', 'fail', 'rework']),
  defects: z.array(z.string()).optional(),
  notes: z.string().max(1000).optional(),
});

describe('Inspection DTO', () => {
  const base = { orderId: 1, inspector: 'A', result: 'pass' as const };
  it.each([
    [base, true],
    [{ ...base, result: 'fail' as const }, true],
    [{ ...base, result: 'rework' as const }, true],
    [{ ...base, result: 'partial' as 'pass' }, false],
    [{ ...base, defects: ['scratch', 'dent'] }, true],
    [{ ...base, defects: [] }, true],
    [{ ...base, notes: 'long' }, true],
    [{ ...base, notes: 'x'.repeat(1001) }, false],
    [{ orderId: 0, inspector: 'A', result: 'pass' as const }, false],
  ])('%j', (input, ok) => {
    expect(InspectionSchema.safeParse(input).success).toBe(ok);
  });
});

// ─── Camera event DTO ───────────────────────────────────────────────────────

const CameraEventSchema = z.object({
  cameraId: z.number().int().positive(),
  type: z.enum(['motion', 'fire', 'intrusion', 'safety_violation', 'tamper']),
  ts: z.number().int().nonnegative(),
  frameUrl: z.string().url().optional(),
  confidence: z.number().min(0).max(1).optional(),
});

describe('Camera event DTO', () => {
  const base = { cameraId: 1, type: 'motion' as const, ts: 1000000 };
  it.each([
    [base, true],
    [{ ...base, frameUrl: 'https://example.com/frame.jpg' }, true],
    [{ ...base, frameUrl: 'not-url' }, false],
    [{ ...base, confidence: 0.95 }, true],
    [{ ...base, confidence: 1.5 }, false],
    [{ ...base, confidence: -0.1 }, false],
    [{ ...base, type: 'unknown' as 'motion' }, false],
    [{ ...base, ts: -1 }, false],
    [{ ...base, ts: 1.5 }, false],
  ])('%j', (input, ok) => {
    expect(CameraEventSchema.safeParse(input).success).toBe(ok);
  });
});

// ─── Pagination query DTO ───────────────────────────────────────────────────

const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(1000).optional(),
  sort: z.enum(['asc', 'desc']).optional(),
  search: z.string().max(500).optional(),
});

describe('Pagination query DTO', () => {
  it.each([
    [{}, true],
    [{ page: 1 }, true],
    [{ page: 1, limit: 50 }, true],
    [{ page: '1', limit: '50' }, true],         // coerces
    [{ page: 0 }, false],
    [{ page: -1 }, false],
    [{ limit: 1001 }, false],
    [{ sort: 'asc' as const }, true],
    [{ sort: 'desc' as const }, true],
    [{ sort: 'random' as 'asc' }, false],
    [{ search: 'hello' }, true],
    [{ search: 'x'.repeat(501) }, false],
  ])('%j', (input, ok) => {
    expect(PaginationSchema.safeParse(input).success).toBe(ok);
  });
});
