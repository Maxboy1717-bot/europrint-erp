/**
 * test/wms/goods-issue.handler.spec.ts
 *
 * Unit tests for GoodsIssueHandler — #08 PHASE 4/7 FIFO/FEFO batch issue.
 * IWmsRepository and EventBus are mocked (no real DB / tx).
 *
 * Covers (per directive):
 *   - FIFO: oldest-received batch consumed first (no expiry dates).
 *   - FEFO: earliest-expiry batch consumed first (dated material).
 *   - Expired batch BLOCKED.
 *   - Insufficient batch qty spans multiple batches.
 *   - No-batch fallback → aggregate warehouse_stock decrement.
 */

import { Test } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { GoodsIssueHandler, GoodsIssueCommand } from '../../src/modules/wms/application/commands/goods-issue.handler';
import { Ok, Err, AppErr, Result } from '../../src/common/result';
import { WMS_REPO } from '../../src/modules/wms/domain/repositories/wms.repository';
import { IssuableBatchLot } from '../../src/modules/wms/domain/services/batch-selection.service';

type RepoMock = {
  hasAnyBatchLots: jest.Mock<Promise<Result<boolean>>, [number, number, unknown?]>;
  getIssuableBatchLots: jest.Mock<Promise<Result<IssuableBatchLot[]>>, [number, number, unknown?]>;
  decrementBatchLot: jest.Mock<Promise<Result<void>>, [number, number, unknown?]>;
  issueFromWarehouseStock: jest.Mock<Promise<Result<void>>, [number, number, number, unknown?]>;
  withTransaction: jest.Mock;
};

function makeRepoMock(): RepoMock {
  const mock: Partial<RepoMock> = {
    hasAnyBatchLots: jest.fn().mockResolvedValue(Ok(true)),
    getIssuableBatchLots: jest.fn().mockResolvedValue(Ok([])),
    decrementBatchLot: jest.fn().mockResolvedValue(Ok(undefined)),
    issueFromWarehouseStock: jest.fn().mockResolvedValue(Ok(undefined)),
  };
  // withTransaction runs the callback directly (no real DB tx in unit tests).
  mock.withTransaction = jest
    .fn()
    .mockImplementation((cb: (tx: unknown) => Promise<unknown>) => cb({}));
  return mock as RepoMock;
}

const days = (n: number): Date => new Date(Date.now() + n * 86_400_000);

function lot(
  id: number,
  remaining: number,
  expiryDays: number | null,
  receivedDaysAgo: number,
  costPerUnit: number | null = null,
): IssuableBatchLot {
  return {
    id,
    remaining,
    expiryDate: expiryDays === null ? null : days(expiryDays),
    receivedAt: days(-receivedDaysAgo),
    costPerUnit,
  };
}

describe('GoodsIssueHandler (FIFO/FEFO batch selection)', () => {
  let handler: GoodsIssueHandler;
  let repo: RepoMock;
  let eventBus: { publish: jest.Mock };

  beforeEach(async () => {
    repo = makeRepoMock();
    eventBus = { publish: jest.fn() };
    const moduleRef = await Test.createTestingModule({
      providers: [
        GoodsIssueHandler,
        { provide: WMS_REPO, useValue: repo },
        { provide: EventBus, useValue: eventBus },
      ],
    }).compile();
    handler = moduleRef.get(GoodsIssueHandler);
  });

  it('FIFO: consumes the OLDEST-received batch first (no expiry dates)', async () => {
    // lot 1 received 30d ago (oldest), lot 2 received 5d ago (newest). No expiry → FIFO.
    repo.getIssuableBatchLots.mockResolvedValueOnce(
      Ok([lot(2, 100, null, 5), lot(1, 100, null, 30)]),
    );

    const r = await handler.execute(new GoodsIssueCommand(1, 1, 40, 7));

    expect(r.ok).toBe(true);
    // Only one batch (the oldest) covers 40 units.
    expect(repo.decrementBatchLot).toHaveBeenCalledTimes(1);
    expect(repo.decrementBatchLot).toHaveBeenCalledWith(1, 40, expect.anything());
    expect(repo.issueFromWarehouseStock).toHaveBeenCalledWith(1, 1, 40, expect.anything());
    expect(eventBus.publish).toHaveBeenCalledTimes(1);
  });

  it('FEFO: dated material consumes the EARLIEST-expiry batch first', async () => {
    // lot 2 expires in 10d (earliest), lot 1 expires in 90d. Received order is reversed
    // to prove expiry (not received) drives FEFO selection.
    repo.getIssuableBatchLots.mockResolvedValueOnce(
      Ok([lot(1, 100, 90, 60), lot(2, 100, 10, 1)]),
    );

    const r = await handler.execute(new GoodsIssueCommand(5, 1, 30, 7));

    expect(r.ok).toBe(true);
    expect(repo.decrementBatchLot).toHaveBeenCalledTimes(1);
    expect(repo.decrementBatchLot).toHaveBeenCalledWith(2, 30, expect.anything());
    expect(eventBus.publish).toHaveBeenCalledTimes(1);
  });

  it('BLOCKS issue when an expired dated batch is present', async () => {
    // lot 1 already expired (yesterday) with positive qoldiq → EP-WMS-079 BLOCK.
    repo.getIssuableBatchLots.mockResolvedValueOnce(
      Ok([lot(1, 50, -1, 30), lot(2, 50, 30, 5)]),
    );

    const r = await handler.execute(new GoodsIssueCommand(5, 1, 20, 7));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('BUSINESS_RULE_VIOLATION');
    expect(repo.decrementBatchLot).not.toHaveBeenCalled();
    expect(repo.issueFromWarehouseStock).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('SPANS multiple batches when one batch is insufficient (FIFO)', async () => {
    // Need 120; oldest batch (id 1) has 50, next (id 2) has 100. Span 50 + 70.
    repo.getIssuableBatchLots.mockResolvedValueOnce(
      Ok([lot(1, 50, null, 30), lot(2, 100, null, 10)]),
    );

    const r = await handler.execute(new GoodsIssueCommand(1, 1, 120, 7));

    expect(r.ok).toBe(true);
    expect(repo.decrementBatchLot).toHaveBeenCalledTimes(2);
    expect(repo.decrementBatchLot).toHaveBeenNthCalledWith(1, 1, 50, expect.anything());
    expect(repo.decrementBatchLot).toHaveBeenNthCalledWith(2, 2, 70, expect.anything());
  });

  it('errs when total batch qoldiq cannot cover the requested amount', async () => {
    repo.getIssuableBatchLots.mockResolvedValueOnce(
      Ok([lot(1, 10, null, 30), lot(2, 20, null, 10)]),
    );

    const r = await handler.execute(new GoodsIssueCommand(1, 1, 100, 7));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('INVALID_QUANTITY');
    expect(repo.decrementBatchLot).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('NO-BATCH fallback: decrements aggregate warehouse_stock when no batches exist', async () => {
    repo.hasAnyBatchLots.mockResolvedValueOnce(Ok(false));

    const r = await handler.execute(new GoodsIssueCommand(9, 2, 15, 7));

    expect(r.ok).toBe(true);
    expect(repo.getIssuableBatchLots).not.toHaveBeenCalled();
    expect(repo.decrementBatchLot).not.toHaveBeenCalled();
    expect(repo.issueFromWarehouseStock).toHaveBeenCalledWith(9, 2, 15, expect.anything());
    expect(eventBus.publish).toHaveBeenCalledTimes(1);
  });

  it('forwards repository error and does NOT publish when getIssuableBatchLots fails', async () => {
    repo.getIssuableBatchLots.mockResolvedValueOnce(Err(AppErr('DB_ERROR', 'connection lost')));

    const r = await handler.execute(new GoodsIssueCommand(1, 1, 5, 99));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('DB_ERROR');
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('aborts (no aggregate sync, no event) when a batch decrement fails mid-span', async () => {
    repo.getIssuableBatchLots.mockResolvedValueOnce(
      Ok([lot(1, 50, null, 30), lot(2, 100, null, 10)]),
    );
    repo.decrementBatchLot.mockResolvedValueOnce(Err(AppErr('INVALID_QUANTITY', 'race lost')));

    const r = await handler.execute(new GoodsIssueCommand(1, 1, 120, 7));

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('INVALID_QUANTITY');
    expect(repo.issueFromWarehouseStock).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });
});
