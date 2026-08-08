/**
 * Unit tests for the granular notification_type_preferences matrix
 * (owner-decisions batch item 7, 2026-07-09).
 *
 *   - Repository: findMatrixByUserId maps DB rows; upsertMatrix emits
 *     one INSERT ... ON CONFLICT per (user, type, channel) and is idempotent.
 *   - Service: updateMatrix persists then getMatrix reads it back (real
 *     round-trip through a stateful fake repo); empty state → all-enabled defaults.
 *
 * Repo layer uses the shared makeDbChain mock (no real DB). The DB-proof
 * (rollback-tx) verifies real persistence + ON CONFLICT idempotency separately.
 */

import { makeDbChain } from '../_setup/db-mock';
import { Ok } from '@common/result';

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
  notification_type_preferences: {
    user_id: 'ntp.user_id',
    notification_type: 'ntp.notification_type',
    channel: 'ntp.channel',
    enabled: 'ntp.enabled',
    updated_at: 'ntp.updated_at',
  },
  notificationsApp: {
    id: 'na.id', user_id: 'na.user_id', is_read: 'na.is_read', updated_at: 'na.updated_at',
  },
  runQuery: jest.fn().mockResolvedValue({ rows: [] }),
}));

import {
  NotificationPreferencesRepository,
  NotificationPreferencesRepository as RepoType,
  NotificationTypePrefRow,
} from '../../src/modules/notifications/infrastructure/repositories/notification-preferences.repository';
import { NotificationPreferencesService, NotifPrefMatrixRow } from '../../src/modules/notifications/application/notification-preferences.service';

describe('NotificationPreferencesRepository — granular matrix', () => {
  let repo: NotificationPreferencesRepository;
  beforeEach(() => {
    repo = new NotificationPreferencesRepository();
    dbStub.__setResolved([]);
    jest.clearAllMocks();
  });

  describe('findMatrixByUserId', () => {
    it('maps DB rows back to {notification_type, channel, enabled}', async () => {
      dbStub.__setResolved([
        { notification_type: 'task_assigned', channel: 'email', enabled: false },
        { notification_type: 'task_assigned', channel: 'telegram', enabled: true },
        { notification_type: 'order_status', channel: 'inApp', enabled: true },
      ]);
      const r = await repo.findMatrixByUserId(1);
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.data).toHaveLength(3);
        expect(r.data[0]).toEqual({ notification_type: 'task_assigned', channel: 'email', enabled: false });
      }
    });

    it('returns Ok([]) when the user has no saved granular rows', async () => {
      dbStub.__setResolved([]);
      const r = await repo.findMatrixByUserId(99);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.data).toEqual([]);
    });

    it('returns Err when the DB throws', async () => {
      dbStub.__setRejected(new Error('boom'));
      const r = await repo.findMatrixByUserId(1);
      expect(r.ok).toBe(false);
    });
  });

  describe('upsertMatrix', () => {
    it('emits an INSERT ... ON CONFLICT per row and returns Ok', async () => {
      dbStub.__setResolved(undefined);
      const rows: NotificationTypePrefRow[] = [
        { notification_type: 'task_assigned', channel: 'email', enabled: false },
        { notification_type: 'task_assigned', channel: 'telegram', enabled: true },
      ];
      const r = await repo.upsertMatrix(1, rows);
      expect(r.ok).toBe(true);
      expect(dbStub.insert).toHaveBeenCalledTimes(2);
      expect(dbStub.onConflictDoUpdate).toHaveBeenCalledTimes(2);
      expect(dbStub.values).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 1, notification_type: 'task_assigned', channel: 'email', enabled: false,
        }),
      );
    });

    it('is a no-op (Ok) when given an empty row list', async () => {
      dbStub.__setResolved(undefined);
      const r = await repo.upsertMatrix(1, []);
      expect(r.ok).toBe(true);
      expect(dbStub.insert).not.toHaveBeenCalled();
    });

    it('re-running the same rows stays Ok (idempotent ON CONFLICT path)', async () => {
      dbStub.__setResolved(undefined);
      const rows: NotificationTypePrefRow[] = [
        { notification_type: 'stock_low', channel: 'email', enabled: true },
      ];
      expect((await repo.upsertMatrix(2, rows)).ok).toBe(true);
      expect((await repo.upsertMatrix(2, rows)).ok).toBe(true);
    });

    it('returns Err when the DB throws', async () => {
      dbStub.__setRejected(new Error('insert fail'));
      const r = await repo.upsertMatrix(1, [{ notification_type: 't', channel: 'email', enabled: true }]);
      expect(r.ok).toBe(false);
    });
  });
});

// Stateful fake repo so updateMatrix → getMatrix is a real read-after-write round-trip.
function makeStatefulRepo(): RepoType {
  let stored: NotificationTypePrefRow[] = [];
  return {
    findMatrixByUserId: jest.fn(async () => Ok([...stored])),
    findByUserId: jest.fn(async () => Ok(null)),
    upsertMatrix: jest.fn(async (_userId: number, rows: NotificationTypePrefRow[]) => {
      for (const row of rows) {
        const idx = stored.findIndex(
          (s) => s.notification_type === row.notification_type && s.channel === row.channel,
        );
        if (idx >= 0) stored[idx] = row; else stored.push(row);
      }
      return Ok(undefined);
    }),
    upsert: jest.fn(async () => Ok(undefined)),
    markAllReadByUserId: jest.fn(async () => Ok({ updated: 0 })),
  } as unknown as RepoType;
}

describe('NotificationPreferencesService — matrix round-trip', () => {
  it('updateMatrix persists the matrix and returns it read back from the repo', async () => {
    const repo = makeStatefulRepo();
    const service = new NotificationPreferencesService(repo);
    const input: NotifPrefMatrixRow[] = [
      { key: 'task_assigned', email: false, telegram: true, inApp: true },
    ];

    const upd = await service.updateMatrix(7, input);
    expect(upd.ok).toBe(true);
    if (upd.ok) {
      const row = upd.data.find((r) => r.key === 'task_assigned');
      expect(row).toEqual({ key: 'task_assigned', email: false, telegram: true, inApp: true });
    }

    // Independent read confirms it was actually stored, not echoed.
    const got = await service.getMatrix(7);
    expect(got.ok).toBe(true);
    if (got.ok) {
      const row = got.data.find((r) => r.key === 'task_assigned');
      expect(row?.email).toBe(false);
      expect(row?.telegram).toBe(true);
      expect(row?.inApp).toBe(true);
    }
  });

  it('getMatrix returns all-enabled defaults for every canonical type when nothing is saved', async () => {
    const repo = makeStatefulRepo();
    const service = new NotificationPreferencesService(repo);
    const got = await service.getMatrix(1);
    expect(got.ok).toBe(true);
    if (got.ok) {
      expect(got.data).toHaveLength(10);
      expect(got.data.every((r) => r.email && r.telegram && r.inApp)).toBe(true);
    }
  });
});
