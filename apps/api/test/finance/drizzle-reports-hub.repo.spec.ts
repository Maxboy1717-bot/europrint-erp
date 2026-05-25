/**
 * test/finance/drizzle-reports-hub.repo.spec.ts
 *
 * Unit tests for DrizzleReportsHubRepository.
 */

import { makeDbMock } from '../_setup/drizzle-db-mock';

const kit = makeDbMock();

jest.mock('@shared/db', () => ({
  db: kit.db,
  runQuery: kit.runQuery,
  rawSql: kit.rawSql,
  invoices: { id: 'id', status: 'status' },
  payments: { id: 'id' },
  budgets: { id: 'id', status: 'status' },
  gl_entries: { id: 'id' },
}));

import { DrizzleReportsHubRepository } from '../../src/modules/finance/reports-hub/drizzle-reports-hub.repo';

describe('DrizzleReportsHubRepository', () => {
  let repo: DrizzleReportsHubRepository;

  beforeEach(() => {
    kit.reset();
    repo = new DrizzleReportsHubRepository();
  });

  describe('getSummary', () => {
    it('returns Ok with combined stats when all queries succeed', async () => {
      kit.queueSelect([{ total: 10, paid: 5 }]);
      kit.queueSelect([{ total: 20 }]);
      kit.queueSelect([{ total: 3, approved: 2 }]);
      kit.queueSelect([{ total: 100 }]);
      const r = await repo.getSummary();
      expect(r.ok).toBe(true);
      if (r.ok) {
        const d = r.data as { invoices: { total: number; paid: number }; payments: { total: number }; budgets: { total: number; approved: number }; glEntries: { total: number } };
        expect(d.invoices.total).toBe(10);
        expect(d.invoices.paid).toBe(5);
        expect(d.payments.total).toBe(20);
        expect(d.budgets.approved).toBe(2);
        expect(d.glEntries.total).toBe(100);
      }
    });

    it('returns Ok with zeros when no data', async () => {
      kit.queueSelect([{ total: 0, paid: 0 }]);
      kit.queueSelect([{ total: 0 }]);
      kit.queueSelect([{ total: 0, approved: 0 }]);
      kit.queueSelect([{ total: 0 }]);
      const r = await repo.getSummary();
      expect(r.ok).toBe(true);
      if (r.ok) {
        const d = r.data as { invoices: { total: number } };
        expect(d.invoices.total).toBe(0);
      }
    });

    it('returns Err when any query fails', async () => {
      kit.queueSelect(new Error('db down'));
      const r = await repo.getSummary();
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toContain('db down');
    });

    it('returns Err with default message when error empty', async () => {
      kit.queueSelect(new Error(''));
      const r = await repo.getSummary();
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toBe('Hisobot xulosa topilmadi');
    });
  });
});
