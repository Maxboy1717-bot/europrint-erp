/**
 * test/notifications/deal-won-notification.listener.spec.ts
 *
 * Smoke test for the Wave 4 (pilot) `DealWonNotificationListener`. Mocks the
 * `runQuery` helper from `@shared/db` so no live DB connection is required;
 * verifies the listener instantiates, dispatches the role query, and
 * delegates one save per resolved user to the repository.
 */

// Stub uuid v14 ESM `export` so ts-jest CJS transform succeeds. Matches the
// pattern used by test/notifications/create-notification.handler.spec.ts.
let _uuidCnt = 0;
jest.mock('uuid', () => ({
  v4: () => {
    const n = (++_uuidCnt).toString(16).padStart(8, '0');
    return `${n}-0000-4000-8000-000000000000`;
  },
}));

jest.mock('@shared/db', () => ({
  runQuery: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { runQuery } from '@shared/db';
import { DealWonNotificationListener } from '../../src/modules/notifications/infrastructure/event-handlers/deal-won-notification.listener';
import { NOTIFICATION_REPO } from '../../src/modules/notifications/domain/repositories/i-notification.repo';
import { Notification } from '../../src/modules/notifications/domain/aggregates/notification.aggregate';
import { DealWonEvent } from '../../src/modules/crm/domain/events/deal-won.event';
import { Ok, Err, AppErr } from '../../src/common/result';

interface RepoMock {
  findById: jest.Mock;
  findByUserId: jest.Mock;
  findUnreadCount: jest.Mock;
  save: jest.Mock;
  markAsRead: jest.Mock;
  markAllAsRead: jest.Mock;
}

function makeRepo(): RepoMock {
  return {
    findById: jest.fn(),
    findByUserId: jest.fn(),
    findUnreadCount: jest.fn(),
    save: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
  };
}

describe('DealWonNotificationListener', () => {
  let listener: DealWonNotificationListener;
  let repo: RepoMock;
  const mockedRunQuery = runQuery as unknown as jest.Mock;

  beforeEach(async () => {
    mockedRunQuery.mockReset();
    repo = makeRepo();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        DealWonNotificationListener,
        { provide: NOTIFICATION_REPO, useValue: repo },
      ],
    }).compile();
    listener = moduleRef.get(DealWonNotificationListener);
  });

  it('saves one notification per director returned by the role query', async () => {
    mockedRunQuery.mockResolvedValueOnce({
      rows: [{ id: 11 }, { id: 22 }],
    });
    repo.save.mockImplementation(async (n: Notification) => Ok(n));

    const event = new DealWonEvent(99, 101, 5_000_000, 7, 'UZS');
    await listener.handle(event);

    expect(mockedRunQuery).toHaveBeenCalledTimes(1);
    expect(repo.save).toHaveBeenCalledTimes(2);
    const firstNotification = repo.save.mock.calls[0][0] as Notification;
    expect(firstNotification.userId).toBe('11');
    expect(firstNotification.referenceId).toBe('99');
    expect(firstNotification.referenceType).toBe('deal');
    expect(firstNotification.title).toBe('New Deal Won');
    expect(firstNotification.body).toContain('5000000');
    expect(firstNotification.body).toContain('UZS');
  });

  it('swallows query failures without throwing (logger.warn path)', async () => {
    mockedRunQuery.mockRejectedValueOnce(new Error('DB down'));

    const event = new DealWonEvent(99, 101, 5_000_000, 7, 'UZS');
    await expect(listener.handle(event)).resolves.toBeUndefined();
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('swallows individual repo.save failures without throwing', async () => {
    mockedRunQuery.mockResolvedValueOnce({ rows: [{ id: 11 }] });
    repo.save.mockResolvedValueOnce(Err(AppErr('DB_ERROR', 'unique constraint')));

    const event = new DealWonEvent(99, 101, 5_000_000, 7, 'UZS');
    await expect(listener.handle(event)).resolves.toBeUndefined();
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('does not call repo.save when no users match the role query', async () => {
    mockedRunQuery.mockResolvedValueOnce({ rows: [] });

    const event = new DealWonEvent(99, 101, 5_000_000, 7, 'UZS');
    await listener.handle(event);

    expect(mockedRunQuery).toHaveBeenCalledTimes(1);
    expect(repo.save).not.toHaveBeenCalled();
  });
});
