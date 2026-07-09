/**
 * test/notifications/drizzle-notification.repo.body.spec.ts
 *
 * Notifications A2: toDomain built the notification text from `row.message`, but external
 * writers (pos/cron) populate `body` and leave the drifted-nullable `message` NULL (6970/6970
 * live rows are body-only) — so the canonical /api/notifications reader returned an empty
 * message for every real row. Fixed to `body ?? message`. This pins that read.
 */

import { makeDbChain } from '../_setup/db-mock';

const dbStub = makeDbChain([]);

jest.mock('@shared/db', () => ({
  db: dbStub,
  notifications: { id: 'n.id' },
}));

import { DrizzleNotificationRepository } from '../../src/modules/notifications/infrastructure/repositories/drizzle-notification.repo';

describe('DrizzleNotificationRepository.toDomain — reads body (A2)', () => {
  let repo: DrizzleNotificationRepository;
  beforeEach(() => { repo = new DrizzleNotificationRepository(); });

  it('builds the notification text from `body` when `message` is NULL (external rows)', async () => {
    dbStub.__setResolved([{ id: 1, userId: 5, title: 'T', body: 'REAL BODY', message: null, type: 'info', isRead: false }]);
    const r = await repo.findById('1');
    expect(r.ok).toBe(true);
    if (r.ok && r.data) {
      expect(r.data.body).toBe('REAL BODY');
      expect(r.data.message).toBe('REAL BODY');
    }
  });

  it('falls back to `message` when body is absent (repo-created rows set both)', async () => {
    dbStub.__setResolved([{ id: 2, userId: 5, title: 'T', body: null, message: 'MSG', type: 'info', isRead: false }]);
    const r = await repo.findById('2');
    expect(r.ok).toBe(true);
    if (r.ok && r.data) expect(r.data.body).toBe('MSG');
  });
});
