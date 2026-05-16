/**
 * test/notifications/get-notifications.handler.spec.ts
 * Unit tests for GetNotificationsHandler. INotificationRepo is mocked.
 */

let _uuidCnt = 0;
jest.mock('uuid', () => ({
  v4: () => {
    const n = (++_uuidCnt).toString(16).padStart(8, '0');
    return `${n}-0000-4000-8000-000000000000`;
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { GetNotificationsHandler } from '../../src/modules/notifications/application/queries/get-notifications.handler';
import { GetNotificationsQuery } from '../../src/modules/notifications/application/queries/get-notifications.query';
import { NOTIFICATION_REPO } from '../../src/modules/notifications/domain/repositories/i-notification.repo';
import { Notification } from '../../src/modules/notifications/domain/aggregates/notification.aggregate';
import { Ok, Err, AppErr } from '../../src/common/result';

interface RepoMock {
  findById: jest.Mock; findByUserId: jest.Mock; findUnreadCount: jest.Mock;
  save: jest.Mock; markAsRead: jest.Mock; markAllAsRead: jest.Mock;
}
function makeRepo(): RepoMock {
  return {
    findById: jest.fn(), findByUserId: jest.fn(), findUnreadCount: jest.fn(),
    save: jest.fn(), markAsRead: jest.fn(), markAllAsRead: jest.fn(),
  };
}

function makeNotification(): Notification {
  return Notification.createForUser('u1', 'title', 'body', 'info');
}

describe('GetNotificationsHandler', () => {
  let handler: GetNotificationsHandler;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        GetNotificationsHandler,
        { provide: NOTIFICATION_REPO, useValue: repo },
      ],
    }).compile();
    handler = moduleRef.get(GetNotificationsHandler);
  });

  it('returns Ok with PaginatedResult when repo returns notifications', async () => {
    const items = [makeNotification(), makeNotification()];
    repo.findByUserId.mockResolvedValue(Ok({ items, total: 2 }));

    const r = await handler.execute(new GetNotificationsQuery('u1', {}));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.items).toHaveLength(2);
      expect(r.data.total).toBe(2);
    }
  });

  it('defaults page=1 and limit=10 when filters omit pagination', async () => {
    repo.findByUserId.mockResolvedValue(Ok({ items: [], total: 0 }));

    const r = await handler.execute(new GetNotificationsQuery('u1', {}));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.page).toBe(1);
      expect(r.data.limit).toBe(10);
    }
  });

  it('passes userId + isRead + pagination filters through to repo', async () => {
    repo.findByUserId.mockResolvedValue(Ok({ items: [], total: 0 }));

    await handler.execute(new GetNotificationsQuery('user-42', { isRead: false, page: 3, limit: 5 }));

    expect(repo.findByUserId).toHaveBeenCalledWith({
      userId: 'user-42', isRead: false, page: 3, limit: 5,
    });
  });

  it('propagates repo error when findByUserId fails', async () => {
    repo.findByUserId.mockResolvedValue(Err(AppErr('DB_ERROR', 'down')));

    const r = await handler.execute(new GetNotificationsQuery('u1', {}));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
  });
});
