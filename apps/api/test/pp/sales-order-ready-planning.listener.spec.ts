/**
 * test/pp/sales-order-ready-planning.listener.spec.ts
 *
 * Golden-thread SD→PP entry: verifies the PP listener opens a production plan when a
 * sales order is confirmed (transitions to `ready_for_planning`). The PP repository is
 * mocked, so no live DB is required — this proves the wiring (event → repo call) and
 * the status/idempotency gating, not the SQL.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { SalesOrderReadyPlanningListener } from '../../src/modules/pp/infrastructure/event-handlers/sales-order-ready-planning.listener';
import { PP_REPO } from '../../src/modules/pp/domain/repositories/pp.repository';
import { OrderStatusChangedEvent } from '../../src/modules/sd/domain/events/order-status-changed.event';
import { Ok, Err } from '../../src/common/result';

interface PpRepoMock {
  createPlanFromSalesOrder: jest.Mock;
}

function makeRepo(): PpRepoMock {
  return {
    createPlanFromSalesOrder: jest.fn(),
  };
}

describe('SalesOrderReadyPlanningListener', () => {
  let listener: SalesOrderReadyPlanningListener;
  let repo: PpRepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        SalesOrderReadyPlanningListener,
        { provide: PP_REPO, useValue: repo },
      ],
    }).compile();
    listener = moduleRef.get(SalesOrderReadyPlanningListener);
  });

  it('creates a production plan when the sales order reaches ready_for_planning', async () => {
    repo.createPlanFromSalesOrder.mockResolvedValueOnce(Ok(2));

    const event = new OrderStatusChangedEvent(42, 'pending_advance', 'ready_for_planning');
    await listener.handle(event);

    expect(repo.createPlanFromSalesOrder).toHaveBeenCalledTimes(1);
    expect(repo.createPlanFromSalesOrder).toHaveBeenCalledWith(42);
  });

  it('does NOT create a plan for non-planning status transitions', async () => {
    const event = new OrderStatusChangedEvent(42, 'draft', 'pending_approval');
    await listener.handle(event);

    expect(repo.createPlanFromSalesOrder).not.toHaveBeenCalled();
  });

  it('ignores an invalid sales order id', async () => {
    const event = new OrderStatusChangedEvent(0, 'pending_advance', 'ready_for_planning');
    await listener.handle(event);

    expect(repo.createPlanFromSalesOrder).not.toHaveBeenCalled();
  });

  it('swallows repo failures without throwing', async () => {
    repo.createPlanFromSalesOrder.mockResolvedValueOnce(Err('boom'));

    const event = new OrderStatusChangedEvent(42, 'pending_advance', 'ready_for_planning');
    await expect(listener.handle(event)).resolves.toBeUndefined();
    expect(repo.createPlanFromSalesOrder).toHaveBeenCalledTimes(1);
  });
});
