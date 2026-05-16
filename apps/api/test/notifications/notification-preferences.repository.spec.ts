/**
 * Unit tests for NotificationPreferencesRepository.
 * Covers findByUserId, upsert, markAllReadByUserId. No real DB.
 */

import { makeDbChain } from '../_setup/db-mock';

const dbStub = makeDbChain([]);

jest.mock('@shared/db', () => ({
  db: dbStub,
  notification_preferences: {
    user_id: 'np.user_id',
    email_enabled: 'np.email_enabled',
    telegram_enabled: 'np.telegram_enabled',
    push_enabled: 'np.push_enabled',
    order_updates: 'np.order_updates',
    production_alerts: 'np.production_alerts',
    hr_alerts: 'np.hr_alerts',
    qc_alerts: 'np.qc_alerts',
    finance_alerts: 'np.finance_alerts',
    system_alerts: 'np.system_alerts',
    updated_at: 'np.updated_at',
  },
  notificationsApp: {
    id: 'na.id', user_id: 'na.user_id', is_read: 'na.is_read', updated_at: 'na.updated_at',
  },
  runQuery: jest.fn().mockResolvedValue({ rows: [] }),
}));

import { NotificationPreferencesRepository, NotificationPrefsRow } from '../../src/modules/notifications/infrastructure/repositories/notification-preferences.repository';

const allOn: NotificationPrefsRow = {
  emailEnabled: true, telegramEnabled: true, pushEnabled: true,
  orderUpdates: true, productionAlerts: true, hrAlerts: true,
  qcAlerts: true, financeAlerts: true, systemAlerts: true,
};

describe('NotificationPreferencesRepository', () => {
  let repo: NotificationPreferencesRepository;
  beforeEach(() => {
    repo = new NotificationPreferencesRepository();
    dbStub.__setResolved([]);
  });

  describe('findByUserId', () => {
    it('returns Ok with mapped prefs when row exists', async () => {
      dbStub.__setResolved([{
        email_enabled: true, telegram_enabled: false, push_enabled: true,
        order_updates: false, production_alerts: true, hr_alerts: false,
        qc_alerts: true, finance_alerts: false, system_alerts: true,
      }]);
      const r = await repo.findByUserId(1);
      expect(r.ok).toBe(true);
      if (r.ok && r.data) {
        expect(r.data.emailEnabled).toBe(true);
        expect(r.data.telegramEnabled).toBe(false);
        expect(r.data.qcAlerts).toBe(true);
      }
    });

    it('returns Ok with null when no row', async () => {
      dbStub.__setResolved([]);
      const r = await repo.findByUserId(99);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toBeNull();
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.findByUserId(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('upsert', () => {
    it('returns Ok when upsert succeeds', async () => {
      dbStub.__setResolved(undefined);
      const r = await repo.upsert(1, allOn);
      expect(r.ok).toBe(true);
    });

    it('returns Ok when all flags off and upsert succeeds', async () => {
      dbStub.__setResolved(undefined);
      const allOff: NotificationPrefsRow = {
        emailEnabled: false, telegramEnabled: false, pushEnabled: false,
        orderUpdates: false, productionAlerts: false, hrAlerts: false,
        qcAlerts: false, financeAlerts: false, systemAlerts: false,
      };
      const r = await repo.upsert(2, allOff);
      expect(r.ok).toBe(true);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('insert fail'));
      const r = await repo.upsert(1, allOn);
      expect(r.ok).toBe(false);
    });
  });

  describe('markAllReadByUserId', () => {
    it('returns Ok with updated count when rows match', async () => {
      dbStub.__setResolved([{ id: 1 }, { id: 2 }, { id: 3 }]);
      const r = await repo.markAllReadByUserId(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.updated).toBe(3);
    });

    it('returns Ok with 0 when no unread notifications', async () => {
      dbStub.__setResolved([]);
      const r = await repo.markAllReadByUserId(1);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data.updated).toBe(0);
    });

    it('returns Err when DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.markAllReadByUserId(1);
      expect(r.ok).toBe(false);
    });
  });
});
