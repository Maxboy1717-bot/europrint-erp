/**
 * test/pos/pos-secondary-events.handler.spec.ts
 * Unit tests for PosSecondaryEventsHandler. Telegram/Notifications services + repo are mocked;
 * the pos.gateway module is mocked at file boundary.
 */

process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgres://test:test@localhost:5432/test';

jest.mock('../../src/modules/pos/presentation/pos.gateway', () => ({
  broadcastPosEvent: jest.fn(),
  broadcastToUser: jest.fn(),
  broadcastToDept: jest.fn(),
  broadcastToWarehouse: jest.fn(),
}));

// Stub heavy POS service modules so we don't pull DB/Telegram clients.
class StubPosTelegramService {}
class StubPosNotificationsService {}
class StubPosEventRepository {}
jest.mock('../../src/modules/pos/application/services/pos-telegram.service', () => ({
  PosTelegramService: StubPosTelegramService,
}));
jest.mock('../../src/modules/pos/application/services/pos-notifications.service', () => ({
  PosNotificationsService: StubPosNotificationsService,
}));
jest.mock('../../src/modules/pos/infrastructure/repositories/pos-event.repository', () => ({
  PosEventRepository: StubPosEventRepository,
}));

import { Test, TestingModule } from '@nestjs/testing';
import { PosSecondaryEventsHandler } from '../../src/modules/pos/application/event-handlers/pos-secondary-events.handler';
import { PosTelegramService } from '../../src/modules/pos/application/services/pos-telegram.service';
import { PosNotificationsService } from '../../src/modules/pos/application/services/pos-notifications.service';
import { PosEventRepository } from '../../src/modules/pos/infrastructure/repositories/pos-event.repository';
import { broadcastPosEvent } from '../../src/modules/pos/presentation/pos.gateway';

interface TgMock {
  sendNotification: jest.Mock; notifyRequestPending: jest.Mock;
}
interface NotifMock { sendNotification: jest.Mock }
interface RepoMock {
  findByRoles: jest.Mock; findOneByRole: jest.Mock; findUserTelegramId: jest.Mock;
}

function makeTg(): TgMock {
  return {
    sendNotification: jest.fn().mockResolvedValue(undefined),
    notifyRequestPending: jest.fn().mockResolvedValue(undefined),
  };
}
function makeNotif(): NotifMock {
  return { sendNotification: jest.fn().mockResolvedValue(undefined) };
}
function makeRepo(): RepoMock {
  return {
    findByRoles: jest.fn().mockResolvedValue([]),
    findOneByRole: jest.fn().mockResolvedValue(null),
    findUserTelegramId: jest.fn().mockResolvedValue(null),
  };
}

describe('PosSecondaryEventsHandler', () => {
  let handler: PosSecondaryEventsHandler;
  let tg: TgMock; let notif: NotifMock; let repo: RepoMock;

  beforeEach(async () => {
    tg = makeTg(); notif = makeNotif(); repo = makeRepo();
    (broadcastPosEvent as jest.Mock).mockClear();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        PosSecondaryEventsHandler,
        { provide: PosTelegramService, useValue: tg },
        { provide: PosNotificationsService, useValue: notif },
        { provide: PosEventRepository, useValue: repo },
      ],
    }).compile();
    handler = moduleRef.get(PosSecondaryEventsHandler);
  });

  it('notifies creator via in-app channel when request.pending event fires', async () => {
    await handler.onRequestPending({ requestId: 1, requestNumber: 'R-1', createdById: 7, departmentCode: 'DEPT' });

    expect(notif.sendNotification).toHaveBeenCalledWith(
      7, 'REQUEST_PENDING', expect.any(String), expect.any(String), 'pos_movements', undefined,
    );
    expect(tg.notifyRequestPending).toHaveBeenCalledWith(1, 'R-1', 'DEPT');
  });

  it('fans out approvals to all warehouse staff when request.approved event fires', async () => {
    repo.findByRoles.mockResolvedValue([
      { id: 10, telegramId: '111' }, { id: 11, telegramId: null },
    ]);

    await handler.onRequestApproved({ requestId: 1, requestNumber: 'R-2', createdById: 5 });

    expect(repo.findByRoles).toHaveBeenCalledWith(['warehouse_staff', 'warehouse_manager']);
    expect(tg.sendNotification).toHaveBeenCalledTimes(1);
    expect(notif.sendNotification.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('broadcasts low_stock alert via gateway when stock.low_alert event fires', () => {
    handler.onStockLow({ materialCardId: 50, warehouseId: 'W1', balance: 3, managerId: 99 });

    expect(broadcastPosEvent).toHaveBeenCalledWith('stock.alert', expect.objectContaining({
      type: 'low_stock', materialCardId: 50, balance: 3,
    }));
    expect(notif.sendNotification).toHaveBeenCalledWith(
      99, 'STOCK_LOW_ALERT', expect.any(String), expect.any(String), 'pos_movements', undefined,
    );
  });

  it('skips in-app notification when request.rejected has no createdById', async () => {
    await handler.onRequestRejected({ requestId: 1, requestNumber: 'R-3' });

    expect(notif.sendNotification).not.toHaveBeenCalled();
    expect(repo.findUserTelegramId).not.toHaveBeenCalled();
  });

  it('notifies HR managers when hr.employee.exit event fires', async () => {
    repo.findByRoles.mockResolvedValue([
      { id: 30, telegramId: '222' }, { id: 31, telegramId: null },
    ]);

    await handler.onHrEmployeeExit({ userId: 50, exitDate: '2026-06-01', departmentCode: 'DEPT' });

    expect(repo.findByRoles).toHaveBeenCalledWith(['warehouse_manager', 'pos_manager']);
    expect(broadcastPosEvent).toHaveBeenCalledWith(
      'hr.employee_exit', expect.objectContaining({ userId: 50, exitDate: '2026-06-01' }),
    );
  });
});
