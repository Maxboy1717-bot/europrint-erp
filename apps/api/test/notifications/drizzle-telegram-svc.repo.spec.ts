/**
 * test/notifications/drizzle-telegram-svc.repo.spec.ts
 *
 * Unit tests for DrizzleTelegramSvcRepository.
 */

import { makeDbMock } from '../_setup/drizzle-db-mock';

const kit = makeDbMock();

jest.mock('@shared/db', () => ({
  db: kit.db,
  runQuery: kit.runQuery,
  rawSql: kit.rawSql,
}));

jest.mock('@europrint/schemas', () => ({
  notifications: {
    id: 'id', userId: 'userId', title: 'title',
    message: 'message', type: 'type', isRead: 'isRead',
  },
}));

import { DrizzleTelegramSvcRepository } from '../../src/modules/notifications/telegram/drizzle-telegram-svc.repo';

describe('DrizzleTelegramSvcRepository', () => {
  let repo: DrizzleTelegramSvcRepository;

  beforeEach(() => {
    kit.reset();
    repo = new DrizzleTelegramSvcRepository();
  });

  describe('insertNotification', () => {
    it('returns Ok with inserted row', async () => {
      kit.queueInsert([{ id: 1, title: 'Hello' }]);
      const r = await repo.insertNotification({
        userId: 7, title: 'Hello', message: 'Body',
        type: 'info', read: false,
      });
      expect(r.ok).toBe(true);
    });

    it('returns Err when insert throws', async () => {
      kit.queueInsert(new Error('dup'));
      const r = await repo.insertNotification({
        userId: 1, title: 't', message: 'b', type: 'info', read: false,
      });
      expect(r.ok).toBe(false);
    });

    it('returns Err with default message when empty error', async () => {
      kit.queueInsert(new Error(''));
      const r = await repo.insertNotification({
        userId: 1, title: 't', message: 'b', type: 'info', read: false,
      });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toBe("Xabarnoma qo'shishda xatolik");
    });

    it('passes through read flag from dto', async () => {
      kit.queueInsert([{ id: 2, isRead: true }]);
      const r = await repo.insertNotification({
        userId: 1, title: 't', message: 'b', type: 'info', read: true,
      });
      expect(r.ok).toBe(true);
    });
  });

  describe('countAll', () => {
    it('returns Ok with count of notifications', async () => {
      kit.queueSelect([{ id: 1 }, { id: 2 }, { id: 3 }]);
      const r = await repo.countAll();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBe(3);
    });

    it('returns Ok with zero when no notifications', async () => {
      kit.queueSelect([]);
      const r = await repo.countAll();
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBe(0);
    });

    it('returns Err on db failure', async () => {
      kit.queueSelect(new Error('x'));
      const r = await repo.countAll();
      expect(r.ok).toBe(false);
    });

    it('returns Err with default message when empty error', async () => {
      kit.queueSelect(new Error(''));
      const r = await repo.countAll();
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toBe('Xabarnomalar sanashda xatolik');
    });
  });
});
