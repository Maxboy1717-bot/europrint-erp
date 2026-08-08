/**
 * test/finance/drizzle-finance-invoice.repo.invoice-number.spec.ts
 *
 * C4 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): saveInvoice() previously trusted a caller-supplied
 * `invoice_number` (both live callers built `INV-${Date.now()}`, collision-prone). It now ALWAYS
 * generates the number server-side via the `invoice_number_seq` sequence, regardless of what the
 * caller passes.
 */

function sqlText(call: unknown): string {
  const chunks = (call as { queryChunks?: unknown[] })?.queryChunks ?? [];
  return chunks
    .map((c) => (c && typeof c === 'object' && 'value' in (c as object) ? (c as { value: string[] }).value.join('') : ''))
    .join(' ');
}

const mockRunQuery = jest.fn();
jest.mock('@shared/db', () => ({
  runQuery: (...args: unknown[]) => mockRunQuery(...args),
  db: {},
}));
jest.mock('drizzle-orm', () => ({
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({
    queryChunks: strings.flatMap((s, i) => [{ value: [s] }, ...(i < values.length ? [{ value: [String(values[i])] }] : [])]),
  }),
}));

import { FinanceInvoiceRepo } from '../../src/modules/finance/infrastructure/repositories/drizzle-finance-invoice.repo';

describe('FinanceInvoiceRepo.saveInvoice() — C4 sequence-based invoice_number', () => {
  let repo: FinanceInvoiceRepo;

  beforeEach(() => {
    mockRunQuery.mockReset();
    repo = new FinanceInvoiceRepo();
    mockRunQuery.mockResolvedValue({ rows: [{ id: 1, invoice_number: 'INV-2026-001000' }] });
  });

  it('generates invoice_number via nextval(invoice_number_seq), ignoring any caller-supplied value', async () => {
    const result = await repo.saveInvoice({
      customer_id: 1,
      invoice_number: `INV-${Date.now()}`, // caller-supplied — must be ignored
      total_amount: 1000,
    });

    expect(result.ok).toBe(true);
    const insertText = sqlText(mockRunQuery.mock.calls[0][0]);
    expect(insertText).toMatch(/INSERT INTO finance_invoices/);
    expect(insertText).toMatch(/nextval\('invoice_number_seq'\)/);
    expect(insertText).not.toMatch(/INV-1[0-9]{12}/); // no raw Date.now()-style literal reached the query
  });

  it('returns the DB-generated invoice_number from RETURNING *, not a client-computed one', async () => {
    const result = await repo.saveInvoice({ customer_id: 2, total_amount: 500 });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data['invoice_number']).toBe('INV-2026-001000');
  });
});
