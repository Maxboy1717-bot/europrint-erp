/**
 * test/sd/sd-payments.repository.create-debounce.spec.ts
 *
 * C1.2 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): POST /sd/payments had no idempotency mechanism
 * at all — two rapid duplicate submissions (e.g. an accidental double-click) both pass the
 * pre-existing overpay guard (itself a stale-snapshot read) and both INSERT into `payments`,
 * creating two payment rows for what was meant to be one. This is an explicitly PARTIAL
 * mitigation (a short server-side debounce window), not a full fix — a true concurrent
 * double-submit within the same instant still races past this check exactly like it races
 * past the overpay guard; only the accidental-double-click class is caught. A full fix needs a
 * client-generated idempotency key persisted across retries (frontend work, tracked separately).
 *
 * These tests prove: (1) a rapid duplicate keyed on order_id is rejected without ever reaching
 * the INSERT, (2) a different amount/order_id does not falsely collide, (3) an explicit
 * idempotency_key bypasses the debounce check entirely, (4) the customer_id fallback fires when
 * order_id is absent (cash/unlinked payment), (5) a first/only payment always succeeds.
 */

function sqlText(call: unknown): string {
  const chunks = (call as { queryChunks?: unknown[] })?.queryChunks ?? [];
  return chunks
    .map((c) => (c && typeof c === 'object' && 'value' in (c as object) ? (c as { value: string[] }).value.join('') : ''))
    .join(' ');
}

const mockRunQuery = jest.fn();
jest.mock('@shared/db', () => ({ runQuery: (...args: unknown[]) => mockRunQuery(...args), db: {} }));
jest.mock('drizzle-orm', () => ({
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({
    queryChunks: strings.flatMap((s, i) => [{ value: [s] }, ...(i < values.length ? [{ value: [String(values[i])] }] : [])]),
  }),
  SQL: class {}, SQLWrapper: class {},
}));

import { SdPaymentsRepository } from '../../src/modules/sd/infrastructure/repositories/sd-payments.repository';

describe('SdPaymentsRepository.create — C1.2 debounce stopgap', () => {
  let repo: SdPaymentsRepository;

  beforeEach(() => {
    mockRunQuery.mockReset();
    repo = new SdPaymentsRepository();
  });

  it('rejects a rapid duplicate for the same order_id+amount+payment_method within the debounce window', async () => {
    mockRunQuery.mockImplementation(async (call: unknown) => {
      const text = sqlText(call);
      if (text.includes('SELECT 1 FROM payments') && text.includes('order_id = ')) return { rows: [{ '?column?': 1 }] }; // debounce hit
      throw new Error(`Unexpected query (debounce should short-circuit before anything else): ${text}`);
    });

    const result = await repo.create({ order_id: 5, amount: 1000, payment_method: 'cash' });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toMatch(/allaqachon yuborilgan/);
    // must never reach the overpay-guard SELECT or the INSERT once debounced
    expect(mockRunQuery).toHaveBeenCalledTimes(1);
  });

  it('does not collide across different order_id even with the same amount/method', async () => {
    mockRunQuery.mockImplementation(async (call: unknown) => {
      const text = sqlText(call);
      if (text.includes('SELECT 1 FROM payments')) return { rows: [] }; // no debounce hit
      if (text.includes('SELECT') && text.includes('invoice_total')) return { rows: [] }; // no invoice linked
      if (text.includes('INSERT INTO sd_payments')) return { rows: [{ id: 'p1', order_id: 6, amount: '1000' }] };
      throw new Error(`Unexpected query: ${text}`);
    });

    const result = await repo.create({ order_id: 6, amount: 1000, payment_method: 'cash' });
    expect(result.ok).toBe(true);
  });

  it('bypasses the debounce check entirely when an explicit idempotency_key is supplied', async () => {
    const calls: string[] = [];
    mockRunQuery.mockImplementation(async (call: unknown) => {
      const text = sqlText(call);
      calls.push(text);
      if (text.includes('invoice_total')) return { rows: [] };
      if (text.includes('INSERT INTO sd_payments')) return { rows: [{ id: 'p2' }] };
      throw new Error(`Unexpected query: ${text}`);
    });

    const result = await repo.create({ order_id: 7, amount: 1000, payment_method: 'cash', idempotency_key: 'client-key-123' });

    expect(result.ok).toBe(true);
    expect(calls.some((t) => t.includes('SELECT 1 FROM payments'))).toBe(false); // debounce SELECT never ran
  });

  it('falls back to customer_id when order_id is absent (cash/unlinked payment)', async () => {
    mockRunQuery.mockImplementation(async (call: unknown) => {
      const text = sqlText(call);
      if (text.includes('SELECT 1 FROM payments') && text.includes('customer_id = ')) return { rows: [{ '?column?': 1 }] };
      throw new Error(`Unexpected query: ${text}`);
    });

    const result = await repo.create({ customer_id: 42, amount: 250, payment_method: 'card' });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toMatch(/allaqachon yuborilgan/);
  });

  it('succeeds for a first/only payment with no prior duplicate', async () => {
    mockRunQuery.mockImplementation(async (call: unknown) => {
      const text = sqlText(call);
      if (text.includes('SELECT 1 FROM payments')) return { rows: [] };
      if (text.includes('invoice_total')) return { rows: [] };
      if (text.includes('INSERT INTO sd_payments')) return { rows: [{ id: 'p3', order_id: 8, amount: '500' }] };
      throw new Error(`Unexpected query: ${text}`);
    });

    const result = await repo.create({ order_id: 8, amount: 500, payment_method: 'bank_transfer' });
    expect(result.ok).toBe(true);
  });

  it('skips the debounce check when both order_id and customer_id are absent', async () => {
    mockRunQuery.mockImplementation(async (call: unknown) => {
      const text = sqlText(call);
      if (text.includes('SELECT 1 FROM payments')) throw new Error('debounce SELECT should not run with no natural key');
      if (text.includes('invoice_total')) return { rows: [] };
      if (text.includes('INSERT INTO sd_payments')) return { rows: [{ id: 'p4' }] };
      throw new Error(`Unexpected query: ${text}`);
    });

    const result = await repo.create({ amount: 100, payment_method: 'cash' });
    expect(result.ok).toBe(true);
  });
});
