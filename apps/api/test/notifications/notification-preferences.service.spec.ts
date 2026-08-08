/**
 * Unit tests for NotificationPreferencesService.
 * Covers default-fallback merging, partial-update merge logic and
 * Err short-circuiting — all real business logic, no live DB (repo is faked).
 */

import { Ok, Err, Result } from '@common/result';
import { NotificationPreferencesService } from '../../src/modules/notifications/application/notification-preferences.service';
import { NotificationPreferencesRepository, NotificationPrefsRow } from '../../src/modules/notifications/infrastructure/repositories/notification-preferences.repository';

const DEFAULTS: NotificationPrefsRow = {
  emailEnabled: true, telegramEnabled: true, pushEnabled: false,
  orderUpdates: true, productionAlerts: true, hrAlerts: true,
  qcAlerts: true, financeAlerts: false, systemAlerts: true,
};

function makeFakeRepo(overrides: Partial<NotificationPreferencesRepository> = {}) {
  return {
    findByUserId: jest.fn(async (): Promise<Result<NotificationPrefsRow | null>> => Ok(null)),
    upsert: jest.fn(async (): Promise<Result<void>> => Ok(undefined)),
    markAllReadByUserId: jest.fn(async () => Ok({ updated: 0 })),
    ...overrides,
  } as unknown as NotificationPreferencesRepository;
}

describe('NotificationPreferencesService', () => {
  describe('getPreferences', () => {
    it('falls back to DEFAULTS when the repo has no saved row', async () => {
      const repo = makeFakeRepo({ findByUserId: jest.fn(async () => Ok(null)) });
      const service = new NotificationPreferencesService(repo);

      const result = await service.getPreferences(7);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual({ userId: 7, ...DEFAULTS });
      }
    });

    it('returns the saved row (not defaults) when one exists', async () => {
      const saved: NotificationPrefsRow = {
        ...DEFAULTS, emailEnabled: false, financeAlerts: true, pushEnabled: true,
      };
      const repo = makeFakeRepo({ findByUserId: jest.fn(async () => Ok(saved)) });
      const service = new NotificationPreferencesService(repo);

      const result = await service.getPreferences(9);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.emailEnabled).toBe(false);
        expect(result.data.financeAlerts).toBe(true);
        expect(result.data.pushEnabled).toBe(true);
        expect(result.data.userId).toBe(9);
      }
    });

    it('propagates repo failure as Err without touching data', async () => {
      const repo = makeFakeRepo({ findByUserId: jest.fn(async () => Err('db down')) });
      const service = new NotificationPreferencesService(repo);

      const result = await service.getPreferences(1);

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.message).toBe('db down');
    });
  });

  describe('updatePreferences', () => {
    it('merges a partial update onto DEFAULTS when no row is saved yet', async () => {
      const upsertSpy = jest.fn(async () => Ok(undefined));
      const repo = makeFakeRepo({
        findByUserId: jest.fn(async () => Ok(null)),
        upsert: upsertSpy,
      });
      const service = new NotificationPreferencesService(repo);

      const result = await service.updatePreferences(5, { emailEnabled: false, pushEnabled: true });

      expect(result.ok).toBe(true);
      if (result.ok) {
        // explicitly-changed fields take effect
        expect(result.data.emailEnabled).toBe(false);
        expect(result.data.pushEnabled).toBe(true);
        // untouched fields keep the DEFAULTS value
        expect(result.data.telegramEnabled).toBe(DEFAULTS.telegramEnabled);
        expect(result.data.hrAlerts).toBe(DEFAULTS.hrAlerts);
        expect(result.data.userId).toBe(5);
      }
      // repo.upsert must receive the fully-merged row, not just the partial diff
      expect(upsertSpy).toHaveBeenCalledWith(5, {
        ...DEFAULTS, emailEnabled: false, pushEnabled: true,
      });
    });

    it('merges a partial update onto the existing saved row (not DEFAULTS)', async () => {
      const existing: NotificationPrefsRow = { ...DEFAULTS, financeAlerts: true, systemAlerts: false };
      const upsertSpy = jest.fn(async () => Ok(undefined));
      const repo = makeFakeRepo({
        findByUserId: jest.fn(async () => Ok(existing)),
        upsert: upsertSpy,
      });
      const service = new NotificationPreferencesService(repo);

      const result = await service.updatePreferences(11, { qcAlerts: false });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.qcAlerts).toBe(false);       // new change
        expect(result.data.financeAlerts).toBe(true);    // preserved from existing row
        expect(result.data.systemAlerts).toBe(false);    // preserved from existing row
      }
      expect(upsertSpy).toHaveBeenCalledWith(11, { ...existing, qcAlerts: false });
    });

    it('short-circuits with Err when findByUserId fails, without calling upsert', async () => {
      const upsertSpy = jest.fn(async () => Ok(undefined));
      const repo = makeFakeRepo({
        findByUserId: jest.fn(async () => Err('read failed')),
        upsert: upsertSpy,
      });
      const service = new NotificationPreferencesService(repo);

      const result = await service.updatePreferences(3, { emailEnabled: false });

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.message).toBe('read failed');
      expect(upsertSpy).not.toHaveBeenCalled();
    });

    it('propagates Err when upsert fails', async () => {
      const repo = makeFakeRepo({
        findByUserId: jest.fn(async () => Ok(null)),
        upsert: jest.fn(async () => Err('write failed')),
      });
      const service = new NotificationPreferencesService(repo);

      const result = await service.updatePreferences(3, { emailEnabled: false });

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.message).toBe('write failed');
    });
  });

  describe('markAllRead', () => {
    it('delegates directly to repo.markAllReadByUserId and returns its Result', async () => {
      const repo = makeFakeRepo({
        markAllReadByUserId: jest.fn(async () => Ok({ updated: 4 })),
      });
      const service = new NotificationPreferencesService(repo);

      const result = await service.markAllRead(42);

      expect(result.ok).toBe(true);
      if (result.ok) expect(result.data.updated).toBe(4);
      expect(repo.markAllReadByUserId).toHaveBeenCalledWith(42);
    });
  });
});
