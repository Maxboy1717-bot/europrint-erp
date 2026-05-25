/**
 * Unit tests for NotificationSchemaRepository.
 * Single method: ensurePreferencesTables delegates to ddl-migrations helper.
 */

const ensureNotificationTablesMock = jest.fn().mockResolvedValue(undefined);

jest.mock('@common/database/ddl-migrations', () => ({
  ensureNotificationTables: ensureNotificationTablesMock,
}));

import { NotificationSchemaRepository } from '../../src/modules/notifications/infrastructure/notification-schema.repository';

describe('NotificationSchemaRepository', () => {
  let repo: NotificationSchemaRepository;
  beforeEach(() => {
    repo = new NotificationSchemaRepository();
    ensureNotificationTablesMock.mockReset().mockResolvedValue(undefined);
  });

  describe('ensurePreferencesTables', () => {
    it('returns Ok when helper resolves', async () => {
      const r = await repo.ensurePreferencesTables();
      expect(r.ok).toBe(true);
      expect(ensureNotificationTablesMock).toHaveBeenCalledTimes(1);
    });

    it('returns Ok when invoked multiple times (idempotent)', async () => {
      await repo.ensurePreferencesTables();
      const r2 = await repo.ensurePreferencesTables();
      expect(r2.ok).toBe(true);
      expect(ensureNotificationTablesMock).toHaveBeenCalledTimes(2);
    });

    it('returns Err when helper rejects', async () => {
      ensureNotificationTablesMock.mockRejectedValueOnce(new Error('DDL failed'));
      const r = await repo.ensurePreferencesTables();
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toContain('DDL failed');
    });

    it('returns Err when helper rejects with non-Error value', async () => {
      ensureNotificationTablesMock.mockRejectedValueOnce('failure');
      const r = await repo.ensurePreferencesTables();
      expect(r.ok).toBe(false);
    });
  });
});
