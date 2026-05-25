/**
 * test/logistics/assign-driver.handler.spec.ts
 * Unit tests for AssignDriverHandler. IDeliveryRepo is mocked; Delivery aggregate is real.
 */

let _uuidCnt = 0;
jest.mock('uuid', () => ({
  v4: () => {
    const n = (++_uuidCnt).toString(16).padStart(8, '0');
    return `${n}-0000-4000-8000-000000000000`;
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { AssignDriverHandler } from '../../src/modules/logistics/application/commands/assign-driver.handler';
import { AssignDriverCommand } from '../../src/modules/logistics/application/commands/assign-driver.command';
import { DELIVERY_REPO } from '../../src/modules/logistics/domain/repositories/i-delivery.repo';
import { Delivery } from '../../src/modules/logistics/domain/aggregates/delivery.aggregate';
import { DeliveryStatus } from '../../src/modules/logistics/domain/enums/delivery-status.enum';
import { Ok, Err, AppErr } from '../../src/common/result';
import { deliveryFactory } from '../_fixtures/factories';

interface RepoMock {
  findById: jest.Mock; findAll: jest.Mock; findBySalesOrderId: jest.Mock; save: jest.Mock; update: jest.Mock;
}
function makeRepo(): RepoMock {
  return { findById: jest.fn(), findAll: jest.fn(), findBySalesOrderId: jest.fn(), save: jest.fn(), update: jest.fn() };
}

function makeDelivery(status: DeliveryStatus = DeliveryStatus.PENDING): Delivery {
  const f = deliveryFactory();
  const d = Delivery.createForSalesOrder(f.customerName, f.deliveryAddress);
  d.status = status;
  return d;
}

describe('AssignDriverHandler', () => {
  let handler: AssignDriverHandler;
  let repo: RepoMock;

  beforeEach(async () => {
    repo = makeRepo();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AssignDriverHandler,
        { provide: DELIVERY_REPO, useValue: repo },
      ],
    }).compile();
    handler = moduleRef.get(AssignDriverHandler);
  });

  it('returns NOT_FOUND when delivery does not exist', async () => {
    repo.findById.mockResolvedValue(Ok(null));

    const r = await handler.execute(new AssignDriverCommand('missing', '11', 'TRUCK-1'));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('returns INTERNAL when delivery is in delivered state', async () => {
    repo.findById.mockResolvedValue(Ok(makeDelivery(DeliveryStatus.DELIVERED)));

    const r = await handler.execute(new AssignDriverCommand('id', '11', 'TRUCK-1'));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/cannot assign/i);
  });

  it('assigns driverId + vehicleNumber and switches status to assigned when pending', async () => {
    const d = makeDelivery();
    repo.findById.mockResolvedValue(Ok(d));
    repo.update.mockResolvedValue(Ok(d));

    await handler.execute(new AssignDriverCommand(d.id, '42', 'TRUCK-99'));

    expect(d.driverId).toBe(42);
    expect(d.vehicleNumber).toBe('TRUCK-99');
    expect(d.status).toBe(DeliveryStatus.ASSIGNED);
  });

  it('persists assigned fields via repo.update when assignment succeeds', async () => {
    const d = makeDelivery();
    repo.findById.mockResolvedValue(Ok(d));
    repo.update.mockResolvedValue(Ok(d));

    await handler.execute(new AssignDriverCommand(d.id, '7', 'T-1'));

    expect(repo.update).toHaveBeenCalledWith(d.id, expect.objectContaining({
      vehicleNumber: 'T-1',
      status: DeliveryStatus.ASSIGNED,
    }));
  });

  it('propagates repo error when update fails', async () => {
    repo.findById.mockResolvedValue(Ok(makeDelivery()));
    repo.update.mockResolvedValue(Err(AppErr('DB_ERROR', 'down')));

    const r = await handler.execute(new AssignDriverCommand('id', '1', 'T'));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
  });
});
