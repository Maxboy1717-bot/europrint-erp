/**
 * test/finance/finance-invoices-c4-continued.spec.ts
 *
 * C4 continued (CRITICAL-CORRECTNESS-AUDIT-2026-07-06, finding 1.3): finance_invoices had FOUR
 * independent writers, all building `invoice_number` client-side via `Date.now()` (collision-prone
 * under concurrency). drizzle-finance-invoice.repo.ts was already fixed (cc3f8a9d); this covers the
 * remaining three — finance-actions.repository.ts (createApEntry/createArEntry, raw SQL) and
 * finance-ar.repository.ts / finance-ap.repository.ts (createArEntry/createApEntry, Drizzle
 * .insert().values()) — all now generate invoice_number server-side via nextval(invoice_number_seq).
 */

function sqlText(call: unknown): string {
  const chunks = (call as { queryChunks?: unknown[] })?.queryChunks ?? [];
  return chunks
    .map((c) => (c && typeof c === 'object' && 'value' in (c as object) ? (c as { value: string[] }).value.join('') : ''))
    .join(' ');
}

const mockExecute = jest.fn();
const mockValues = jest.fn();
const mockReturning = jest.fn();

jest.mock('@shared/db', () => ({
  db: {
    execute: (...args: unknown[]) => mockExecute(...args),
    insert: () => ({ values: (...args: unknown[]) => { mockValues(...args); return { returning: () => mockReturning() }; } }),
  },
}));
jest.mock('drizzle-orm', () => ({
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({
    queryChunks: strings.flatMap((s, i) => [{ value: [s] }, ...(i < values.length ? [{ value: [String(values[i])] }] : [])]),
  }),
  eq: jest.fn(), and: jest.fn(), ne: jest.fn(), lt: jest.fn(), isNotNull: jest.fn(), desc: jest.fn(),
}));
jest.mock('@shared/db/schema-business-c-2', () => ({ payroll_period_record: { base_salary: 'base_salary' } }));
jest.mock('@shared/db/schema-business-b-1', () => ({ payroll_advances: {} }));
jest.mock('@shared/db/schema-misc-app-a', () => ({ hrEmployees: {} }));
jest.mock('@shared/db/schema-compat-5', () => ({ customer_payments: {} }));

import { FinanceActionsRepository } from '../../src/modules/finance/infrastructure/repositories/finance-actions.repository';
import { FinanceArRepository } from '../../src/modules/finance/infrastructure/repositories/finance-ar.repository';
import { FinanceApRepository } from '../../src/modules/finance/infrastructure/repositories/finance-ap.repository';

const NEXTVAL_EXPR = /nextval\('invoice_number_seq'\)/;
const DATE_NOW_STYLE = /-1[0-9]{12}/; // a raw Date.now() epoch-ms literal, e.g. AP-1781961012000

describe('finance_invoices remaining writers — C4 continued', () => {
  beforeEach(() => {
    mockExecute.mockReset();
    mockValues.mockReset();
    mockReturning.mockReset();
    mockExecute.mockResolvedValue({ rows: [{ id: 1, invoice_number: 'AP-2026-001000' }] });
    mockReturning.mockResolvedValue([{ id: 1, invoice_number: 'AR-2026-001000' }]);
  });

  it('FinanceActionsRepository.createApEntry generates via nextval, not Date.now()', async () => {
    const repo = new FinanceActionsRepository();
    const r = await repo.createApEntry({ amount: 1000, vendorId: 5 });
    expect(r.ok).toBe(true);
    const text = sqlText(mockExecute.mock.calls[0][0]);
    expect(text).toMatch(NEXTVAL_EXPR);
    expect(text).not.toMatch(DATE_NOW_STYLE);
  });

  it('FinanceActionsRepository.createArEntry generates via nextval, not Date.now()', async () => {
    const repo = new FinanceActionsRepository();
    const r = await repo.createArEntry({ amount: 2000, customerId: 7 });
    expect(r.ok).toBe(true);
    const text = sqlText(mockExecute.mock.calls[0][0]);
    expect(text).toMatch(NEXTVAL_EXPR);
    expect(text).not.toMatch(DATE_NOW_STYLE);
  });

  it('FinanceArRepository.createArEntry passes a nextval sql fragment as invoice_number, not a Date.now() string', async () => {
    const repo = new FinanceArRepository();
    const r = await repo.createArEntry({ customerId: '9', amount: 3000, dueDate: null, createdBy: 1 });
    expect(r.ok).toBe(true);
    const insertValues = mockValues.mock.calls[0][0] as { invoice_number: unknown };
    expect(typeof insertValues.invoice_number).not.toBe('string'); // it's a raw sql`` fragment object, not a plain string
    expect(sqlText(insertValues.invoice_number)).toMatch(NEXTVAL_EXPR);
  });

  it('FinanceApRepository.createApEntry passes a nextval sql fragment as invoice_number, not a Date.now() string', async () => {
    const repo = new FinanceApRepository();
    const r = await repo.createApEntry({ vendorId: '11', amount: 4000, dueDate: null, description: null, createdBy: 1 });
    expect(r.ok).toBe(true);
    const insertValues = mockValues.mock.calls[0][0] as { invoice_number: unknown };
    expect(typeof insertValues.invoice_number).not.toBe('string');
    expect(sqlText(insertValues.invoice_number)).toMatch(NEXTVAL_EXPR);
  });
});
