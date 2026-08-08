/**
 * test/finance/ap-aging.handler.spec.ts
 *
 * Unit tests for ApAgingHandler. Mirrors ar-aging.handler.spec.ts's mocking pattern
 * (shared runQuery helper mocked to avoid real DB access). No CFO config / ECL — AP has none.
 *
 * F4 (ACCOUNTING-STANDARDS-AUDIT-2026-07-06): this handler previously read the legacy
 * `fi_invoices` view (over `invoices`), which understated AR by ~85M and showed AP as
 * near-zero — a completely disconnected invoice source from the canonical `finance_invoices`
 * table. Now reads `finance_invoices` (payment_status/invoice_type columns, invoice_type='purchase').
 * This file didn't exist before F4; added since the handler had zero prior test coverage.
 */

jest.mock('@shared/db', () => ({ runQuery: jest.fn() }));

import { Test, TestingModule } from '@nestjs/testing';
import { runQuery } from '@shared/db';
import { ApAgingHandler, ApAgingQuery } from '../../src/modules/finance/application/queries/ap-aging.handler';

async function buildHandler(): Promise<ApAgingHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [ApAgingHandler],
  }).compile();
  return module.get(ApAgingHandler);
}

describe('ApAgingHandler', () => {
  beforeEach(() => {
    (runQuery as jest.Mock).mockReset();
  });

  it('returns zero totals when no outstanding payables exist', async () => {
    (runQuery as jest.Mock).mockResolvedValue({ rows: [] });
    const handler = await buildHandler();

    const result = await handler.execute(new ApAgingQuery());

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.totalAp).toBe(0);
  });

  it('aggregates buckets by SQL grouping result', async () => {
    (runQuery as jest.Mock).mockResolvedValue({
      rows: [
        { bucket: '0-30', invoice_count: 1, remaining: 2_000_000 },
        { bucket: '90+', invoice_count: 1, remaining: 500_000 },
      ],
    });
    const handler = await buildHandler();

    const result = await handler.execute(new ApAgingQuery());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.totalAp).toBe(2_500_000);
      expect(result.data.current.amount).toBe(2_000_000);
      expect(result.data.ninetyDaysPlus.amount).toBe(500_000);
    }
  });

  it('calculates percentage split summing to 100 when AP is positive', async () => {
    (runQuery as jest.Mock).mockResolvedValue({
      rows: [
        { bucket: '0-30', invoice_count: 1, remaining: 1_000_000 },
        { bucket: '31-60', invoice_count: 1, remaining: 1_000_000 },
      ],
    });
    const handler = await buildHandler();

    const result = await handler.execute(new ApAgingQuery());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.current.percentage).toBe(50);
      expect(result.data.thirtyDays.percentage).toBe(50);
    }
  });

  it('queries the canonical finance_invoices table, not the legacy fi_invoices view', async () => {
    (runQuery as jest.Mock).mockResolvedValue({ rows: [] });
    const handler = await buildHandler();

    await handler.execute(new ApAgingQuery());

    const sqlCall = (runQuery as jest.Mock).mock.calls[0][0];
    const sqlText = (sqlCall.queryChunks ?? [])
      .map((c: unknown) => (c && typeof c === 'object' && 'value' in c ? (c as { value: string[] }).value.join('') : ''))
      .join('');
    expect(sqlText).toMatch(/finance_invoices/);
    expect(sqlText).not.toMatch(/\bfi_invoices\b/);
  });
});
