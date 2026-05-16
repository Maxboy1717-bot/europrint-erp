/**
 * test/finance/start-rental-timer.handler.spec.ts
 *
 * Unit tests for StartRentalTimerHandler. FinanceRepository is mocked.
 */

import { Test, TestingModule } from '@nestjs/testing';
import {
  StartRentalTimerHandler,
  StartRentalTimerCommand,
} from '../../src/modules/finance/application/commands/start-rental-timer.handler';
import { FINANCE_REPO } from '../../src/modules/finance/domain/repositories/i-finance.repo';

interface FakeFinanceRepo {
  getWarehouseRentalRate: jest.Mock;
  recordWarehouseRental: jest.Mock;
}

function makeRepo(overrides: Partial<{
  ratePerM2: number | null;
  rentalId: number;
}> = {}): FakeFinanceRepo {
  return {
    getWarehouseRentalRate: jest.fn().mockResolvedValue(
      overrides.ratePerM2 === null ? null : overrides.ratePerM2 ?? 1500,
    ),
    recordWarehouseRental: jest.fn().mockResolvedValue(overrides.rentalId ?? 7001),
  };
}

async function buildHandler(repo: FakeFinanceRepo): Promise<StartRentalTimerHandler> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      StartRentalTimerHandler,
      { provide: FINANCE_REPO, useValue: repo },
    ],
  }).compile();
  return module.get(StartRentalTimerHandler);
}

describe('StartRentalTimerHandler', () => {
  const startDate = new Date('2026-06-01');

  it('returns NOT_FOUND when warehouse rental rate is missing', async () => {
    const repo = makeRepo({ ratePerM2: null });
    const handler = await buildHandler(repo);

    const result = await handler.execute(
      new StartRentalTimerCommand(101, 5, 25, startDate, 7),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('NOT_FOUND');
    expect(repo.recordWarehouseRental).not.toHaveBeenCalled();
  });

  it('computes daily rate as ratePerM2 multiplied by area', async () => {
    const repo = makeRepo({ ratePerM2: 1500 });
    const handler = await buildHandler(repo);

    await handler.execute(
      new StartRentalTimerCommand(101, 5, 30, startDate, 7),
    );

    expect(repo.recordWarehouseRental).toHaveBeenCalledWith(
      expect.objectContaining({ dailyRate: 45_000, areaM2: 30 }),
    );
  });

  it('returns generated rental id when persistence succeeds', async () => {
    const repo = makeRepo({ rentalId: 9999 });
    const handler = await buildHandler(repo);

    const result = await handler.execute(
      new StartRentalTimerCommand(101, 5, 25, startDate, 7),
    );

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toBe(9999);
  });

  it('persists active status and started-by metadata', async () => {
    const repo = makeRepo();
    const handler = await buildHandler(repo);

    await handler.execute(
      new StartRentalTimerCommand(202, 9, 12, startDate, 33),
    );

    expect(repo.recordWarehouseRental).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 202,
        warehouseId: 9,
        status: 'active',
        startedBy: 33,
        startDate,
      }),
    );
  });

  it('defaults startedBy to zero when omitted', async () => {
    const repo = makeRepo();
    const handler = await buildHandler(repo);

    await handler.execute(
      new StartRentalTimerCommand(303, 5, 10, startDate),
    );

    expect(repo.recordWarehouseRental).toHaveBeenCalledWith(
      expect.objectContaining({ startedBy: 0 }),
    );
  });
});
