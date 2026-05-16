/**
 * test/director/drizzle-dashboard-svc.repo.spec.ts
 *
 * Unit tests for DrizzleDashboardSvcRepository.
 */

import { makeDbMock } from '../_setup/drizzle-db-mock';

const kit = makeDbMock();

jest.mock('@shared/db', () => ({
  db: kit.db,
  runQuery: kit.runQuery,
  rawSql: kit.rawSql,
}));

jest.mock('@europrint/schemas', () => ({
  users: { id: 'id' },
  sdOrders: { id: 'id' },
  hitlApprovals: { id: 'id', status: 'status' },
}));

import { DrizzleDashboardSvcRepository } from '../../src/modules/director/dashboard/drizzle-dashboard-svc.repo';

describe('DrizzleDashboardSvcRepository', () => {
  let repo: DrizzleDashboardSvcRepository;

  beforeEach(() => {
    kit.reset();
    repo = new DrizzleDashboardSvcRepository();
  });

  describe('countUsers', () => {
    it('returns Ok with user count', async () => {
      kit.queueSelect([{ count: '42' }]);
      const r = await repo.countUsers();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBe(42);
    });

    it('returns Ok with zero when no rows', async () => {
      kit.queueSelect([{ count: '0' }]);
      const r = await repo.countUsers();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBe(0);
    });

    it('returns Ok with zero when count is null', async () => {
      kit.queueSelect([{ count: null }]);
      const r = await repo.countUsers();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBe(0);
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('lost'));
      const r = await repo.countUsers();
      expect(r.ok).toBe(false);
    });
  });

  describe('countOrders', () => {
    it('returns Ok with order count', async () => {
      kit.queueSelect([{ count: '7' }]);
      const r = await repo.countOrders();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBe(7);
    });

    it('returns Ok with zero when no rows', async () => {
      kit.queueSelect([{ count: '0' }]);
      const r = await repo.countOrders();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBe(0);
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('x'));
      const r = await repo.countOrders();
      expect(r.ok).toBe(false);
    });

    it('returns Err with default message when empty error', async () => {
      kit.queueSelect(new Error(''));
      const r = await repo.countOrders();
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toBe('Buyurtmalarni sanashda xatolik');
    });
  });

  describe('countPendingApprovals', () => {
    it('returns Ok with pending count', async () => {
      kit.queueSelect([{ count: '3' }]);
      const r = await repo.countPendingApprovals();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBe(3);
    });

    it('returns Ok with zero when none pending', async () => {
      kit.queueSelect([{ count: '0' }]);
      const r = await repo.countPendingApprovals();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBe(0);
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('boom'));
      const r = await repo.countPendingApprovals();
      expect(r.ok).toBe(false);
    });

    it('returns Err with default message when empty error', async () => {
      kit.queueSelect(new Error(''));
      const r = await repo.countPendingApprovals();
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toBe('Tasdiqlashlarni sanashda xatolik');
    });
  });
});
