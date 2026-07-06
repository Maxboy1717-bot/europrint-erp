/**
 * test/finance/finance-accounting.service.recurring-templates.spec.ts
 *
 * F11 (ACCOUNTING-STANDARDS-AUDIT-2026-07-06): recurring journal entries, minimal viable.
 * createRecurringTemplate() writes a `gl_documents` row (document_type='recurring_template',
 * status='active') — it never posts to `entries` itself. `runQuery` is mocked — no real DB.
 */

const mockRunQuery = jest.fn();
jest.mock('@shared/db', () => ({
  db: {},
  runQuery: (...args: unknown[]) => mockRunQuery(...args),
}));

import { FinanceAccountingService } from '../../src/modules/finance/application/finance-accounting.service';
import type { GlPostingService } from '../../src/modules/finance/domain/services/gl-posting.service';
import type { DrizzleFinanceAccountingRepo } from '../../src/modules/finance/infrastructure/repositories/drizzle-finance-accounting.repo';

const balancedLines = [
  { accountCode: '9400', accountName: "Ma'muriyat xarajatlari", debit: 2000000, credit: 0 },
  { accountCode: '6000', accountName: 'Kreditorlar', debit: 0, credit: 2000000 },
];

describe('FinanceAccountingService — F11 recurring journal entry templates', () => {
  let svc: FinanceAccountingService;

  beforeEach(() => {
    mockRunQuery.mockReset();
    svc = new FinanceAccountingService(
      {} as unknown as DrizzleFinanceAccountingRepo,
      { postJournal: jest.fn() } as unknown as GlPostingService,
    );
  });

  it('inserts a gl_documents row with document_type=recurring_template, status=active', async () => {
    mockRunQuery.mockResolvedValueOnce({ rows: [{ id: 10 }] });

    const result = await svc.createRecurringTemplate(
      { frequency: 'monthly', description: 'Ijaraga oylik to\'lov', lines: balancedLines },
      5,
    );

    expect(result).toMatchObject({ templateId: 10, frequency: 'monthly', status: 'active', totalDebit: 2000000, totalCredit: 2000000 });
    const insertSql = mockRunQuery.mock.calls[0][0];
    const sqlText = (insertSql.queryChunks ?? [])
      .map((c: unknown) => (c && typeof c === 'object' && 'value' in c ? (c as { value: string[] }).value.join('') : ''))
      .join('');
    expect(sqlText).toMatch(/INSERT INTO gl_documents/);
    expect(sqlText).toMatch(/recurring_template/);
    expect(sqlText).toMatch(/'active'/);
  });

  it('rejects an invalid frequency before touching the DB', async () => {
    await expect(
      svc.createRecurringTemplate({ frequency: 'weekly', lines: balancedLines }, 5),
    ).rejects.toThrow(/frequency/i);
    expect(mockRunQuery).not.toHaveBeenCalled();
  });

  it('still enforces double-entry balance for a template, same as a one-off draft', async () => {
    await expect(
      svc.createRecurringTemplate({ frequency: 'monthly', lines: [{ accountCode: '9400', debit: 1000, credit: 0 }] }, 5),
    ).rejects.toThrow(/balans/i);
    expect(mockRunQuery).not.toHaveBeenCalled();
  });

  it('rejects when no lines are supplied', async () => {
    await expect(svc.createRecurringTemplate({ frequency: 'monthly', lines: [] }, 5)).rejects.toThrow();
    expect(mockRunQuery).not.toHaveBeenCalled();
  });
});
