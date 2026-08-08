/**
 * test/crm/drizzle-lead.repo.spec.ts
 *
 * A5 (EXTENDED-GOVERNANCE-CHECK-2026-07-04): DrizzleLeadRepository.findByCompanyId
 * and findByStatus used to swallow real DB errors into a fake-success
 * { ok: true, data: [] } response (GREEN-LIE) — indistinguishable from a
 * genuinely empty result set. Proves both now return a real Err on DB
 * failure, matching the sibling DrizzleDealRepository convention
 * (drizzle-deal.repo.ts findByCompanyId/findByStatus) and every other
 * method in this same file (save/findById/findByEmail).
 *
 * Strategy: mock @shared/db with the shared chainable-proxy kit (mirrors
 * test/crm/drizzle-crm-leads.repo.spec.ts), so no real DB call is made.
 */

import { makeDbMock } from '../_setup/drizzle-db-mock';

const kit = makeDbMock();

jest.mock('@shared/db', () => ({
  db: kit.db,
  crmLeads: {
    id: 'id',
    deleted_at: 'deleted_at',
    status_description: 'status_description',
  },
}));

import { DrizzleLeadRepository } from '../../src/modules/crm/infrastructure/repositories/drizzle-lead.repo';

describe('DrizzleLeadRepository (A5 green-lie fix)', () => {
  let repo: DrizzleLeadRepository;

  beforeEach(() => {
    kit.reset();
    repo = new DrizzleLeadRepository();
  });

  describe('findByCompanyId', () => {
    it('returns a real Err (not fake empty success) when the DB query throws', async () => {
      kit.queueSelect(new Error('connection terminated unexpectedly'));

      const r = await repo.findByCompanyId(7, 20, 0);

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toContain('connection terminated unexpectedly');
    });

    it('still returns Ok with mapped leads on a real success', async () => {
      kit.queueSelect([
        { id: 1, contact_name: 'Ali Valiyev', status_description: 'new', created_at: '2026-01-01', updated_at: '2026-01-01' },
      ]);

      const r = await repo.findByCompanyId(7, 20, 0);

      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toHaveLength(1);
    });
  });

  describe('findByStatus', () => {
    it('returns a real Err (not fake empty success) when the DB query throws', async () => {
      kit.queueSelect(new Error('conn refused'));

      const r = await repo.findByStatus('qualified', 20, 0);

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toContain('conn refused');
    });

    it('still returns Ok with empty list when genuinely no rows match', async () => {
      kit.queueSelect([]);

      const r = await repo.findByStatus('qualified', 20, 0);

      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });
  });
});
